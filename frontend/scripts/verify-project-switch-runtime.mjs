/**
 * Runtime verification with pre-generated JWT (no password needed).
 * Usage: node scripts/verify-project-switch-runtime.mjs
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'

const ACCESS =
  process.env.DEVFLOW_ACCESS ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgzMDY0OTc4LCJpYXQiOjE3ODMwNjQwNzgsImp0aSI6IjlkYWU1MDRhOGI0NDRhYTJhZTRhYjc1YmY3NmYyODNkIiwidXNlcl9pZCI6ImM1OGZjMGExLWRiMjYtNDhiNC04YTI3LWQ1MWVjMjlhNDYyZSJ9.mlh8Y1qBhlCv8sTzcbm1O650pOnYgrYzF5_EKXBJRqM'
const REFRESH =
  process.env.DEVFLOW_REFRESH ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc4MzY2ODg3OCwiaWF0IjoxNzgzMDY0MDc4LCJqdGkiOiJkOTdmYzE3ZWM0Y2U0MjJlOTAwZDU2ZGZlMWZhYTI3MyIsInVzZXJfaWQiOiJjNThmYzBhMS1kYjI2LTQ4YjQtOGEyNy1kNTFlYzI5YTQ2MmUifQ.Xbs8JedBhyWVic4Ntp7c_BWn2Nvw8DWCSydoiJncbig'

async function main() {
  const meRes = await fetch(`${API}/me/context`, {
    headers: { Authorization: `Bearer ${ACCESS}` },
  })
  const me = (await meRes.json()).data
  const orgId = me.organizations.find((o) => o.slug === 'test-hack')?.id ?? me.organizations[0]?.id
  const orgProjects = me.projects.filter((p) => {
    // projects in me/context are flat; use first two distinct for switch test
    return true
  })

  const projectA = orgProjects.find((p) => p.id === 'e469fbbc-bdee-4063-829f-633857064298') ?? orgProjects[0]
  const projectB = orgProjects.find((p) => p.id === 'f309bc7e-86ff-492e-851f-14bf0d6d39fc') ?? orgProjects[1]

  if (!projectA || !projectB || projectA.id === projectB.id) {
    console.error('Need 2 distinct projects')
    process.exit(1)
  }

  console.log('Project A:', projectA.id, projectA.name)
  console.log('Project B:', projectB.id, projectB.name)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[PROJECT_SWITCH]')) console.log('BROWSER:', text)
  })

  await page.goto(BASE)
  await page.evaluate(
    ({ access, refresh, user, orgId, projectId }) => {
      localStorage.setItem('devflow_access_token', access)
      localStorage.setItem('devflow_refresh_token', refresh)
      localStorage.setItem('devflow_user', JSON.stringify(user))
      localStorage.setItem('devflow_current_org', orgId)
      localStorage.setItem('devflow_current_project', projectId)
    },
    {
      access: ACCESS,
      refresh: REFRESH,
      user: me.user,
      orgId,
      projectId: projectA.id,
    },
  )

  const startPath = `/projects/${projectA.id}/board`
  await page.goto(`${BASE}${startPath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const urlBefore = new URL(page.url()).pathname
  console.log('\nURL before switch:', urlBefore)

  await page.evaluate(() => {
    window.__PROJECT_SWITCH_TRACE__ = []
  })

  const projectSelect = page.locator('select[aria-label="Project"]')
  await projectSelect.waitFor({ timeout: 15000 })

  const options = await projectSelect.locator('option').allTextContents()
  console.log('Project dropdown options:', options)

  await projectSelect.selectOption(projectB.id)
  await page.waitForTimeout(2500)

  const urlAfter = new URL(page.url()).pathname
  console.log('URL after switch:', urlAfter)

  const trace = await page.evaluate(() => window.__PROJECT_SWITCH_TRACE__ ?? [])
  console.log('\n=== TRACE EVENTS ===')
  for (const e of trace) console.log(JSON.stringify(e))

  const handleChange = trace.find((e) => e.step === '1-handleProjectChange')
  const locationEvents = trace.filter((e) => e.step === '4-router-location')
  const shellEvents = trace.filter((e) => e.step === '3-projectShell')

  const summary = {
    sidebarMounted: trace.some((e) => e.step === '1-sidebar-mount'),
    handleProjectChangeCalled: Boolean(handleChange),
    handleProjectChange_willNavigate: handleChange?.payload?.willNavigate,
    handleProjectChange_nextPathname: handleChange?.payload?.nextPathname,
    navigateCalled: trace.some((e) => e.step === '1-navigate'),
    replaceProjectInPathCalled: trace.some((e) => e.step === '2-replaceProjectInPath'),
    locationChanged: locationEvents.some((e) => !e.payload.identical),
    locationEvents: locationEvents.map((e) => ({
      from: e.payload.previousPathname,
      to: e.payload.newPathname,
    })),
    projectShellRenderCount: shellEvents.length,
    projectShellLast: shellEvents[shellEvents.length - 1]?.payload,
    projectsContextFallback: trace.some((e) => e.step === '6-projectsContext-fallback'),
    redirectAfterSwitch: trace.filter((e) => e.step === '5-redirect'),
    appShellSetProject: trace.filter((e) => e.step === '6-setCurrentProject'),
    urlBefore,
    urlAfter,
    urlChanged: urlBefore !== urlAfter,
    expectedUrl: `/projects/${projectB.id}/board`,
    urlMatchesExpected: urlAfter === `/projects/${projectB.id}/board`,
  }

  console.log('\n=== SUMMARY ===')
  console.log(JSON.stringify(summary, null, 2))

  await browser.close()
  process.exit(summary.urlMatchesExpected ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

/** Lowercase kebab-case slug for organizations (e.g. DevFlow Org → devflow-org). */
export function generateOrganizationSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.slice(0, 63) || 'organization'
}

export function isValidOrganizationSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,63}$/.test(slug)
}

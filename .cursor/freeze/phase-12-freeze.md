# Phase 12 Freeze - Dashboard & Reporting

## Goal

Workspace and project visibility for the project management platform.

Phase 12 turns existing product data into read-only operational summaries.

Completed foundations already exist for:

* auth and identity
* organizations and projects
* project memberships and permissions
* workflow statuses and transitions
* labels
* issue core
* sprint lifecycle
* kanban board projection
* issue comments, activity, and attachments
* notifications

Phase 12 must not create new workflow behavior, issue behavior, sprint behavior, or notification delivery behavior.

---

## Scope

Purpose:
Add first-class dashboard and reporting read models.

Backend:

* workspace dashboard summary
* project report summary
* sprint health summary
* user workload summary
* recent activity feed projection

Frontend:

* dashboard page backed by API data
* project reports page
* sprint health panel
* workload/assignment panel
* recent activity panel

Data sources:

* organizations
* projects
* project memberships
* issues
* sprints
* workflow statuses
* issue activity
* notifications unread count

No new persistence is required.

---

## Backend Slices

### Slice 12.1 - Dashboard Read Selectors

Add read-only selectors for workspace dashboard metrics.

Metrics:

* total visible projects
* active projects
* active sprints
* open issues
* issues assigned to current user
* overdue issues
* unread notification count

Rules:

* visibility must respect `PermissionService.can_view_project()`
* archived projects excluded by default
* completed and cancelled sprints excluded from active counts
* done-category issues excluded from open issue counts
* selectors return plain data structures or DTOs

### Slice 12.2 - Project Report Selectors

Add read-only project reporting selectors.

Project report includes:

* total issues
* open issues
* done issues
* backlog issues
* active sprint summary
* issue counts by workflow status
* issue counts by priority
* issue counts by assignee

Rules:

* project reports require project visibility
* workflow status grouping must use existing workflow status data
* no hardcoded status names
* no status mutation

### Slice 12.3 - Sprint Health Selectors

Add read-only sprint health projection.

Sprint health includes:

* sprint id
* sprint name
* sprint status
* start date
* end date
* capacity points
* committed story points
* completed story points
* remaining story points
* issue count
* completed issue count

Rules:

* completed points come from issues in done-category workflow statuses
* remaining points exclude done-category issues
* null story points count as zero
* paused sprints are reported but not treated as active

### Slice 12.4 - Activity Feed Projection

Expose recent user-visible activity from existing `IssueActivity`.

Activity feed includes:

* actor
* event type
* issue
* project
* old value
* new value
* created at

Rules:

* activity is read-only
* activity must be filtered to projects the user can view
* newest first
* no synthetic events beyond existing activity records

### Slice 12.5 - API Layer

Supported:

GET /api/dashboard/summary
GET /api/dashboard/activity
GET /api/projects/{project_id}/reports/summary
GET /api/projects/{project_id}/reports/sprint-health
GET /api/projects/{project_id}/reports/workload

Rules:

* API responses use the existing foundation envelope
* views stay thin
* no write endpoints
* no export endpoints
* no background jobs

---

## Frontend Slices

### Slice 12.6 - Workspace Dashboard

Replace mock dashboard metrics with API-backed data.

Dashboard shows:

* visible project count
* active sprint count
* open issue count
* assigned-to-me count
* overdue issue count
* unread notification count
* recent activity

Rules:

* keep existing dashboard layout direction
* support loading, empty, and error states
* do not invent metrics that are not returned by backend

### Slice 12.7 - Project Reports Page

Replace the project reports placeholder with a real read-only reports page.

Reports page shows:

* project issue summary
* status distribution
* priority distribution
* assignee workload
* active sprint health

Rules:

* use project route context
* read from Phase 12 report APIs only
* no local-only report data
* no charting library required

### Slice 12.8 - Sprint Health Panel

Add a compact sprint health view for project reports and sprint detail.

Panel shows:

* committed points
* completed points
* remaining points
* issue completion count
* sprint date window
* sprint status

Rules:

* no burndown chart
* no velocity trend
* no forecasting

### Slice 12.9 - Activity Panel

Replace dashboard activity mock data with API-backed activity.

Rules:

* newest first
* empty state when no activity exists
* activity links may open existing issue detail drawer when issue data is present
* no realtime updates

---

## Architecture Rules

Reads:

* selectors only

Writes:

* none

Views:

* thin API views only

Permissions:

* use `PermissionService`
* no inline role checks
* no `if role ==`

Frontend:

* API clients own HTTP calls
* mapping helpers may normalize response shape
* UI components must not calculate permission-sensitive counts from raw global data

Forbidden:

* new dashboard persistence models
* migrations
* report snapshots
* business logic in views
* business logic in serializers
* workflow logic
* board mutation logic
* issue mutation logic
* sprint mutation logic
* notification generation logic

---

## Validation Requirements

Backend validation:

* dashboard summary excludes projects the user cannot view
* archived projects excluded from default dashboard counts
* open issue counts exclude done-category statuses
* active sprint count includes only active sprints
* sprint health treats null story points as zero
* project report grouping uses workflow status records, not hardcoded labels
* activity feed excludes activity from inaccessible projects
* report endpoints reject inaccessible projects with `403` or `404`
* all report endpoints are read-only

Frontend validation:

* dashboard renders loading state
* dashboard renders empty state
* dashboard renders API error state
* project reports page renders loading state
* project reports page renders empty state
* project reports page renders API error state
* no mock dashboard/report data remains on API-backed screens

Architecture validation:

* no dashboard/report model files
* no migrations
* no write APIs
* no inline permission checks
* views remain thin
* selectors remain read-only

---

## Out-of-Scope Items

* burndown charts
* velocity charts
* forecasting
* release reports
* QA reports
* financial reports
* custom dashboards
* saved filters
* report export
* CSV export
* PDF export
* scheduled reports
* background aggregation jobs
* report snapshots
* realtime dashboard updates
* websocket updates
* analytics warehouse
* time tracking
* SLA tracking
* cycle time
* lead time
* automation rules
* AI summaries
* new notification types
* new activity event types
* new issue fields
* new sprint fields
* new workflow fields

---

## Deliverable

Freeze only. Do not implement anything.

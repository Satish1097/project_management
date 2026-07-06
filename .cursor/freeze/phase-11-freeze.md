# Phase 11 Freeze — Notifications

## Scope

Goal:
Notification Center for project management platform.

Backend:

* Notification persistence
* Notification selectors
* Notification service
* Notification API

Frontend:

* Notification center page
* Notification badge/count
* Mark read
* Mark all read

---

## Notification Sources

Supported sources:

* Issue assigned
* Assignee changed
* Comment added
* Mentioned in comment (future-ready)
* Sprint assigned
* Status changed
* Attachment added

---

## Core Model

Notification

Fields:

* id
* user
* actor
* event_type
* title
* message
* is_read
* related_issue (nullable)
* created_at

Permissions:

* Users only see their own notifications.

Ordering:

* newest first

---

## API Scope

GET /api/notifications
GET /api/notifications/unread-count
POST /api/notifications/{id}/read
POST /api/notifications/read-all

---

## Frontend Scope

Notification Center

Features:

* list notifications
* unread badge
* mark read
* mark all read
* newest first

---

## Architecture Rules

Reads:

* selectors

Writes:

* services

Views:

* thin API views only

Forbidden:

* business logic in views

---

## Out of Scope

* email notifications
* push notifications
* websocket realtime
* Slack integration
* Teams integration
* notification preferences
* digest emails

---

## Deliverable

Freeze only.
Do not implement anything.

---

## Slice 11.4 — Notification Generation

Generate notifications from existing service events only (no new delivery channels):

* Assignee changed (`IssueService.update_issue`)
* Comment added (`CommentService.create_comment`)
* Status changed (`TransitionService.transition_issue`)
* Sprint assigned (`IssueService.assign_sprint`, `IssueService.bulk_assign_sprint`)
* Attachment added (`AttachmentService.upload_attachment`)

Rules:

* Reuse `notification_service.create_notification()`
* Suppress notifications when recipient is unchanged or missing
* Suppress self-notifications (actor must not notify themselves)

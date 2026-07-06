# Phase 8 Freeze: Workflow Transition Execution

## Goal
Freeze transition execution boundaries before API or board integration.

## Scope
In scope:
- `apps/workflow/services/transition_service.py`
- `apps/workflow/selectors.py`
- `apps/issues/services/*`

Out of scope:
- API
- serializers
- frontend
- board drag/drop
- workflow redesign
- automation
- bulk transitions
- comments/history

## Module Responsibility
Workflow owns:
- directional transition validation
- transition permission orchestration
- issue status mutation through `TransitionService`

Issue Core owns:
- issue persistence
- non-status issue updates
- issue selectors used by transition execution

## Business Rules
`TransitionService.transition_issue(user, issue_id, to_status_id)` must:
- validate the issue exists using issue selectors
- validate the target status exists using workflow selectors
- reject cross-project status changes
- authorize through `PermissionService.can_transition_issue(user_id, project_id)`
- reject self-transitions
- reject missing directional transitions
- update only `issue.status`
- save and return the updated issue

## Slice 8.2 Permission Alignment
Frozen permission surface:
`can_transition_issue(user_id, project_id) -> bool`

Permission behavior:
- project access only
- bool return only
- no workflow imports
- no status-specific logic
- no inline role branching

Transition execution must call only:
`permission_service.can_transition_issue(user.id, issue.project_id)`

## Layering Rules
Reads:
- selectors

Writes:
- service layer only

Forbidden:
- inline role checks
- board logic
- drag/drop logic
- issue status mutation outside transition execution
- comments/history side effects

## Validation
- valid transition succeeds
- invalid transition fails
- self-transition rejected
- cross-project rejected
- lint clean

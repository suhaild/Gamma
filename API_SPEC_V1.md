# Proposal Workflow API Spec (v1, Draft)

## Purpose

This document defines the initial backend API contract for the hackathon project.
It is designed for a Next.js backend (`app/api/.../route.ts`) and a Next.js web UI.

This is a draft intended for team alignment before implementation.

## Scope (Current Decisions)

- No org scoping in v1.
- One Teams session per project.
- Full Teams chat is not stored in backend.
- Backend stores proposal versions and metadata.
- `finalize-proposal` does not lock future proposal generation (new revisions are still allowed).

## Base

- Base URL: `/api`
- Content type: `application/json`
- ID format: string (`proj_...`, `prop_...`, `sess_...`, `job_...`)
- Time format: ISO-8601 UTC (`2026-03-12T10:00:00Z`)

## Primary Resources

- `Project`
- `ProposalVersion`
- `TeamsSession`
- `CommandJob` (async command execution result)

---

## Data Models

### Project

```json
{
  "id": "proj_123",
  "title": "RFP for enterprise CRM migration",
  "requirementText": "Detailed JD / requirement text...",
  "status": "teams_active",
  "latestProposalVersion": 3,
  "proposalCount": 3,
  "teamsSessionCreated": true,
  "createdAt": "2026-03-12T10:00:00Z",
  "updatedAt": "2026-03-12T11:15:00Z"
}
```

### ProposalVersion

```json
{
  "id": "prop_789",
  "projectId": "proj_123",
  "version": 3,
  "title": "Proposal v3",
  "content": "Full proposal markdown/text...",
  "createdBy": {
    "type": "system",
    "userId": null
  },
  "sourceType": "generate_proposal",
  "baseVersions": [1, 2],
  "isFinalizedSnapshot": true,
  "createdAt": "2026-03-12T11:12:00Z"
}
```

### TeamsSession

```json
{
  "projectId": "proj_123",
  "sessionId": "sess_456",
  "status": "created",
  "provider": "microsoft_teams",
  "teamId": "19:team-id",
  "channelId": "19:channel-id",
  "threadId": "thread-abc",
  "memberCount": 4,
  "createdAt": "2026-03-12T10:45:00Z"
}
```

### CommandJob

```json
{
  "jobId": "job_001",
  "projectId": "proj_123",
  "command": "generate_proposal",
  "status": "queued",
  "createdAt": "2026-03-12T11:00:00Z"
}
```

---

## Status Enums

### Project Status

- `draft`
- `collecting_sources`
- `generating_initial_proposal`
- `ready_for_teams_prompt`
- `teams_creating`
- `teams_active`
- `updating_proposal`
- `completed`
- `failed`

### Teams Session Status

- `pending`
- `created`
- `failed`

### Job Status

- `queued`
- `running`
- `completed`
- `failed`

---

## Endpoints

## 1) List projects and proposal summaries

### `GET /api/projects`

Returns all projects with proposal summary fields so BD can view old projects and their proposal history.

Query params:

- `page` (default `1`)
- `pageSize` (default `20`, max `100`)
- `search` (optional, matches title/requirement)
- `status` (optional)

Response `200`:

```json
{
  "items": [
    {
      "id": "proj_123",
      "title": "RFP for enterprise CRM migration",
      "status": "teams_active",
      "latestProposalVersion": 3,
      "proposalCount": 3,
      "updatedAt": "2026-03-12T11:15:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

---

## 2) Create project and start first-proposal workflow

### `POST /api/projects`

Creates a project and starts async workflow:
1. find relevant sources
2. inject context
3. generate initial proposal v1

Request:

```json
{
  "title": "RFP for enterprise CRM migration",
  "requirementText": "Detailed requirement/JD..."
}
```

Response `202`:

```json
{
  "projectId": "proj_123",
  "status": "collecting_sources"
}
```

---

## 3) Get project details and status

### `GET /api/projects/{id}`

Response `200`:

```json
{
  "project": {
    "id": "proj_123",
    "title": "RFP for enterprise CRM migration",
    "requirementText": "Detailed requirement/JD...",
    "status": "teams_active",
    "latestProposalVersion": 3,
    "proposalCount": 3,
    "teamsSessionCreated": true,
    "createdAt": "2026-03-12T10:00:00Z",
    "updatedAt": "2026-03-12T11:15:00Z"
  }
}
```

---

## 4) List proposal versions for a project

### `GET /api/projects/{id}/proposals`

Response `200`:

```json
{
  "items": [
    {
      "id": "prop_001",
      "version": 1,
      "title": "Initial proposal v1",
      "sourceType": "initial_workflow",
      "isFinalizedSnapshot": false,
      "createdAt": "2026-03-12T10:05:00Z"
    },
    {
      "id": "prop_002",
      "version": 2,
      "title": "Proposal v2",
      "sourceType": "generate_proposal",
      "isFinalizedSnapshot": true,
      "createdAt": "2026-03-12T11:12:00Z"
    }
  ]
}
```

---

## 5) Get one proposal version

### `GET /api/projects/{id}/proposals/{version}`

Response `200`:

```json
{
  "proposal": {
    "id": "prop_002",
    "projectId": "proj_123",
    "version": 2,
    "title": "Proposal v2",
    "content": "Full proposal text...",
    "sourceType": "generate_proposal",
    "baseVersions": [1],
    "isFinalizedSnapshot": true,
    "createdAt": "2026-03-12T11:12:00Z"
  }
}
```

---

## 6) Create Teams session for project

### `POST /api/projects/{id}/teams`

Creates one Teams session for the project, adds members, and posts requirement + initial proposal v1 in thread context.
Idempotent for v1 single-session rule.

Request:

```json
{
  "members": [
    {
      "name": "SME 1",
      "email": "sme1@company.com"
    },
    {
      "name": "SME 2",
      "email": "sme2@company.com"
    }
  ]
}
```

Response `201` (new session):

```json
{
  "sessionId": "sess_456",
  "status": "created"
}
```

Response `200` (already exists):

```json
{
  "sessionId": "sess_456",
  "status": "created",
  "idempotent": true
}
```

---

## 7) Get Teams session status

### `GET /api/projects/{id}/teams`

Response `200`:

```json
{
  "session": {
    "sessionId": "sess_456",
    "status": "created",
    "provider": "microsoft_teams",
    "teamId": "19:team-id",
    "channelId": "19:channel-id",
    "threadId": "thread-abc",
    "memberCount": 4
  }
}
```

---

## 8) SME ask command

### `POST /api/projects/{id}/commands/ask`

Runs clarifying Q&A against project requirement + available corpus/case-study context.

Request:

```json
{
  "question": "What assumptions were made in v1 pricing?",
  "askedBy": {
    "type": "sme",
    "userId": "user_111"
  },
  "source": {
    "type": "teams_command",
    "threadId": "thread-abc"
  }
}
```

Response `200`:

```json
{
  "answer": "Pricing assumes 12-week delivery and existing infra reuse.",
  "references": [
    {
      "type": "proposal_version",
      "version": 1
    }
  ]
}
```

---

## 9) Generate new proposal version from existing proposals

### `POST /api/projects/{id}/commands/generate-proposal`

Uses old proposal versions and optional instruction to create a new proposal version.
Async operation.

Request:

```json
{
  "baseVersions": [1, 2],
  "instruction": "Combine the strongest points and improve risk section.",
  "triggeredBy": {
    "type": "sme",
    "userId": "user_111"
  },
  "source": {
    "type": "teams_command",
    "threadId": "thread-abc"
  }
}
```

Response `202`:

```json
{
  "projectId": "proj_123",
  "jobId": "job_001",
  "status": "queued"
}
```

---

## 10) Finalize proposal (creates finalized snapshot)

### `POST /api/projects/{id}/commands/finalize-proposal`

Marks selected or latest proposal as finalized snapshot and notifies BD.
Does not lock future revisions.

Request:

```json
{
  "version": 3,
  "finalizedBy": {
    "type": "sme",
    "userId": "user_111"
  },
  "note": "Finalized for BD review."
}
```

Response `202`:

```json
{
  "projectId": "proj_123",
  "jobId": "job_002",
  "status": "queued"
}
```

---

## Optional Real-Time Updates (Recommended)

### `GET /api/projects/{id}/events` (SSE)

Use SSE so BD UI gets new proposal versions without manual refresh.

Event examples:

```text
event: proposal.created
data: {"projectId":"proj_123","version":4}
```

```text
event: proposal.finalized
data: {"projectId":"proj_123","version":3}
```

```text
event: project.status_changed
data: {"projectId":"proj_123","status":"teams_active"}
```

---

## Error Model

All non-2xx responses:

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project proj_123 does not exist.",
    "details": null
  }
}
```

Suggested error codes:

- `BAD_REQUEST`
- `VALIDATION_ERROR`
- `PROJECT_NOT_FOUND`
- `PROPOSAL_NOT_FOUND`
- `TEAMS_SESSION_ALREADY_EXISTS`
- `TEAMS_PROVIDER_ERROR`
- `COMMAND_CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## Idempotency and Concurrency Notes

- `POST /api/projects/{id}/teams` must be idempotent.
- `generate-proposal` and `finalize-proposal` are async and should return quickly.
- If two generate commands run concurrently, server should serialize version assignment (`vN+1`, `vN+2`) safely.

---

## Next.js Route Mapping (reference)

- `app/api/projects/route.ts` (`GET`, `POST`)
- `app/api/projects/[id]/route.ts` (`GET`)
- `app/api/projects/[id]/proposals/route.ts` (`GET`)
- `app/api/projects/[id]/proposals/[version]/route.ts` (`GET`)
- `app/api/projects/[id]/teams/route.ts` (`GET`, `POST`)
- `app/api/projects/[id]/commands/ask/route.ts` (`POST`)
- `app/api/projects/[id]/commands/generate-proposal/route.ts` (`POST`)
- `app/api/projects/[id]/commands/finalize-proposal/route.ts` (`POST`)
- `app/api/projects/[id]/events/route.ts` (`GET`, SSE, optional)

---

## Open Questions / TODOs

- Auth model for BD/SME commands (JWT/session and role checks).
- Exact Teams API integration contract (team/channel/thread creation and retries).
- Source retrieval/case-study indexing strategy for initial and command flows.
- Job queue and worker choice for async processing.
- Final notification mechanism to BD (in-app event vs email vs Teams).


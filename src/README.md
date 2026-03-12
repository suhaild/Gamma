# Backend Scaffold (Next.js)

This `src` scaffold mirrors the current API spec and gives a clean starting point for implementation.

## API Route Folders

- `app/api/projects`
- `app/api/projects/[id]`
- `app/api/projects/[id]/proposals`
- `app/api/projects/[id]/proposals/[version]`
- `app/api/projects/[id]/teams`
- `app/api/projects/[id]/commands/ask`
- `app/api/projects/[id]/commands/generate-proposal`
- `app/api/projects/[id]/commands/finalize-proposal`
- `app/api/projects/[id]/events`

## Backend Modules

- `lib/backend/domain/*` for business logic
- `lib/backend/infra/*` for DB/provider integrations
- `lib/backend/jobs/*` for async processing
- `lib/backend/validation/*` for request schema validation
- `lib/backend/shared/*` for common types/errors/helpers

No runtime logic is added yet; this is only initial structure.

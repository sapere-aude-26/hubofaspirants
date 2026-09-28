# HOA Authentication Adapter Contract V4

## Purpose

Stage 4 establishes an explicit compatibility boundary around the existing authentication/session implementation.

This is **not** a replacement authentication system.

## Ownership

### Authentication owns

- Login interaction
- Registration interaction
- Authentication UI state
- Session state exposure
- Sign-out contract
- Authentication-related visibility state

### Navigation owns

- Where the user is sent after an authentication action
- Portal entry routing
- Public/Home transitions

### Supabase owns

- Actual authentication backend/session provider
- Auth token/session persistence
- Auth state event source

## Adapter

The development adapter exposes:

- `openLogin(mode)`
- `openPortal(type)`
- `getSession()`
- `onAuthStateChange(callback)`
- `signOut()`

These delegate to existing production behavior.

## Critical rule

Do not create a second Supabase client or duplicate session lifecycle.

The adapter must remain a thin compatibility layer until all authentication callers have been migrated.

## Shared state contracts

These selectors remain immutable during migration:

- `.hoa-student-auth`
- `.hoa-admin-auth`
- `.hoa-app-authenticated`
- `.hoa-app-student`
- `.hoa-app-admin`
- `.admin-ui`

## Migration sequence

```text
Existing Supabase/Auth
        ↓
Authentication Adapter V4
        ↓
Student / Admin / Home callers
        ↓
Regression validation
        ↓
Legacy direct calls can be retired
```

No legacy calls are retired in Stage 4.

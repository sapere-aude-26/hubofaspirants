# HOA Free Student Portal Contract V6

## Purpose

Stage 6 establishes a compatibility boundary around the Free Student Portal without changing its production lifecycle.

## Ownership

### Free Student Portal owns

- Free student portal UI
- Student-specific portal presentation
- Portal-local controls
- Portal-local state
- Portal entry actions

### It does not own

- Global navigation implementation
- Supabase client initialization
- Global authentication backend
- Global public footer
- Header

## Critical Footer Relationship

The existing production portal has a relationship with these footer nodes:

- `#hoaGlobalPublicFooter`
- `#hoaFrontSocialFooter`
- `#hoaProfessionalFooter`
- `#hoaV653ConnectWrap`

The migration must preserve **node identity**, not merely visual output.

That means this is unsafe:

```text
old footer
   ↓
clone
   ↓
new portal
```

The safe target is:

```text
existing footer node
        ↓
explicit mount contract
        ↓
portal lifecycle
```

Until that mount contract is implemented and tested, the existing production capture/re-attachment behavior remains authoritative.

## Student State

These remain shared contracts:

- `.hoa-student-auth`
- `.hoa-app-student`
- `.hoa-app-authenticated`

## Migration rule

No production portal DOM or lifecycle code is deleted in Stage 6.

First:

1. Observe lifecycle
2. Establish mount contract
3. Verify node identity
4. Verify visibility/state
5. Verify navigation
6. Verify authentication/session behavior
7. Only then physically extract portal code

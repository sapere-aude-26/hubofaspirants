# HOA Core + Navigation Contract V3

## Purpose

Stage 3 establishes a compatibility boundary around the existing Core and Navigation runtime.

It **does not replace production functions**.

## Core

Core is responsible for:

- shared runtime utilities
- global state coordination
- Supabase/session bridge ownership
- global lifecycle compatibility
- component-to-component compatibility

Core is not responsible for:

- Home presentation
- Footer presentation
- Exam business rules
- Admin module UI

## Navigation

Navigation remains the single routing/controller authority.

Existing production functions are the source of truth.

The V3 adapter delegates to:

- `hoaOpenPortal(type)`
- `hoaOpenLogin(mode)`
- `hoaShowFrontPage()`

No second navigation implementation is created.

## Why delegation is important

If Home, Footer, Authentication, Student, or Admin each implement their own navigation, the same coupling problem will return in a different form.

Therefore:

```text
Component
    |
    v
HOA Navigation Adapter
    |
    v
Existing production navigation
```

## Protected contracts

Do not rename or remove:

- `#hoaGlobalPublicFooter`
- `#hoaFrontSocialFooter`
- `#hoaProfessionalFooter`
- `#hoaV653ConnectWrap`
- `.admin-ui`
- `.hoa-student-auth`
- `.hoa-admin-auth`
- `.hoa-app-authenticated`
- `.hoa-app-student`
- `.hoa-app-admin`

## Migration rule

First introduce the adapter.

Then migrate one caller at a time.

Then compare behavior.

Only after regression validation may legacy direct calls be removed.

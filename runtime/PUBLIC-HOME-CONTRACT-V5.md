# HOA Public Home Adapter Contract V5

## Boundary

```text
PUBLIC HOME
│
├── Home Shell
├── Poster
├── Student Options
└── Free Content
```

## Home owns

- Public landing-page presentation
- Home visibility/presentation
- Poster presentation
- Student options presentation
- Free-content presentation/modal
- Career-coming-soon presentation

## Home does not own

- Authentication backend
- Supabase client/session lifecycle
- Global navigation implementation
- Footer lifecycle
- Admin application
- Exam engine
- Result system

## Cross-component contract

```text
Home
 │
 ├── show()
 │      ↓
 │   Navigation
 │
 ├── openStudentPortal()
 │      ↓
 │   Navigation
 │
 └── openLogin()
        ↓
     Authentication
```

## Protected Footer

The Home component must not directly own or rewrite:

- `#hoaGlobalPublicFooter`
- `#hoaFrontSocialFooter`
- `#hoaProfessionalFooter`
- `#hoaV653ConnectWrap`

The Footer remains a separate global public component.

## Migration rule

The adapter delegates to existing production functions. It does not replace them.

No production Home code is deleted in Stage 5.

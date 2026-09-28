# HOA Paid Student / Application Contract V7

## Boundary

```text
PAID STUDENT / APPLICATION
│
├── Paid student UI
├── Course/enrollment UI
├── Application UI
├── Payment/application entry
└── Paid-access presentation
```

## Owns

- Paid student application presentation
- Application-local controls
- Course/enrollment presentation
- Application-local state

## Does not own

- Authentication backend
- Supabase client creation
- Global navigation
- Global footer
- Header
- Exam engine
- Result calculation

## Shared dependencies

```text
Paid Application
      │
      ├── Core Runtime
      ├── Navigation V3
      ├── Authentication V4
      └── Existing data/payment contracts
```

## Payment rule

If the production source contains an existing payment provider integration, it remains the source of truth.

The componentized architecture must eventually expose a payment adapter rather than allowing multiple components to initialize or control the payment SDK independently.

## Data rule

Application/course/payment data must eventually pass through a single data/service boundary.

No component should create independent Supabase clients.

## Migration rule

Stage 7 establishes the boundary only.

No existing application/payment code is deleted or rewritten.

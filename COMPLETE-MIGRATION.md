# HOA V12 Complete Component Separation

Production baseline: `1,751,721` bytes
SHA-256: `680cdb11c83b7d6d0e7911443da994e95c2e5f97289b511e20250ca97406541f`

## Component boundaries

### 01-core-shared — Core / Shared System
- Runtime: `hoa-core-runtime-v2.js`
- Owns: shared runtime state, Supabase infrastructure contract, startup orchestration
- Consumes: browser/document state
- Controls: application shell transition, shared infrastructure availability

### 02-navigation — Navigation
- Runtime: `hoa-navigation-runtime-v2.js`
- Owns: navigation/state transition contract
- Consumes: Core, Authentication state
- Controls: public/protected view transitions

### 03-authentication — Authentication
- Runtime: `hoa-auth-runtime-v3.js`
- Owns: session restoration, authentication state
- Consumes: Core/Supabase infrastructure
- Controls: authentication-dependent consumers

### 04-student-auth — Student Authentication Bridge
- Runtime: `hoa-student-auth-bridge-v4.js`
- Owns: student-session bridge
- Consumes: Authentication
- Controls: student-facing authenticated state

### 05-exam — Exam Engine
- Runtime: `hoa-exam-runtime-v5.js`
- Owns: exam/test runtime contract
- Consumes: Authentication, Student, content data
- Controls: exam execution

### 06-result — Result System
- Runtime: `hoa-result-runtime-v6.js`
- Owns: result/attempt/history runtime contract
- Consumes: Authentication, Student, Exam
- Controls: result/history surfaces

### 07-admin — Admin
- Runtime: `hoa-admin-runtime-v7.js`
- Owns: admin runtime
- Consumes: Authentication authorization state
- Controls: admin surfaces

### 08-developer — Developer Console
- Runtime: `hoa-developer-runtime-v8.js`
- Owns: developer diagnostics/runtime controls
- Consumes: Core, Admin authorization where required
- Controls: developer console

### 09-footer — Global Public Footer
- Runtime: `hoa-footer-runtime-v9.js`
- Owns: footer behavior contract
- Consumes: navigation/public state
- Controls: footer presentation/native-bottom mechanisms
- Protected DOM: #hoaFrontSocialFooter, #hoaV653ConnectWrap, #hoaProfessionalFooter

### 10-header — Header
- Runtime: `hoa-header-runtime-v10.js`
- Owns: header behavior contract
- Consumes: Navigation, Authentication state
- Controls: header presentation/navigation

### 11-regression — Regression / Compatibility
- Runtime: `hoa-regression-runtime-v11.js`
- Owns: backward-compatibility guards, regression checks
- Consumes: all established contracts
- Controls: compatibility protections

### 12-release — Release Guard
- Runtime: `hoa-release-runtime-v12.js`
- Owns: release-time integrity checks
- Consumes: component manifest, protected contracts
- Controls: release validation

## Dependency direction

```text
Core → Navigation → Authentication
                     ↓
          Student / Admin consumers
                     ↓
              Exam → Result

Developer Console → Core/Admin contracts
Header → Navigation/Auth state
Footer → Public/navigation state
Regression → all contracts
Release Guard → release validation
```

## Production safety
- The original production HTML remains immutable and is included for rollback.
- No production deployment is performed by this package.
- The global footer DOM is explicitly protected.
- Authentication remains a single-owner boundary.
- Header redesign is explicitly outside this migration.
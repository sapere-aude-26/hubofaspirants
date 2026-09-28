# HOA Componentized Workspace V2 — Integration Contracts

## Purpose

This workspace is the safe development layer between the current production monolith and a future componentized production build.

**Production `index.html` is not replaced by this workspace.**

## Component contract

Every component must expose:

1. Owned DOM
2. Owned CSS
3. Owned JavaScript
4. Owned state
5. Incoming dependencies
6. Outgoing dependencies
7. Public events/callbacks
8. Protected selectors
9. Initialization and teardown requirements

## Core rule

A component may not directly modify another component's private DOM.

Cross-component behavior must eventually pass through a documented adapter or public event.

## Current migration status

The current V2 workspace still contains verbatim production source snapshots. This is deliberate: it lets us migrate one boundary at a time without inventing new behavior.

## Protected footer contract

The following IDs are immutable runtime contracts:

- `#hoaGlobalPublicFooter`
- `#hoaFrontSocialFooter`
- `#hoaProfessionalFooter`
- `#hoaV653ConnectWrap`

The Free Student Portal currently captures/re-attaches original footer nodes. Until that lifecycle is replaced with an explicit mount contract, footer nodes must not be cloned or independently re-created.

## Header contract

Header is mapped and protected. No redesign is included in V2.

## Authentication contract

Authentication state is shared application state. Student/Admin/Public visibility selectors must remain stable until a state adapter is implemented.

## Navigation contract

Navigation remains a shared service. Home, Authentication, Student, Admin and Developer components must not create competing global navigation controllers.

## Supabase contract

Supabase/session access remains a shared service. Component migration must not duplicate client initialization or session listeners.

## Migration rule

**Extract → Adapter → Validate → Integrate → Regression test → Only then remove monolith code.**

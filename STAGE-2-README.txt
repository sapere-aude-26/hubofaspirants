HOA V12 — STAGE 2 COMPONENT WIRING

component-staging.html is a SAFE VALIDATION HARNESS.
It does not replace index.html and does not change production behavior.

It loads the current index.html unchanged, then injects the existing V12
compatibility adapters into the iframe and audits:
- runtime adapter availability
- protected footer node identity/presence
- header contract presence
- component registry

This stage is intentionally not a production componentized replacement.
The migration contract requires:
Extract → Adapter → Validate → Integrate → Regression test → remove monolith.

Next step after browser validation is controlled integration of one component
boundary at a time.

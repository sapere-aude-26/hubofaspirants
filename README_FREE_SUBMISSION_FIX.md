# HOA Free Test — Submission/Review Fix

## Fixes
- Corrected `hoa_free_test_review` JSONB indexing by casting `WITH ORDINALITY` indexes from `bigint` to `integer`.
- Preserved the unified paid/free examination engine; only the Free attempt adapter remains different.
- Retained the authoritative Free attempt ID in the shared frontend state even when no authenticated `currentStudent` exists.
- Submission continues to use `hoa_free_test_submit`; result rendering remains non-blocking if historical review is temporarily unavailable.

## Verified flow
`hoa_free_test_start` → shared `startSavedTest` → `hoa_free_test_submit` → `hoa_free_test_review`
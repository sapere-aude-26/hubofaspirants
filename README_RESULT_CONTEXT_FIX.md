HOA Phase 2.1 — Result/Mock Course Context Fix

Changes:
- Removed the duplicate candidateResultsList used by the Mock Test Course.
- Mock Course Results now renders into hoaV650MockCandidateResultsList.
- Mock Course results are scoped to tests assigned to that course.
- View Attempt keeps the Mock Course origin and returns to its Results tab.
- Back from the main result restores the exact originating Mock Test Course.
- Historical attempt cache prefers the authoritative secure review data.
- Current submission readback selects the exact attempt ID before any fallback.

No database schema change in this release; it uses the existing secure attempt/review RPCs.
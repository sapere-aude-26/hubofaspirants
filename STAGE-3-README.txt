HOA V12 — Stage 3 Functional Regression

Purpose
-------
Validate the componentized staging build before any production merge.

Safety
------
- This package does not modify index.html.
- It does not modify Supabase data.
- It does not change authentication state by itself.
- It does not change the header or footer.
- Run it only on staging-v12-componentized.

Files
-----
stage3-regression.html
    Functional regression harness. It loads staging index.html and performs
    non-destructive smoke checks plus a manual regression checklist.

How to use
----------
1. Put stage3-regression.html in the root of staging-v12-componentized.
2. Open it through the staging web server / GitHub Pages staging environment.
3. Click "Run smoke audit".
4. Complete the manual checklist using a TEST student/admin account.
5. Record any failure before proceeding to Stage 4.

Do NOT
------
- Do not merge staging into main yet.
- Do not change GitHub Pages for production.
- Do not test destructive admin operations on production data.
- Do not edit the production index.html as part of this stage.

Exit criteria
-------------
Stage 3 is complete only when:
A) Stage 2 runtime audit is fully green.
B) Automated smoke audit has no FAIL entries.
C) Public Home/navigation works.
D) Student authentication and portal work.
E) Paid/application route remains reachable.
F) Exam open/timer/navigation/submission work.
G) Results load.
H) Admin login/dashboard work.
I) Developer Console works.
J) Header and protected footer are visually/functionally unchanged.
K) No new critical browser-console/runtime errors are observed.

If a test fails
---------------
Do not patch immediately. Capture:
- exact failing action
- screenshot
- browser console error
- network error, if any
- URL/path
Then isolate the owning component before making a change.

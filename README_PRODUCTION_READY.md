# HUB OF ASPIRANTS — Production-Ready Candidate Build

Base: last verified working Blue + Yellow-Gold build with compact result, unified Free/Paid exam engine, Clear Response integrity fix, Home-only Admin button, and empty Home bar removal.

## Production hardening applied
- Pinned the browser Supabase SDK to `@supabase/supabase-js@2.117.2` instead of the floating `@2` CDN tag.
- Added mobile viewport/safe-area metadata for phone browsers.
- Added touch-safe interaction and dynamic viewport sizing to the existing live-exam shell without changing its structure.
- Removed the Free Candidate email-login path that used a privileged Edge Function to reset the account password before login; the normal Supabase Auth login path is now used.
- Corrected Free Candidate registration to use the actual Free Test gate password rather than the stale `HOA_FREE_2026!` value.
- Applied the database hardening migration in `db/production_hardening_student_access_rpc.sql`.
- Replaced the SECURITY DEFINER `student_questions` view implementation with a security-invoker view backed by a narrowly scoped secure RPC that returns question text/options only.
- Removed anonymous EXECUTE access from paid/admin-only RPCs while retaining authenticated access.

## Mobile and laptop target
The exam shell keeps one authoritative layout for desktop and mobile. On small screens the question pane and candidate navigation remain scroll-safe, the action controls remain reachable, and the browser safe area is respected.

## Manual Supabase setting still required
Enable **Leaked Password Protection** in Supabase Auth settings. The Supabase security advisor reports this setting as disabled. This is an Auth dashboard/management setting and is not exposed by the connected database tooling.

## Validation performed
- JavaScript syntax validation for every bundled `.js` file.
- No duplicate HTML IDs.
- Local asset reference checks.
- Supabase security advisor reviewed after hardening.
- Free Test submit/review RPC path re-verified.

## Deployment
Replace the deployed frontend with the contents of this package. Keep the `css/`, `js/`, `assets/`, and `db/` structure intact. The database hardening is already applied to the live Supabase project; the SQL file is retained for audit/reproducibility.
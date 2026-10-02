# HOA Launch / Submission / Dashboard Flash Fix

Applied to the unified Free/Paid exam-engine build.

## 1. Post-submit violation warning
The unified integrity runtime now enters a finalizing state synchronously at the beginning of `submitTest(true)`.
This disables violation detection before awaited Supabase submission/review calls and before fullscreen exit/result rendering.
If secure submission fails, integrity is restored so the student can retry.

## 2. Home dashboard flash during exam launch
The launch path hides the normal Home/Auth/Student/Admin/footer/portal surfaces before fullscreen and countdown work.
The same guard is applied when a valid test is selected and when the Start Exam readiness button is confirmed.
The actual exam remains owned by the unified engine.

## 3. Free Test direct-route bootstrap race
A Free Test URL (`hoa_free_page=test`) is now detected as an early route in the document head.
The public Home/Auth/Dashboard surfaces are hidden immediately, and the normal session/test bootstrap is skipped on that route.
The Free Test controller alone prepares and injects the test into the shared exam engine.

## 4. Previous Admin dashboard flash
Admin login now initializes/reparents the authoritative Admin reference shell while `#home` is still hidden.
Only after that shell is ready is the Home container revealed, preventing the legacy dashboard from appearing for a moment.

## Validation
- JavaScript syntax checked for the modified runtime, student controller, app, and result controller.
- Live Supabase Free Test submit/review path remains verified end-to-end from the previous fix.
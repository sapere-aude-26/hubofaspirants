# HOA Unified Exam Engine — Free Test Start Fix

Fixed the Free Content Test launch path so the shared examination engine starts after the instruction checkbox is confirmed.

Changes:
- Added the missing `requestHOAExamFullscreenFromGesture()` implementation to the actual loaded `js/admin-course-student.js` source.
- Made the shared engine explicitly exclude `mode: "free"` from the Admin Preview branch.
- Paid and Free tests continue to use the same exam engine; only the attempt/storage adapter differs.
- No student-facing legacy Free Test engine was reintroduced.
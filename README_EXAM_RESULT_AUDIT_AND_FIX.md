# HOA Exam / Result Audit & Consolidation — V3

This build consolidates the student-facing exam/result navigation behavior while preserving the existing secure paid-test submission RPCs.

## Paid Mock Tests
- `Mock Test Course -> Tests -> Start Test -> Instructions -> Start Exam -> Active Exam -> Submit -> Result -> View Attempt -> Back to Results/Course`.
- Result and review actions are intercepted by one authoritative controller: `js/exam-result-controller-v3.js`.
- Mock-course result rendering uses a dedicated `hoaV650MockCandidateResultsList` and filters by the active mock test batch.
- Review reads `get_student_attempt_summary` and `get_attempt_review_v4`.
- The exact originating mock-course batch is stored in `window.__hoaExamReturnContext` / `window.__hoaCurrentMockCourseId`.
- Expected navigation operations suppress only the global background-operation toast while their state transition is in progress.

## Free Tests
- Free test links add `hoa_exam_v3=1`.
- Legacy Free Test boot is skipped for that route.
- Free Test has an instructions/readiness stage, fullscreen request on `Start Exam`, isolated exam surface, shared exam-integrity monitor, sticky navigation, separate green submit zone, green submit confirmation, server submission, automatic answer review, and return to the Free Content library.
- `hoa_free_test_review` returns the immutable secure question snapshot plus submitted answers, correct options, and explanations.

## Submit dialog
The paid submit confirmation `#missionSubmitConfirmBtn` and its confirmation surface use a green submit action with white text. Free Test uses the matching green submit confirmation.

## Folder structure
`css/`, `js/`, and `assets/` remain separate and the HTML references them with relative paths.
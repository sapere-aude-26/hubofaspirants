# HOA Unified Examination Engine — Paid + Free

Both Paid Mock Tests and Free Content Tests use the same student examination engine and interaction lifecycle. Only the attempt/storage adapter differs: Paid uses `attempts`/`answers`; Free uses `free_test_attempts`.

## Single runtime
`js/exam-runtime-unified-v4.js` is the sole active frontend integrity/control runtime. Legacy integrity and duplicate Phase 1 control scripts were removed.

## Active flow
Test/course → Instructions → Start Exam → fullscreen/immersive launch → countdown → active exam → submit confirmation → secure submission → result/review.

## Controls
Previous, Mark for Review & Next, Clear Response, Save & Next, and isolated Submit Test use one delegated controller.

## Free test
Free tests call `hoa_free_test_prepare` for safe question payloads, then enter the same `startSavedTest` engine. Attempt creation/submission/review is delegated to the Free adapter (`hoa_free_test_start`, `hoa_free_test_submit`, `hoa_free_test_review`).
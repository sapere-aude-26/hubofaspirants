# Clear Response / Integrity False-Positive Fix

Changes in `js/exam-runtime-unified-v4.js`:

- Clear Response is explicitly treated as an internal examination interaction.
- Internal interaction grace period for Clear Response increased to 2.2 seconds to cover the button click and question re-render.
- All normal controls inside the exam are marked as internal activity on pointer interaction and keyboard interaction.
- The global `blur` integrity check is debounced and only becomes a violation when the document remains genuinely unfocused after the transient interaction window.
- Normal in-page focus changes and re-rendering therefore cannot generate a violation.
- Actual tab/window loss remains covered by the existing visibility and focus checks.
- No change to scoring, answer storage, submission, or the unified Free/Paid exam engine.

Validation:
- `node --check js/exam-runtime-unified-v4.js` passed.
- Only one `exam-runtime-unified-v4.js` script inclusion is present in `index.html`.
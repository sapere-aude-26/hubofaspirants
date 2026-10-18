/* HOA P47: permanently remove the Free Student "another number / switch account" control.
   A mutation observer catches legacy UI fragments injected by older scripts after load. */
(function () {
  'use strict';
  var selector = 'button, a, [role="button"], input[type="button"], input[type="submit"], [onclick], [tabindex]';
  var textPattern = /\b(?:switch\s+(?:free\s+student\s+)?account|use\s+(?:another|a\s+different|different)\s+(?:mobile\s+)?number|(?:another|different)\s+(?:mobile\s+)?number|change\s+(?:the\s+)?(?:mobile\s+)?number|switch\s+(?:to\s+)?another\s+(?:mobile\s+)?number)\b/i;
  var attrPattern = /hoaSwitchFreeAccount|switch.?free.?account/i;

  try { delete window.hoaSwitchFreeAccount; } catch (_) { window.hoaSwitchFreeAccount = undefined; }

  function cleanLabel(value) {
    return String(value || '').replace(/[\s\u00a0]+/g, ' ').trim();
  }
  function isForbiddenControl(el) {
    if (!el || el.nodeType !== 1) return false;
    var attrs = [el.id, typeof el.className === 'string' ? el.className : '', el.getAttribute('onclick'), el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-action')].join(' ');
    if (attrPattern.test(attrs)) return true;
    var label = cleanLabel([
      el.innerText,
      el.textContent,
      el.getAttribute('aria-label'),
      el.getAttribute('title'),
      el.value
    ].filter(Boolean).join(' '));
    return textPattern.test(label);
  }
  function scrub(root) {
    if (!root) return;
    var nodes = [];
    if (root.nodeType === 1 && root.matches && root.matches(selector)) nodes.push(root);
    if (root.querySelectorAll) nodes.push.apply(nodes, root.querySelectorAll(selector));
    nodes.forEach(function (el) {
      if (isForbiddenControl(el)) {
        el.remove();
        window.__HOA_P47_SWITCH_ACCOUNT_REMOVED__ = (window.__HOA_P47_SWITCH_ACCOUNT_REMOVED__ || 0) + 1;
      }
    });
  }

  function start() {
    scrub(document);
    if (!document.body || window.__HOA_P47_SWITCH_ACCOUNT_OBSERVER__) return;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === 'childList') record.addedNodes.forEach(function (node) { scrub(node); });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__HOA_P47_SWITCH_ACCOUNT_OBSERVER__ = observer;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('load', start, { once: true });
})();

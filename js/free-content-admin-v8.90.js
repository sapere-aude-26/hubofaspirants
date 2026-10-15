/* HOA V8.90 — Free Content Admin Tabs, audited direct controller
 * This script is the sole owner of the static Content / Students / Results tabs.
 * Direct button binding avoids delegated-click conflicts; a MutationObserver
 * rebinds if a legacy runtime replaces any of these controls.
 */
(function () {
  'use strict';
  // A stale/partially initialized copy may have set the guard without exporting
  // the API. Only skip a duplicate load when the usable API really exists.
  if (window.__HOA_FREE_CONTENT_DIRECT_TABS_V2__ && typeof window.hoaV89FreeContentAPI?.activate === 'function') return;
  window.__HOA_FREE_CONTENT_DIRECT_TABS_V2__ = true;
  window.__HOA_FREE_CONTENT_V89__ = true;

  const $ = (id) => document.getElementById(id);
  const panel = () => $('adminSectionFreeContentPanel');
  const client = () => window.supabaseClient || null;
  const esc = window.escapeHTML || ((v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m])));
  const validTargets = new Set(['content', 'students', 'results']);
  const inFlight = new Map();
  let resultsModulePromise = null;
  let tabObserver = null;

  function markerOff() {
    const b = $('adminNavFreeContent');
    if (!b) return;
    b.classList.remove('active', 'v13-active');
    b.removeAttribute('aria-current');
    b.style.setProperty('border-left', '0', 'important');
    b.style.setProperty('border-left-color', 'transparent', 'important');
    b.style.setProperty('box-shadow', 'none', 'important');
  }

  function tabs() {
    const p = panel();
    return p ? [...p.querySelectorAll('#hoaV611FreeTabs [data-free-area], .hoa-v75-free-toolbar [data-hoa-v75-tab]')] : [];
  }

  function areas() {
    const p = panel();
    return p ? [...p.querySelectorAll('.hoa-v611-free-area[data-free-area], .hoa-v75-free-area[data-hoa-v75-area]')] : [];
  }

  function targetOf(node) {
    return node?.dataset?.hoaV75Tab || node?.dataset?.freeArea || '';
  }

  function setTabMessage(target, message, error = false) {
    const host = target === 'students' ? $('hoaV70Profiles')
      : target === 'results' ? $('hoaV70FreeResults')
      : $('hoaV70AdminList');
    if (host) {
      let box = host.querySelector('[data-hoa-free-tab-message]');
      if (!box) {
        box = document.createElement('div');
        box.dataset.hoaFreeTabMessage = '1';
        box.className = 'emptyState';
        host.prepend(box);
      }
      box.textContent = message || '';
      box.style.color = error ? '#b42318' : '';
      box.setAttribute('role', error ? 'alert' : 'status');
    }
    const m = $('hoaV70AdminMsg');
    if (m) {
      m.textContent = message || '';
      m.style.color = error ? '#b42318' : '';
    }
  }

  function renderActive(target) {
    if (!validTargets.has(target)) target = 'content';
    tabs().forEach((b) => {
      const active = targetOf(b) === target;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
      b.setAttribute('aria-controls', target === 'students' ? 'hoaV70Profiles' : target === 'results' ? 'hoaV70FreeResults' : 'hoaV70AdminList');
    });
    areas().forEach((area) => {
      const areaTarget = area.dataset.hoaV75Area || area.dataset.freeArea;
      const active = areaTarget === target;
      area.classList.toggle('active', active);
      area.setAttribute('aria-hidden', String(!active));
      if (active) {
        area.removeAttribute('hidden');
        area.style.setProperty('display', 'block', 'important');
      } else {
        area.setAttribute('hidden', '');
        area.style.setProperty('display', 'none', 'important');
      }
    });
    const p = panel();
    if (p) p.dataset.hoaFreeActiveTab = target;
    markerOff();
  }

  function showLoadError(target, error) {
    const message = String(error?.message || error || 'Unknown error');
    const label = target === 'students' ? 'Free Students' : target === 'results' ? 'Free Test Results' : 'Free Content';
    setTabMessage(target, `Could not load ${label}: ${message}`, true);
    console.error('[HOA V8.90 Free Content audit-fix]', target, error);
  }

  async function loadContent() {
    const fn = window.hoaV70LoadAdmin;
    if (typeof fn !== 'function') throw new Error('Free Content data loader is unavailable. Check that js/hoa-runtime-stage2-v8.19.js loaded.');
    await fn();
    const count = $('hoaV70FreeCount');
    const stats = $('hoaV611ContentStat');
    if (count && stats) count.textContent = stats.textContent || count.textContent;
    const message = $('hoaV70AdminMsg');
    if (message) { message.textContent = ''; message.style.color = ''; }
  }

  async function loadFreeStudents() {
    const host = $('hoaV70Profiles');
    if (!host) throw new Error('Free Students panel is missing from admin.html.');
    const c = client();
    if (!c || typeof c.rpc !== 'function') throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
    host.innerHTML = '<div class="emptyState">Loading Free Students…</div>';
    const result = await c.rpc('hoa_admin_free_student_list');
    if (result?.error) throw result.error;
    const rows = Array.isArray(result?.data) ? result.data : [];
    host.innerHTML = rows.length
      ? '<div class="hoa-v72-inline-tools"><input type="search" id="hoaV89FreeStudentsSearch" placeholder="Search name, mobile, email or college…" aria-label="Search Free Students"></div>'
        + '<div class="table-responsive"><table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Preparing For</th><th>College</th><th>Year</th><th>Address</th><th>Action</th></tr></thead><tbody>'
        + rows.map((x, i) => '<tr data-free-student-row data-hoa-v89-index="' + i + '"><td>' + esc(x.full_name || '') + '</td><td>' + esc(x.mobile || '') + '</td><td>' + esc(x.email || '') + '</td><td>' + esc(x.preparing_for || '') + '</td><td>' + esc(x.college_name || '') + '</td><td>' + esc(x.passout_year || '') + '</td><td>' + esc(x.address || '') + '</td><td><button type="button" class="secondary hoa-v70-delete-student" data-free-student-id="' + esc(x.id) + '">Delete</button></td></tr>').join('')
        + '</tbody></table></div>'
      : '<div class="emptyState">No Free Student registrations found.</div>';
    const search = $('hoaV89FreeStudentsSearch');
    search?.addEventListener('input', () => {
      const q = String(search.value || '').trim().toLowerCase();
      host.querySelectorAll('[data-free-student-row]').forEach((row) => { row.hidden = !!q && !row.textContent.toLowerCase().includes(q); });
    });
    host.querySelectorAll('[data-free-student-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (typeof window.hoaV70DeleteFreeStudent !== 'function') {
          setTabMessage('students', 'Free Student deletion handler is unavailable.', true);
          return;
        }
        try {
          await window.hoaV70DeleteFreeStudent(btn.dataset.freeStudentId);
          if (panel()?.dataset.hoaFreeActiveTab === 'students') await loadFreeStudents();
        } catch (e) { showLoadError('students', e); }
      });
    });
    setTabMessage('students', `${rows.length} Free Student record${rows.length === 1 ? '' : 's'} loaded.`);
  }

  function ensureResultsModule() {
    if (typeof window.hoaV89InstallFreeResults === 'function') return Promise.resolve();
    if (resultsModulePromise) return resultsModulePromise;
    resultsModulePromise = new Promise((resolve, reject) => {
      // Existing script tags may have already fired load/error. Only trust the
      // exported initializer, not the presence of an element ID.
      const existing = $('hoaV89FreeResultsJs');
      if (existing && existing.dataset.hoaLoadState === 'error') {
        existing.remove();
      } else if (existing && existing.dataset.hoaLoadState === 'loading') {
        existing.addEventListener('load', () => typeof window.hoaV89InstallFreeResults === 'function' ? resolve() : reject(new Error('Free Test Results script loaded without an initializer.')), { once: true });
        existing.addEventListener('error', () => reject(new Error('Unable to load Free Test Results manager.')), { once: true });
        return;
      } else if (existing && typeof window.hoaV89InstallFreeResults !== 'function') {
        // Use a uniquely identified retry instead of waiting for an event that
        // may already have happened on the stale script element.
        const oldRecovery = $('hoaV89FreeResultsJsAuditRetry');
        if (oldRecovery) oldRecovery.remove();
        const script = document.createElement('script');
        script.id = 'hoaV89FreeResultsJsAuditRetry';
        script.src = '/js/free-results-admin-v8.90.js?v=20261015-free-sections-v3-retry';
        script.dataset.hoaLoadState = 'loading';
        script.onload = () => {
          script.dataset.hoaLoadState = 'loaded';
          typeof window.hoaV89InstallFreeResults === 'function' ? resolve() : reject(new Error('Free Test Results manager loaded but did not initialize.'));
        };
        script.onerror = () => { script.dataset.hoaLoadState = 'error'; reject(new Error('Unable to load Free Test Results manager.')); };
        document.body.appendChild(script);
        return;
      }
      const linkId = 'hoaV89FreeResultsCssAuditV2';
      if (!$(linkId)) {
        const link = document.createElement('link');
        link.id = linkId; link.rel = 'stylesheet'; link.href = '/css/free-results-admin-v8.90.css?v=20261015-free-sections-v3';
        link.onerror = () => console.warn('Free Test Results styles could not load.');
        document.head.appendChild(link);
      }
      const script = document.createElement('script');
      script.id = 'hoaV89FreeResultsJsAuditV2'; script.src = '/js/free-results-admin-v8.90.js?v=20261015-free-sections-v3';
      script.dataset.hoaLoadState = 'loading';
      script.onload = () => { script.dataset.hoaLoadState = 'loaded'; typeof window.hoaV89InstallFreeResults === 'function' ? resolve() : reject(new Error('Free Test Results manager loaded without an initializer.')); };
      script.onerror = () => { script.dataset.hoaLoadState = 'error'; reject(new Error('Unable to load Free Test Results manager.')); };
      document.body.appendChild(script);
    }).catch((e) => { resultsModulePromise = null; throw e; });
    return resultsModulePromise;
  }

  async function loadFreeResults() {
    const host = $('hoaV70FreeResults');
    if (!host) throw new Error('Free Test Results panel is missing from admin.html.');
    host.innerHTML = '<div class="emptyState">Loading Free Test Results…</div>';
    await ensureResultsModule();
    if (typeof window.hoaV89InstallFreeResults !== 'function') throw new Error('Free Test Results manager did not initialize.');
    if (window.hoaV89FreeResults && typeof window.hoaV89FreeResults.loadRows === 'function') await window.hoaV89FreeResults.loadRows();
    else await window.hoaV89InstallFreeResults();
    setTabMessage('results', 'Free Test Results loaded.');
  }

  async function activate(target) {
    if (!validTargets.has(target)) return;
    renderActive(target); // Switch the UI synchronously, before any network request.
    const existing = inFlight.get(target);
    if (existing) return existing;
    const request = (async () => {
      try {
        if (target === 'content') await loadContent();
        else if (target === 'students') await loadFreeStudents();
        else await loadFreeResults();
      } catch (e) { showLoadError(target, e); }
    })();
    inFlight.set(target, request);
    try { await request; } finally { if (inFlight.get(target) === request) inFlight.delete(target); }
  }

  function bindTabButtons() {
    tabs().forEach((button) => {
      if (button.dataset.hoaFreeDirectBound === 'v2') return;
      button.dataset.hoaFreeDirectBound = 'v2';
      // Direct binding: no dependence on event bubbling/delegation or legacy
      // delegated listeners. Assignment replaces stale inline handlers.
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        void activate(targetOf(button));
      };
      button.style.pointerEvents = 'auto';
      button.style.position = 'relative';
      button.style.zIndex = '1';
    });
  }

  function setupTabs() {
    const p = panel();
    if (!p) return false;
    p.dataset.hoaAdminWorkspace = 'free-content';
    bindTabButtons();
    const current = p.dataset.hoaFreeActiveTab || targetOf(tabs().find((b) => b.classList.contains('active'))) || 'content';
    renderActive(current);
    markerOff();
    if (!tabObserver && document.body && typeof MutationObserver !== 'undefined') {
      tabObserver = new MutationObserver(() => {
        const currentPanel = panel();
        if (currentPanel) bindTabButtons();
      });
      tabObserver.observe(p, { childList: true, subtree: true });
    }
    return true;
  }

  async function load(force = false) {
    setupTabs();
    const p = panel();
    const target = p?.dataset.hoaFreeActiveTab || 'content';
    if (!force && p?.dataset.hoaFreeInitialLoaded === '1' && target === 'content') return;
    await activate(target);
    if (p) p.dataset.hoaFreeInitialLoaded = '1';
  }

  window.hoaV89OpenFreeContent = () => load(false);
  window.hoaV89RefreshFreeContent = () => load(true);
  window.hoaV89FreeContentAPI = { load, refresh: () => load(true), setupTabs, markerOff, activate };

  setupTabs();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupTabs, { once: true });
})();

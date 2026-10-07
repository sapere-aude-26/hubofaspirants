/* HUB OF ASPIRANTS — Custom PDF Viewer v2
 * Continuous multi-page PDF viewer with selectable text and document search.
 * PDF.js is loaded lazily, only when the first PDF is opened.
 */
(function (window, document) {
  'use strict';

  const PDFJS_VERSION = '6.4.299';
  const CDN_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;
  const FALLBACK_BASE = `https://raw.githubusercontent.com/mozilla/pdf.js/v${PDFJS_VERSION}/build`;
  let pdfjsPromise = null;
  let active = null;
  let modalKeydownBound = false;

  const isPdfUrl = (value) => {
    try {
      const u = new URL(value, location.href);
      return /\.pdf(?:$|[?#])/i.test(u.pathname + u.search + u.hash) || /(?:^|[?&])format=pdf(?:&|$)/i.test(u.search);
    } catch (_) {
      return /\.pdf(?:$|[?#])/i.test(String(value || ''));
    }
  };

  async function loadPdfJs() {
    if (pdfjsPromise) return pdfjsPromise;
    pdfjsPromise = (async () => {
      let lastError;
      for (const base of [CDN_BASE, FALLBACK_BASE]) {
        try {
          const lib = await import(`${base}/pdf.min.mjs`);
          lib.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
          return lib;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error('PDF viewer library could not be loaded.');
    })();
    try {
      return await pdfjsPromise;
    } catch (err) {
      pdfjsPromise = null;
      throw err;
    }
  }

  function ensureModal() {
    let modal = document.getElementById('hoaPdfViewerModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'hoaPdfViewerModal';
    modal.className = 'hoa-pdf-viewer-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="hoa-pdf-viewer-backdrop" data-pdf-close></div>
      <section class="hoa-pdf-viewer-shell" role="dialog" aria-modal="true" aria-labelledby="hoaPdfViewerTitle">
        <header class="hoa-pdf-viewer-toolbar">
          <div class="hoa-pdf-viewer-title-wrap">
            <button class="hoa-pdf-viewer-icon" type="button" data-pdf-close aria-label="Close PDF viewer">×</button>
            <div class="hoa-pdf-viewer-title" id="hoaPdfViewerTitle">PDF Document</div>
          </div>
          <div class="hoa-pdf-viewer-controls" role="toolbar" aria-label="PDF controls">
            <div class="hoa-pdf-toolbar-group hoa-pdf-toolbar-group-search">
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn hoa-pdf-toolbar-btn-search" data-pdf-search-toggle title="Search document" aria-label="Search document">⌕<span class="hoa-pdf-btn-label">Search</span></button>
            </div>
            <div class="hoa-pdf-toolbar-group hoa-pdf-toolbar-group-pages" aria-label="Page navigation">
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-prev title="Previous page" aria-label="Previous page">‹</button>
              <label class="hoa-pdf-viewer-page">
                <span class="hoa-pdf-page-caption">PAGE</span>
                <span class="hoa-pdf-page-current"><input data-pdf-page type="number" min="1" value="1" inputmode="numeric" aria-label="Page number"></span>
                <span class="hoa-pdf-page-total">/ <b data-pdf-total>0</b></span>
              </label>
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-next title="Next page" aria-label="Next page">›</button>
            </div>
            <div class="hoa-pdf-toolbar-group hoa-pdf-toolbar-group-zoom" aria-label="Zoom controls">
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-zoom-out title="Zoom out" aria-label="Zoom out">−</button>
              <span class="hoa-pdf-viewer-zoom" data-pdf-zoom-label>100%</span>
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-zoom-in title="Zoom in" aria-label="Zoom in">+</button>
            </div>
            <div class="hoa-pdf-toolbar-group hoa-pdf-toolbar-group-view">
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-fit title="Fit page to width" aria-label="Fit page to width">↔</button>
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-fullscreen title="Fullscreen" aria-label="Fullscreen">⛶</button>
              <button type="button" class="hoa-pdf-viewer-btn hoa-pdf-toolbar-btn" data-pdf-download title="Download" aria-label="Download">↓</button>
            </div>
          </div>
        </header>
        <div class="hoa-pdf-viewer-search" data-pdf-searchbar hidden>
          <input type="search" data-pdf-search-input placeholder="Search in document…" autocomplete="off" spellcheck="false" aria-label="Search in document">
          <button type="button" class="hoa-pdf-viewer-btn" data-pdf-search-prev title="Previous match" aria-label="Previous match">↑</button>
          <button type="button" class="hoa-pdf-viewer-btn" data-pdf-search-next title="Next match" aria-label="Next match">↓</button>
          <span data-pdf-search-status></span>
          <button type="button" class="hoa-pdf-viewer-search-close" data-pdf-search-close aria-label="Close search">×</button>
        </div>
        <div class="hoa-pdf-viewer-status" data-pdf-status aria-live="polite">Loading PDF…</div>
        <div class="hoa-pdf-viewer-body" data-pdf-body tabindex="0"></div>
      </section>`;
    document.body.appendChild(modal);

    const q = (sel) => modal.querySelector(sel);
    q('[data-pdf-close]').addEventListener('click', close);
    q('[data-pdf-prev]').addEventListener('click', () => changePage(-1));
    q('[data-pdf-next]').addEventListener('click', () => changePage(1));
    q('[data-pdf-page]').addEventListener('change', () => setPage(Number(q('[data-pdf-page]').value) || 1, false));
    q('[data-pdf-zoom-out]').addEventListener('click', () => zoomBy(-0.15));
    q('[data-pdf-zoom-in]').addEventListener('click', () => zoomBy(0.15));
    q('[data-pdf-fit]').addEventListener('click', fitWidth);
    q('[data-pdf-fullscreen]').addEventListener('click', toggleFullscreen);
    q('[data-pdf-download]').addEventListener('click', download);
    q('[data-pdf-search-toggle]').addEventListener('click', toggleSearch);
    q('[data-pdf-search-close]').addEventListener('click', () => toggleSearch(false));
    q('[data-pdf-search-prev]').addEventListener('click', () => stepSearch(-1));
    q('[data-pdf-search-next]').addEventListener('click', () => stepSearch(1));
    q('[data-pdf-search-input]').addEventListener('input', debounce(runSearch, 180));
    q('[data-pdf-search-input]').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); stepSearch(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') { e.preventDefault(); toggleSearch(false); }
    });
    q('[data-pdf-body]').addEventListener('scroll', debounce(updateCurrentPageFromViewport, 80), { passive: true });
    q('[data-pdf-body]').addEventListener('keydown', (e) => {
      if (!active) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); changePage(-1); }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); changePage(1); }
      else if (e.key === '+') zoomBy(0.15);
      else if (e.key === '-') zoomBy(-0.15);
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === '/') { e.preventDefault(); toggleSearch(true); }
    });

    if (!modalKeydownBound) {
      modalKeydownBound = true;
      document.addEventListener('keydown', (e) => {
        if (!active || modal.hidden) return;
        if (e.key === 'Escape' && !e.defaultPrevented) close();
      });
    }
    return modal;
  }

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function refs() {
    const modal = ensureModal();
    return {
      modal,
      title: modal.querySelector('#hoaPdfViewerTitle'),
      status: modal.querySelector('[data-pdf-status]'),
      body: modal.querySelector('[data-pdf-body]'),
      page: modal.querySelector('[data-pdf-page]'),
      total: modal.querySelector('[data-pdf-total]'),
      zoomLabel: modal.querySelector('[data-pdf-zoom-label]'),
      prev: modal.querySelector('[data-pdf-prev]'),
      next: modal.querySelector('[data-pdf-next]'),
      searchBar: modal.querySelector('[data-pdf-searchbar]'),
      searchInput: modal.querySelector('[data-pdf-search-input]'),
      searchPrev: modal.querySelector('[data-pdf-search-prev]'),
      searchNext: modal.querySelector('[data-pdf-search-next]'),
      searchStatus: modal.querySelector('[data-pdf-search-status]')
    };
  }

  function setStatus(text, error = false) {
    const { status } = refs();
    status.textContent = text || '';
    status.classList.toggle('error', !!error);
  }

  function updateControls() {
    if (!active) return;
    const r = refs();
    r.page.value = String(active.pageNo);
    r.total.textContent = String(active.numPages);
    r.zoomLabel.textContent = `${Math.round(active.scale * 100)}%`;
    r.prev.disabled = active.pageNo <= 1;
    r.next.disabled = active.pageNo >= active.numPages;
  }

  function createPageShell(pageNo, estimatedHeight = 600) {
    const pageRoot = document.createElement('article');
    pageRoot.className = 'hoa-pdf-viewer-page';
    pageRoot.dataset.pageNo = String(pageNo);
    pageRoot.setAttribute('aria-label', `Page ${pageNo}`);
    pageRoot.style.minHeight = `${estimatedHeight}px`;
    pageRoot.innerHTML = `
      <div class="hoa-pdf-viewer-page-number">${pageNo}</div>
      <div class="hoa-pdf-viewer-page-inner" data-page-inner>
        <canvas data-pdf-canvas></canvas>
        <div class="hoa-pdf-text-layer textLayer" data-pdf-text-layer></div>
      </div>`;
    return pageRoot;
  }

  async function getFirstPageViewport() {
    const page = await active.pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const info = { width: viewport.width, height: viewport.height };
    active.pageInfo.set(1, info);
    page.cleanup?.();
    return info;
  }

  function buildPageList(estimate) {
    const r = refs();
    const frag = document.createDocumentFragment();
    active.pageRoots = new Map();
    const availableWidth = Math.max(260, r.body.clientWidth - 32);
    const estimatedScale = active.fitWidth ? Math.max(0.5, Math.min(3, availableWidth / estimate.width)) : active.scale;
    const estimatedHeight = Math.max(280, Math.ceil(estimate.height * estimatedScale));
    for (let i = 1; i <= active.numPages; i++) {
      const root = createPageShell(i, estimatedHeight);
      active.pageRoots.set(i, root);
      frag.appendChild(root);
    }
    r.body.replaceChildren(frag);

    active.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const pageNo = Number(entry.target.dataset.pageNo);
        if (!pageNo || !entry.isIntersecting) continue;
        renderPage(pageNo).catch((err) => {
          if (active) setStatus(`Page ${pageNo} failed: ${err?.message || err}`, true);
        });
      }
    }, { root: r.body, rootMargin: '900px 0px', threshold: 0.01 });

    for (const root of active.pageRoots.values()) active.observer.observe(root);
  }

  async function renderPage(pageNo) {
    if (!active || !active.pdf || pageNo < 1 || pageNo > active.numPages) return;
    const root = active.pageRoots.get(pageNo);
    if (!root) return;
    if (root.dataset.rendered === 'true' && !active.forceRenderAll) return;
    if (active.renderTasks.has(pageNo)) return active.renderTasks.get(pageNo);

    const taskPromise = (async () => {
      const pdfjsLib = active.pdfjsLib;
      const page = await active.pdf.getPage(pageNo);
      const inner = root.querySelector('[data-page-inner]');
      const canvas = root.querySelector('[data-pdf-canvas]');
      const textLayerEl = root.querySelector('[data-pdf-text-layer]');
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(260, refs().body.clientWidth - 32);
      if (active.fitWidth) active.scale = Math.max(0.5, Math.min(3, availableWidth / baseViewport.width));
      const viewport = page.getViewport({ scale: active.scale });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.ceil(viewport.width * dpr);
      canvas.height = Math.ceil(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      inner.style.width = `${viewport.width}px`;
      inner.style.height = `${viewport.height}px`;
      root.style.minHeight = `${viewport.height}px`;
      root.style.width = `${viewport.width}px`;
      root.style.setProperty('--hoa-pdf-page-width', `${viewport.width}px`);
      root.style.setProperty('--hoa-pdf-page-height', `${viewport.height}px`);

      const ctx = canvas.getContext('2d', { alpha: false });
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined
      });
      active.pageRenderTasks.set(pageNo, renderTask);
      await renderTask.promise;
      active.pageRenderTasks.delete(pageNo);

      textLayerEl.replaceChildren();
      textLayerEl.style.setProperty('--scale-factor', String(active.scale));
      try {
        const textContent = await page.getTextContent();
        active.textCache.set(pageNo, {
          fullText: textContent.items.map((item) => String(item.str || '')).join(' '),
          loaded: true
        });
        if (active !== window.__hoaPdfViewerActive) return;
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerEl,
          viewport
        });
        await textLayer.render();
      } catch (textErr) {
        console.warn('[HOAPDFViewer] Text layer failed on page', pageNo, textErr);
      }

      root.dataset.rendered = 'true';
      root.dataset.scale = String(active.scale);
      page.cleanup?.();
      updateControls();
      updateSearchHighlights(pageNo);
      updateCurrentPageFromViewport();
      setStatus(`Page ${active.pageNo} of ${active.numPages}`);
    })().catch((err) => {
      if (err?.name === 'RenderingCancelledException') return;
      throw err;
    }).finally(() => {
      active?.renderTasks.delete(pageNo);
    });

    active.renderTasks.set(pageNo, taskPromise);
    return taskPromise;
  }

  function updateCurrentPageFromViewport() {
    if (!active) return;
    const r = refs();
    const containerRect = r.body.getBoundingClientRect();
    let bestPage = active.pageNo;
    let bestDistance = Infinity;
    for (const [pageNo, root] of active.pageRoots) {
      const rect = root.getBoundingClientRect();
      if (rect.bottom <= containerRect.top || rect.top >= containerRect.bottom) continue;
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - (containerRect.top + containerRect.height / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPage = pageNo;
      }
    }
    if (bestPage !== active.pageNo) {
      active.pageNo = bestPage;
      updateControls();
      setStatus(`Page ${active.pageNo} of ${active.numPages}`);
      updateSearchHighlights(bestPage);
    }
  }

  async function prepareSearchText(generation) {
    if (!active) return false;
    const status = refs().searchStatus;
    let loaded = 0;
    for (let i = 1; i <= active.numPages; i++) {
      if (!active || generation !== active.currentSearchGeneration) return false;
      if (active.textCache.get(i)?.loaded) { loaded++; continue; }
      try {
        const page = await active.pdf.getPage(i);
        const textContent = await page.getTextContent();
        active.textCache.set(i, {
          fullText: textContent.items.map((item) => String(item.str || '')).join(' '),
          loaded: true
        });
        page.cleanup?.();
        loaded++;
        if (status) status.textContent = `Indexing ${loaded}/${active.numPages}…`;
      } catch (err) {
        console.warn('[HOAPDFViewer] Search indexing failed on page', i, err);
      }
    }
    return true;
  }

  async function runSearch() {
    if (!active) return;
    const query = refs().searchInput.value.trim().toLowerCase();
    active.searchQuery = query;
    active.searchMatches = [];
    active.searchIndex = -1;
    const generation = ++active.currentSearchGeneration;
    if (!query) {
      refs().searchStatus.textContent = '';
      clearSearchHighlights();
      return;
    }
    refs().searchStatus.textContent = 'Searching…';
    const ready = await prepareSearchText(generation);
    if (!active || !ready || generation !== active.currentSearchGeneration) return;

    for (let i = 1; i <= active.numPages; i++) {
      const text = active.textCache.get(i)?.fullText?.toLowerCase() || '';
      if (!text) continue;
      let pos = 0;
      let count = 0;
      while ((pos = text.indexOf(query, pos)) !== -1) {
        count++;
        pos += Math.max(1, query.length);
      }
      if (count) active.searchMatches.push({ pageNo: i, count });
    }

    if (!active.searchMatches.length) {
      refs().searchStatus.textContent = 'No matches';
      clearSearchHighlights();
      return;
    }

    active.searchIndex = 0;
    refs().searchStatus.textContent = `1/${active.searchMatches.length}`;
    await setPage(active.searchMatches[0].pageNo, true);
    updateSearchHighlights(active.searchMatches[0].pageNo, true);
  }

  async function stepSearch(delta) {
    if (!active) return;
    if (!active.searchMatches.length) {
      await runSearch();
      return;
    }
    active.searchIndex = (active.searchIndex + delta + active.searchMatches.length) % active.searchMatches.length;
    refs().searchStatus.textContent = `${active.searchIndex + 1}/${active.searchMatches.length}`;
    const target = active.searchMatches[active.searchIndex].pageNo;
    await setPage(target, true);
    updateSearchHighlights(target, true);
  }

  function clearSearchHighlights() {
    if (!active) return;
    for (const root of active.pageRoots.values()) {
      root.querySelectorAll('.hoa-pdf-search-hit').forEach((el) => el.classList.remove('hoa-pdf-search-hit'));
    }
  }

  function updateSearchHighlights(pageNo, scrollToHit = false) {
    if (!active || !active.searchQuery) return;
    const root = active.pageRoots.get(pageNo);
    if (!root) return;
    root.querySelectorAll('.hoa-pdf-search-hit').forEach((el) => el.classList.remove('hoa-pdf-search-hit'));
    const query = active.searchQuery.toLowerCase();
    const hits = [...root.querySelectorAll('.textLayer span')].filter((span) => (span.textContent || '').toLowerCase().includes(query));
    hits.forEach((span) => span.classList.add('hoa-pdf-search-hit'));
    if (scrollToHit && hits[0]) hits[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }

  function toggleSearch(force) {
    const r = refs();
    const show = typeof force === 'boolean' ? force : r.searchBar.hidden;
    r.searchBar.hidden = !show;
    if (show) {
      r.searchInput.focus({ preventScroll: true });
      r.searchInput.select();
    } else {
      r.searchInput.value = '';
      r.searchStatus.textContent = '';
      if (active) {
        active.searchQuery = '';
        active.searchMatches = [];
        active.searchIndex = -1;
        active.currentSearchGeneration++;
      }
      clearSearchHighlights();
    }
  }

  async function open(url, title = 'PDF Document', options = {}) {
    const safe = String(url || '').trim();
    if (!safe) throw new Error('PDF URL is empty.');
    if (!isPdfUrl(safe)) throw new Error('The selected resource is not a PDF.');

    close();
    const r = refs();
    active = {
      url: safe,
      title: String(title || 'PDF Document'),
      pageNo: 1,
      numPages: 0,
      scale: 1,
      fitWidth: true,
      pdfjsLib: null,
      pdf: null,
      loadingTask: null,
      observer: null,
      pageRoots: new Map(),
      pageInfo: new Map(),
      renderTasks: new Map(),
      pageRenderTasks: new Map(),
      textCache: new Map(),
      searchQuery: '',
      searchMatches: [],
      searchIndex: -1,
      currentSearchGeneration: 0,
      forceRenderAll: false,
      allowDownload: options.allowDownload !== false
    };
    window.__hoaPdfViewerActive = active;
    r.title.textContent = active.title;
    r.modal.hidden = false;
    document.body.classList.add('hoa-pdf-viewer-open');
    r.searchBar.hidden = true;
    r.searchInput.value = '';
    r.searchStatus.textContent = '';
    const downloadBtn = r.modal.querySelector('[data-pdf-download]');
    if (downloadBtn) {
      downloadBtn.hidden = !active.allowDownload;
      downloadBtn.setAttribute('aria-hidden', active.allowDownload ? 'false' : 'true');
    }
    r.body.replaceChildren();
    setStatus('Loading PDF…');

    try {
      const pdfjsLib = await loadPdfJs();
      if (!active) return;
      active.pdfjsLib = pdfjsLib;
      active.loadingTask = pdfjsLib.getDocument({
        url: safe,
        withCredentials: false,
        disableAutoFetch: false,
        disableStream: false
      });
      active.pdf = await active.loadingTask.promise;
      active.numPages = active.pdf.numPages;
      const firstInfo = await getFirstPageViewport();
      if (!active) return;
      buildPageList(firstInfo);
      updateControls();
      setStatus(`Loaded ${active.numPages} page${active.numPages === 1 ? '' : 's'} · rendering…`);
      await renderPage(1);
      refs().body.focus({ preventScroll: true });
      requestAnimationFrame(updateCurrentPageFromViewport);
    } catch (err) {
      if (!active) return;
      setStatus(`Unable to render this PDF: ${err?.message || err}`, true);
      r.body.innerHTML = `<div class="hoa-pdf-viewer-error"><strong>PDF could not be displayed.</strong><span>The file may be unavailable or its server may not permit browser PDF rendering.</span></div>`;
    }
  }

  function close() {
    const modal = document.getElementById('hoaPdfViewerModal');
    if (active?.observer) active.observer.disconnect();
    if (active?.pageRenderTasks) {
      for (const task of active.pageRenderTasks.values()) {
        try { task.cancel?.(); } catch (_) {}
      }
    }
    if (active?.loadingTask?.destroy) {
      try { active.loadingTask.destroy(); } catch (_) {}
    }
    active = null;
    window.__hoaPdfViewerActive = null;
    if (modal) {
      modal.hidden = true;
      modal.querySelector('[data-pdf-searchbar]').hidden = true;
      modal.querySelector('[data-pdf-body]').replaceChildren();
    }
    document.body.classList.remove('hoa-pdf-viewer-open');
  }

  async function setPage(n, smooth) {
    if (!active || !Number.isFinite(n)) return;
    const pageNo = Math.max(1, Math.min(active.numPages, Math.floor(n)));
    const root = active.pageRoots.get(pageNo);
    if (!root) return;
    active.pageNo = pageNo;
    updateControls();
    if (!root.dataset.rendered) await renderPage(pageNo);
    root.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    updateCurrentPageFromViewport();
    updateSearchHighlights(pageNo);
  }

  function changePage(delta) {
    if (active) setPage(active.pageNo + delta, true).catch((e) => setStatus(`Navigation failed: ${e?.message || e}`, true));
  }

  async function rerenderLoadedPages() {
    if (!active) return;
    const loaded = [...active.pageRoots.entries()].filter(([, root]) => root.dataset.rendered === 'true').map(([p]) => p);
    active.forceRenderAll = true;
    for (const pageNo of loaded) {
      const root = active.pageRoots.get(pageNo);
      delete root.dataset.rendered;
      root.querySelector('[data-pdf-text-layer]').replaceChildren();
      await renderPage(pageNo);
    }
    active.forceRenderAll = false;
    updateControls();
  }

  function zoomBy(delta) {
    if (!active) return;
    active.fitWidth = false;
    active.scale = Math.max(0.5, Math.min(3, active.scale + delta));
    rerenderLoadedPages().catch((e) => setStatus(`Zoom failed: ${e?.message || e}`, true));
  }

  function fitWidth() {
    if (!active) return;
    active.fitWidth = true;
    rerenderLoadedPages().catch((e) => setStatus(`Fit width failed: ${e?.message || e}`, true));
  }

  function toggleFullscreen() {
    const shell = document.querySelector('.hoa-pdf-viewer-shell');
    if (!shell) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else shell.requestFullscreen?.();
  }

  function download() {
    if (!active || !active.allowDownload) return;
    const a = document.createElement('a');
    a.href = active.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = '';
    a.dataset.hoaPdfNative = 'true';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.HOAPDFViewer = Object.freeze({ open, close, isPdfUrl });

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link || link.dataset.hoaPdfNative === 'true') return;
    const href = link.href || link.getAttribute('href') || '';
    if (!isPdfUrl(href)) return;
    event.preventDefault();
    open(href, link.dataset.hoaPdfTitle || link.textContent.trim() || 'PDF Document').catch((err) => {
      console.error('[HOAPDFViewer]', err);
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  });

})(window, document);

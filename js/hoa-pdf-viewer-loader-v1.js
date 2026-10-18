/* HUB OF ASPIRANTS — on-demand PDF viewer loader (P3).
 * Keeps the existing HOAPDFViewer API available immediately, while loading
 * the full viewer code and its CSS only when a PDF is opened.
 */
(function (global, document) {
  'use strict';

  if (global.HOAPDFViewer && typeof global.HOAPDFViewer.open === 'function') return;

  var loaderScript = document.currentScript;
  var scriptBase = loaderScript && loaderScript.src
    ? loaderScript.src
    : new URL('js/hoa-pdf-viewer-loader-v1.js', document.baseURI).href;
  var viewerScriptUrl = new URL('hoa-pdf-viewer-v2.js?v=20261016-p3-lazy-pdf-v1', scriptBase).href;
  var viewerCssUrl = new URL('../css/hoa-pdf-viewer.css?v=20261016-p3-lazy-pdf-v1', scriptBase).href;
  var viewerPromise = null;
  var cssPromise = null;
  var proxy;

  function isPdfUrl(value) {
    try {
      var u = new URL(value, global.location.href);
      return /\.pdf(?:$|[?#])/i.test(u.pathname + u.search + u.hash) || /(?:^|[?&])format=pdf(?:&|$)/i.test(u.search);
    } catch (_) {
      return /\.pdf(?:$|[?#])/i.test(String(value || ''));
    }
  }

  function ensureStylesheet() {
    if (cssPromise) return cssPromise;
    cssPromise = new Promise(function (resolve) {
      var existing = document.getElementById('hoaPdfViewerLazyStyles');
      if (existing && existing.dataset.hoaLoaded === 'true') {
        resolve();
        return;
      }
      var link = existing || document.createElement('link');
      link.id = 'hoaPdfViewerLazyStyles';
      link.rel = 'stylesheet';
      link.href = viewerCssUrl;
      link.onload = function () {
        link.dataset.hoaLoaded = 'true';
        resolve();
      };
      link.onerror = function () {
        console.warn('[HOAPDFViewer] Viewer styling could not be loaded; continuing with fallback styling.');
        resolve();
      };
      if (!existing) document.head.appendChild(link);
    });
    return cssPromise;
  }

  function loadViewer() {
    var current = global.HOAPDFViewer;
    if (current && current !== proxy && typeof current.open === 'function') {
      return Promise.resolve(current);
    }
    if (viewerPromise) return viewerPromise;

    viewerPromise = Promise.all([
      ensureStylesheet(),
      new Promise(function (resolve, reject) {
        var existing = document.querySelector('script[data-hoa-lazy-pdf-viewer="1"]');
        var script = existing || document.createElement('script');
        script.src = viewerScriptUrl;
        script.async = true;
        script.dataset.hoaLazyPdfViewer = '1';
        script.onload = function () {
          var api = global.HOAPDFViewer;
          if (!api || api === proxy || typeof api.open !== 'function') {
            reject(new Error('PDF viewer loaded without exposing its open API.'));
            return;
          }
          document.removeEventListener('click', interceptPdfLink);
          resolve(api);
        };
        script.onerror = function () {
          if (script.parentNode) script.parentNode.removeChild(script);
          reject(new Error('The PDF viewer could not be loaded. Please try again.'));
        };
        if (!existing) document.body.appendChild(script);
        else if (global.HOAPDFViewer && global.HOAPDFViewer !== proxy && typeof global.HOAPDFViewer.open === 'function') resolve(global.HOAPDFViewer);
      })
    ]).then(function () {
      var api = global.HOAPDFViewer;
      if (!api || api === proxy || typeof api.open !== 'function') {
        throw new Error('PDF viewer is unavailable.');
      }
      return api;
    }).catch(function (error) {
      viewerPromise = null;
      throw error;
    });

    return viewerPromise;
  }

  function interceptPdfLink(event) {
    var target = event.target;
    var link = target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
    if (!link || link.dataset.hoaPdfNative === 'true') return;
    var href = link.href || link.getAttribute('href') || '';
    if (!isPdfUrl(href)) return;
    event.preventDefault();
    proxy.open(href, link.dataset.hoaPdfTitle || (link.textContent || '').trim() || 'PDF Document').catch(function (error) {
      console.error('[HOAPDFViewer]', error);
      global.open(href, '_blank', 'noopener,noreferrer');
    });
  }

  proxy = {
    open: function () {
      var args = arguments;
      return loadViewer().then(function (api) { return api.open.apply(api, args); });
    },
    close: function () {
      var api = global.HOAPDFViewer;
      if (api && api !== proxy && typeof api.close === 'function') return api.close.apply(api, arguments);
      return undefined;
    },
    isPdfUrl: isPdfUrl
  };

  global.HOAPDFViewer = proxy;
  document.addEventListener('click', interceptPdfLink);
})(window, document);


(function () {
  "use strict";

  function normalizeUI() {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    // Prevent accidental native overflow from oversized images in the public shell.
    document.querySelectorAll("#hoaFrontPage img, #hoaLoginPage img").forEach(function (img) {
      img.style.maxWidth = "100%";
      img.style.height = img.style.height || "auto";
    });

    // Add accessible labels to unlabeled password/text inputs only when an
    // adjacent placeholder exists; do not alter application values.
    document.querySelectorAll("input").forEach(function (input) {
      if (!input.getAttribute("aria-label") && !input.labels?.length) {
        const placeholder = input.getAttribute("placeholder");
        if (placeholder) input.setAttribute("aria-label", placeholder);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", normalizeUI, { once: true });
  } else {
    normalizeUI();
  }

  window.addEventListener("resize", normalizeUI, { passive: true });
})();

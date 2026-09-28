
/*
 * V6.0.123
 * One history owner: V6.0.123 public router.
 * Authentication lifecycle is coordinated through the existing public router;
 * no second popstate listener is installed.
 */
(function () {
  "use strict";

  function clearAuthClasses() {
    document.body.classList.remove(
      "hoa-app-authenticated",
      "hoa-app-student",
      "hoa-app-admin"
    );
  }

  function clearPublicClasses() {
    document.body.classList.remove(
      "hoa-public-front",
      "hoa-public-portal",
      "hoa-public-auth",
      "hoa-student-auth",
      "hoa-admin-auth"
    );
  }

  function syncLegacyShell() {
    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (!document.body.classList.contains("hoa-app-authenticated")) {
      if (authScreen) {
        authScreen.classList.add("hidden");
        authScreen.style.removeProperty("display");
      }
      if (home) home.classList.add("hidden");
    }
  }

  window.hoaEnterAuthenticated = function (role) {
    role = role === "admin" ? "admin" : "student";

    clearPublicClasses();
    clearAuthClasses();

    document.body.classList.add("hoa-app-authenticated");
    document.body.classList.add("hoa-app-" + role);

    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (authScreen) authScreen.classList.add("hidden");
    if (home) home.classList.remove("hidden");

    if (role === "student") {
      document.getElementById("studentOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    } else {
      document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    }

    // Replace the current public entry rather than creating another history
    // stack controlled by the authentication layer.
    try {
      history.replaceState({ hoaApp: true, authenticated: true, role }, "", location.href);
    } catch (_) {}
  };

  window.hoaExitToFrontPage = function () {
    clearAuthClasses();
    clearPublicClasses();

    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (home) home.classList.add("hidden");
    if (authScreen) authScreen.classList.add("hidden");

    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");

    document.body.classList.add("hoa-public-front");

    try {
      history.replaceState({ hoaPublic: true, page: "front" }, "", location.href);
    } catch (_) {}

    if (typeof window.hoaShowFrontPage === "function") {
      try { window.hoaShowFrontPage(false); } catch (_) {}
    }
  };

  // Public router remains the only popstate owner. This hook only reconciles
  // authenticated DOM state when the router has already rendered a page.
  window.hoaSyncAuthenticatedShell = function () {
    if (!document.body.classList.contains("hoa-app-authenticated")) {
      syncLegacyShell();
      return;
    }

    const role = document.body.classList.contains("hoa-app-admin") ? "admin" : "student";
    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (authScreen) authScreen.classList.add("hidden");
    if (home) home.classList.remove("hidden");

    if (role === "admin") {
      document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    } else {
      document.getElementById("studentOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    }
  };
})();

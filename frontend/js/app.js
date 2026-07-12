/* ==========================================================================
   app.js — Shared bootstrap logic loaded on every page
   Currently: theme (light/dark) initialization.
   Sidebar/navbar/dropdown behavior lives in dashboard.js once the
   shared layout components are introduced on later pages.
   ========================================================================== */

(function initTheme() {
  const savedTheme = localStorage.getItem('assetflow_theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
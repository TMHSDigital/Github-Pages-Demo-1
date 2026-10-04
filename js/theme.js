'use strict';

// Theme toggle. The initial theme is applied by the inline script in <head>
// (saved choice, else the system setting). Until the visitor picks one, the
// page keeps following the system setting.
(() => {
  const KEY = 'tmhs-theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable: theme still changes for this visit */ } };

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  };

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      write(next);
    });
  }

  media.addEventListener('change', (e) => {
    if (!read()) apply(e.matches ? 'dark' : 'light');
  });
})();

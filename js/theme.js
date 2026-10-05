'use strict';

// Theme toggle. The initial theme is applied by the inline script in <head>
// (saved choice, else the system setting). Until the visitor picks one, the
// page keeps following the system setting.
(() => {
  const KEY = 'tmhs-theme';
  const COLORS = { light: '#F6F7FA', dark: '#0A1226' }; // browser UI colour per theme
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* storage unavailable: theme still changes for this visit */ } };

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[theme]));
  };

  // Circular reveal from the toggle button where the View Transitions API exists
  const switchTo = (theme) => {
    if (!document.startViewTransition || reduced.matches || !btn) { apply(theme); return; }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(() => apply(theme));
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.22, .61, .36, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  };

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      write(next);
      switchTo(next);
    });
  }

  // An embed given ?theme= keeps it: the host site chose it, so the system setting doesn't apply
  const embedTheme = root.classList.contains('embed') && /^(light|dark)$/.test(new URLSearchParams(location.search).get('theme') || '');
  media.addEventListener('change', (e) => {
    if (!read() && !embedTheme) apply(e.matches ? 'dark' : 'light');
  });
})();

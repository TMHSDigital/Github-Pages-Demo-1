'use strict';

(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    setMenu(open);
    // the menu sits before its button in the DOM, so bring keyboard users into it
    if (open) nav.querySelector('a').focus();
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 57.5625em)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Reveal on scroll (content is visible by default without JS) */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('reveal-on'); // CSS hides [data-reveal] only from here on
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* Current section in the nav */
  const links = [...document.querySelectorAll('.nav ul a')];
  if ('IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const link = map.get(en.target.id);
        if (link && en.isIntersecting) {
          links.forEach((a) => a.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    // back at the hero, no section is current
    const hero = document.querySelector('.hero');
    if (hero) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && en.intersectionRatio > 0.5) links.forEach((a) => a.removeAttribute('aria-current'));
      }, { threshold: [0.5, 0.75] }).observe(hero);
    }
  }

  /* Header shadow once the page has scrolled */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Pause decorative loops while they are off screen */
  const scene = document.getElementById('scene');
  const marquee = document.getElementById('marquee');
  let sceneVisible = true;
  if ('IntersectionObserver' in window) {
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        en.target.classList.toggle('is-offscreen', !en.isIntersecting);
        if (en.target === scene) sceneVisible = en.isIntersecting;
      });
    });
    [scene, marquee].forEach((el) => el && vis.observe(el));
  }

  /* Hero scene pointer parallax (fine pointers only, while the scene is visible) */
  if (scene && !reduced && window.matchMedia('(pointer: fine)').matches) {
    let ticking = false;
    window.addEventListener('pointermove', (e) => {
      if (ticking || !sceneVisible) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = scene.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        scene.style.setProperty('--px', x.toFixed(3));
        scene.style.setProperty('--py', y.toFixed(3));
        ticking = false;
      });
    }, { passive: true });
  }

  /* Marquee pause control */
  const pause = document.getElementById('marquee-toggle');
  if (marquee && pause) {
    pause.addEventListener('click', () => {
      const paused = marquee.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
    });
  }

  /* Mobile quick-contact bar: shown once the hero is passed, hidden at the contact section */
  const sticky = document.getElementById('sticky-cta');
  const contact = document.getElementById('contact');
  const hero = document.querySelector('.hero');
  if (sticky && contact && hero && 'IntersectionObserver' in window) {
    const seen = { hero: true, contact: false, typing: false };
    const sync = () => sticky.classList.toggle('is-shown', !seen.hero && !seen.contact && !seen.typing && !root.classList.contains('menu-open'));
    const isField = (el) => el && el.matches && el.matches('input:not([type="range"]):not([type="checkbox"]), select, textarea');
    document.addEventListener('focusin', (e) => { seen.typing = isField(e.target); sync(); });
    document.addEventListener('focusout', () => { seen.typing = false; sync(); });
    new IntersectionObserver(([en]) => { seen.hero = en.isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(([en]) => { seen.contact = en.isIntersecting; sync(); }).observe(contact);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  /* Offline support: only the published build names a service worker (see scripts/stage.cjs) */
  const sw = document.querySelector('meta[name="tmhs-sw"]');
  if (sw && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register(sw.content).catch(() => {}); });
  }

  /* Embedded on another site: tell the host page our height so its iframe never scrolls */
  if (root.classList.contains('embed') && window.parent !== window) {
    let sent = 0;
    const report = () => {
      const height = Math.ceil(root.getBoundingClientRect().height);
      if (height !== sent) { sent = height; window.parent.postMessage({ type: 'tmhs:height', height }, '*'); }
    };
    if ('ResizeObserver' in window) new ResizeObserver(report).observe(document.body);
    window.addEventListener('load', report);
    report();
  }

  /* Copy buttons for read-only code (the embed snippet) */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const field = document.getElementById(btn.dataset.copy);
    const note = btn.parentElement.querySelector('[role="status"]');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(field.value);
        if (note) note.textContent = 'Copied.';
      } catch {
        field.focus();
        field.select();
        if (note) note.textContent = 'Press Ctrl+C (or Command+C) to copy the selected code.';
      }
    });
  });

  /* Footer year */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();

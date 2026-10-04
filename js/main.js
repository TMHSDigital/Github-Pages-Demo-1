'use strict';

// Set to a real address to turn the contact button into a mailto link.
// While empty, the page links to LinkedIn instead.
const CONTACT_EMAIL = '';

(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* Reveal on scroll (content is visible by default without JS) */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (!reduced && 'IntersectionObserver' in window) {
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
  }

  /* Header shadow once the page has scrolled */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hero scene pointer parallax (fine pointers only) */
  const scene = document.getElementById('scene');
  if (scene && !reduced && window.matchMedia('(pointer: fine)').matches) {
    let ticking = false;
    window.addEventListener('pointermove', (e) => {
      if (ticking) return;
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
  const marquee = document.getElementById('marquee');
  const pause = document.getElementById('marquee-toggle');
  if (marquee && pause) {
    pause.addEventListener('click', () => {
      const paused = marquee.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
    });
  }

  /* Contact CTA and footer year */
  const cta = document.getElementById('email-cta');
  if (CONTACT_EMAIL && cta) {
    cta.href = `mailto:${CONTACT_EMAIL}?subject=Hospitality%20strategy%20inquiry`;
    cta.removeAttribute('target');
    cta.firstChild.textContent = 'Email me ';
  }
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  root.classList.add('ready');
})();

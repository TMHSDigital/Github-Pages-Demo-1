'use strict';

// Set to a real address to turn the contact button into a mailto link.
// While empty, the page links to LinkedIn instead.
const CONTACT_EMAIL = '';

(() => {
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

  const cta = document.getElementById('email-cta');
  if (CONTACT_EMAIL && cta) {
    cta.href = `mailto:${CONTACT_EMAIL}?subject=Hospitality%20strategy%20inquiry`;
    cta.removeAttribute('target');
    cta.textContent = 'Email me';
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

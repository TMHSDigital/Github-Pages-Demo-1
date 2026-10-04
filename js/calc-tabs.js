'use strict';

// Toolkit tabs (ARIA tabs with automatic activation), shareable links and link copying.
(() => {
  const list = document.getElementById('tool-tabs');
  if (!list) return;
  const registry = window.TMHSTools;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const ink = list.querySelector('.tab-ink');

  const moveInk = () => {
    const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    if (!t || !ink) return;
    list.style.setProperty('--ink-x', t.offsetLeft + 'px');
    list.style.setProperty('--ink-w', t.offsetWidth + 'px');
    list.classList.add('has-ink');
  };

  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    registry.active = tab.dataset.tool;
    if (focus) tab.focus();
    moveInk();
    document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: registry.active } }));
  };

  tabs.forEach((t) => t.addEventListener('click', () => select(t, false)));
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to == null) return;
    e.preventDefault();
    select(tabs[(to + tabs.length) % tabs.length], true);
  });
  if ('ResizeObserver' in window) new ResizeObserver(moveInk).observe(list);
  if (document.fonts) document.fonts.ready.then(moveInk);

  // A shared link (?tool=cocktail&rows=...) opens the toolkit with those numbers
  const q = new URLSearchParams(location.search);
  const shared = q.get('tool');
  const tabFor = (key) => tabs.find((t) => t.dataset.tool === key);
  if (shared && registry.tools[shared] && tabFor(shared)) {
    registry.tools[shared].set(Object.fromEntries(q));
    select(tabFor(shared), false);
  } else {
    select(tabs[0], false);
  }

  /* Copy a link to the current tool and numbers */
  const copy = document.getElementById('copy-link');
  const status = document.getElementById('share-status');
  const field = document.getElementById('share-url');
  let statusTimer = 0;
  const say = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 6000);
  };

  const shareUrl = () => {
    const params = new URLSearchParams({ tool: registry.active });
    for (const [k, v] of Object.entries(registry.tools[registry.active].get())) {
      if (v !== '' && v != null) params.set(k, String(v));
    }
    const url = new URL(location.href);
    url.search = params.toString();
    url.hash = 'calculator';
    return url.href;
  };

  if (copy) {
    copy.addEventListener('click', async () => {
      const href = shareUrl();
      try {
        await navigator.clipboard.writeText(href);
        field.hidden = true;
        say('Link copied. Anyone who opens it sees these numbers.');
      } catch (e) {
        // Clipboard blocked: show the link, selected, to copy by hand
        field.value = href;
        field.hidden = false;
        field.focus();
        field.select();
        say('Copy the link from the field below.');
      }
    });
  }

  registry.shareUrl = shareUrl;
})();

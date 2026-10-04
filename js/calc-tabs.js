'use strict';

// Toolkit tabs (ARIA tabs with automatic activation), shareable links and link copying.
// The home page shows all tools behind tabs; each tool page (tools/*/) shows one tool and no tabs.
(() => {
  const registry = window.TMHSTools;
  const keys = Object.keys(registry.tools);
  if (!keys.length) return;
  const list = document.getElementById('tool-tabs');
  const tabs = list ? [...list.querySelectorAll('[role="tab"]')] : [];
  const tabFor = (key) => tabs.find((t) => t.dataset.tool === key);
  const changed = () => document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: registry.active } }));

  let select = () => {};
  if (tabs.length) {
    const ink = list.querySelector('.tab-ink');
    const moveInk = () => {
      const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
      if (!t || !ink) return;
      list.style.setProperty('--ink-x', t.offsetLeft + 'px');
      list.style.setProperty('--ink-w', t.offsetWidth + 'px');
      list.classList.add('has-ink');
    };

    select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      registry.active = tab.dataset.tool;
      if (focus) tab.focus();
      moveInk();
      changed();
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
  } else {
    registry.active = keys[0];
  }

  // A shared link (?tool=cocktail&rows=...) opens the toolkit with those numbers
  const q = new URLSearchParams(location.search);
  const shared = q.get('tool');
  if (shared && registry.tools[shared] && (tabFor(shared) || !tabs.length)) {
    registry.tools[shared].set(Object.fromEntries(q));
    if (tabs.length) select(tabFor(shared), false);
  } else if (tabs.length) {
    select(tabs[0], false);
  }

  // Link to a page with the current tool and numbers: this page by default
  const shareUrl = (base = location.href, hash = 'calculator', extra = {}) => {
    const params = new URLSearchParams({ tool: registry.active });
    for (const [k, v] of Object.entries(registry.tools[registry.active].get())) {
      if (v !== '' && v != null) params.set(k, String(v));
    }
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const url = new URL(base, location.href);
    url.search = params.toString();
    url.hash = hash;
    return url.href;
  };
  registry.shareUrl = () => shareUrl();

  // Opened from a shared link: keep the address bar in step with the numbers on screen, so a
  // reload or bookmark keeps the visitor's changes instead of the link's original numbers.
  // A plain visit leaves the URL alone. Nothing is stored; the numbers live only in the URL.
  if (shared && registry.tools[shared]) {
    const extra = q.get('talk') === '1' ? { talk: '1' } : {};
    let urlTimer = 0;
    document.addEventListener('tmhs:calc', () => {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => history.replaceState(history.state, '', shareUrl(location.href, location.hash.slice(1), extra)), 300);
    });
  }

  // On a tool page, "Talk through these numbers" opens the home page's message builder with them
  const talk = document.getElementById('talk-numbers');
  if (talk && talk.dataset.home) {
    const syncTalk = () => { talk.href = shareUrl(talk.dataset.home, 'contact', { talk: '1' }); };
    document.addEventListener('tmhs:calc', syncTalk);
    syncTalk();
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

  if (copy) {
    copy.addEventListener('click', async () => {
      const href = shareUrl();
      try {
        await navigator.clipboard.writeText(href);
        field.hidden = true;
        say('Link copied. Anyone who opens it sees these numbers.');
      } catch {
        // Clipboard blocked: show the link, selected, to copy by hand
        field.value = href;
        field.hidden = false;
        field.focus();
        field.select();
        say('Copy the link from the field below.');
      }
    });
  }
})();

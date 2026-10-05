'use strict';

// Your menu: dishes and drinks saved from the plate and cocktail calculators, side by side,
// and once sales counts are in, menu engineering (stars, plowhorses, puzzles and dogs) within
// each group. Saved only when the visitor asks, and only in this browser (localStorage).
(() => {
  const box = document.getElementById('menu');
  if (!box) return;

  const C = window.TMHSCalc;
  const registry = window.TMHSTools;
  const KEY = 'tmhs-menu';
  const MAX_ITEMS = 120;
  const KINDS = { plate: { group: 'Food', word: 'dish', words: 'dishes' }, cocktail: { group: 'Drinks', word: 'drink', words: 'drinks' } };
  // TODO(verify): the one-line actions per quadrant
  const QUADRANTS = [
    ['star', 'Stars', 'Popular and earn well. Keep the recipe, portion and place on the menu as they are.'],
    ['plowhorse', 'Plowhorses', 'Popular but earn less. Look at the portion or what goes into it, or a small price rise.'],
    ['puzzle', 'Puzzles', 'Earn well but few order them. Try a better spot on the menu, a new name or description, or staff recommending them.'],
    ['dog', 'Dogs', 'Earn little and rarely ordered. Rework them or take them off.'],
  ];
  const LABEL = Object.fromEntries(QUADRANTS.map(([k, name]) => [k, name.replace(/s$/, '')]));
  const $ = (id) => document.getElementById(id);
  const status = $('menu-status');
  const groups = $('menu-groups');

  // Storage: falls back to this visit only if the browser blocks it
  let storable = true;
  const valid = (d) => d && KINDS[d.kind] && typeof d.name === 'string' && d.name && Number.isFinite(d.cost) && Number.isFinite(d.price);
  const load = () => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(valid) : []; } catch { storable = false; return []; }
  };
  const persist = () => {
    try { if (items.length) localStorage.setItem(KEY, JSON.stringify(items)); else localStorage.removeItem(KEY); } catch { storable = false; }
  };
  let items = load();

  let statusTimer = 0;
  const say = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 8000);
  };
  const BLOCKED = ' Your browser is blocking storage, so it lasts only until you leave this page.';

  const margin = (d) => d.price - d.cost;
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };

  // Classes within each group (food is not judged against drinks)
  const classify = (kind) => {
    const list = items.filter((d) => d.kind === kind);
    const r = C.menuEngineering(list.map((d) => ({ margin: margin(d), sold: d.sold || 0 })));
    return { list, r, classOf: (d) => (r ? r.classes[list.indexOf(d)] : null) };
  };

  const renderMatrix = (kind, holder) => {
    const { list, r, classOf } = classify(kind);
    holder.replaceChildren();
    if (!r) {
      holder.append(el('p', { class: 'tracker-empty' }, `Add how many of each ${KINDS[kind].word} sold last month (at least two) to sort them.`));
      return;
    }
    holder.append(el('p', { class: 'menu-note' }, `Average margin ${C.usd2(r.avgMargin)} a ${KINDS[kind].word}; popular means at least ${C.pct1(r.popularBar * 100)} of the ${r.total.toLocaleString('en-US')} sold.`));
    const grid = el('div', { class: 'menu-matrix' });
    for (const [key, name, advice] of QUADRANTS) {
      const names = list.filter((d) => classOf(d) === key).map((d) => d.name);
      const card = el('div', { class: 'quad quad-' + key });
      card.append(el('p', { class: 'quad-name' }, `${name} (${names.length})`), el('p', { class: 'quad-hint' }, advice));
      if (names.length) {
        const ul = el('ul');
        names.forEach((n) => ul.append(el('li', {}, n)));
        card.append(ul);
      }
      grid.append(card);
    }
    holder.append(grid);
  };

  const refreshClasses = (kind) => {
    const { list, classOf } = classify(kind);
    list.forEach((d, i) => {
      const cell = groups.querySelector(`[data-kind="${kind}"] [data-class="${i}"]`);
      if (cell) cell.textContent = classOf(d) ? LABEL[classOf(d)] : '–';
    });
    renderMatrix(kind, groups.querySelector(`[data-kind="${kind}"] .menu-matrix-holder`));
  };

  const render = () => {
    $('menu-view').hidden = !items.length;
    $('menu-empty').hidden = items.length > 0;
    groups.replaceChildren();
    for (const kind of Object.keys(KINDS)) {
      const list = items.filter((d) => d.kind === kind);
      if (!list.length) continue;
      const group = el('div', { class: 'menu-group', 'data-kind': kind });
      group.append(el('p', { class: 'menu-kind' }, KINDS[kind].group));
      const scroll = el('div', { class: 'table-scroll' });
      const table = el('table', { class: 'tracker-table menu-table', role: 'table' });
      table.append(el('caption', { class: 'sr-only' }, `Saved ${KINDS[kind].words}`));
      const head = el('tr', { role: 'row' });
      ['Name', 'Cost', 'Price', 'Cost %', 'Margin', 'Sold last month', 'Class', ''].forEach((h, i) => {
        const th = el('th', { scope: 'col', role: 'columnheader' }, i === 7 ? null : h);
        if (i === 7) th.append(el('span', { class: 'sr-only' }, 'Actions'));
        head.append(th);
      });
      const thead = el('thead', { role: 'rowgroup' });
      thead.append(head);
      table.append(thead);
      const body = el('tbody', { role: 'rowgroup' });
      list.forEach((d, i) => {
        const tr = el('tr', { role: 'row' });
        const name = el('th', { scope: 'row', role: 'rowheader' }, d.name);
        const cell = (label, text) => el('td', { role: 'cell', 'data-label': label }, text);
        const price = cell('Price', C.usd2(d.price));
        if (d.suggested) price.append(el('span', { class: 'menu-flag' }, ' suggested'));
        const sold = el('input', { class: 'sold-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': `${d.name}: sold last month`, value: d.sold ? String(d.sold) : '' });
        sold.addEventListener('input', () => {
          d.sold = Math.min(Math.max(0, Math.floor(C.parseAmount(sold.value, 1e6))), 1e6) || 0;
          persist();
          refreshClasses(kind);
        });
        const soldCell = cell('Sold last month');
        soldCell.append(sold);
        const actionsCell = el('td', { class: 'menu-actions-cell', role: 'cell' });
        const actions = el('div', { class: 'menu-actions' });
        actionsCell.append(actions);
        const openBtn = el('button', { type: 'button', class: 'text-btn', 'data-open': String(items.indexOf(d)), 'aria-label': `Open ${d.name} in the calculator` }, 'Open');
        if (!d.state) openBtn.disabled = true;
        const del = el('button', { type: 'button', class: 'row-del', 'data-remove': String(items.indexOf(d)), 'aria-label': `Remove ${d.name}` });
        del.innerHTML = '<svg aria-hidden="true"><use href="#i-x"/></svg>';
        actions.append(openBtn, del);
        const classCell = cell('Class', '–');
        classCell.dataset.class = String(i);
        tr.append(name, cell('Cost', C.usd2(d.cost)), price, cell('Cost %', d.price ? C.pct1(C.costPct(d.cost, d.price)) : '–'),
          cell('Margin', C.usd2(margin(d))), soldCell, classCell, actionsCell);
        body.append(tr);
      });
      table.append(body);
      scroll.append(table);
      group.append(scroll, el('div', { class: 'menu-matrix-holder' }));
      groups.append(group);
      refreshClasses(kind);
    }
  };

  // Save from a calculator: its figures, and its numbers as a share-link query so it can be reopened
  document.querySelectorAll('[data-save]').forEach((btn) => {
    const kind = btn.dataset.save;
    const nameField = $(kind + '-dish');
    const note = $(kind + '-save-status');
    btn.addEventListener('click', () => {
      const tool = registry.tools[kind];
      const name = nameField.value.trim().slice(0, 40);
      if (!name) { note.textContent = `Name the ${KINDS[kind].word} first.`; nameField.focus(); return; }
      const snap = tool.snapshot();
      const state = new URLSearchParams(Object.entries(tool.get()).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)])).toString();
      const entry = { kind, name, cost: Math.round(snap.cost * 100) / 100, price: Math.round((snap.price || snap.suggested) * 100) / 100, suggested: !snap.price, state };
      const at = items.findIndex((d) => d.kind === kind && d.name.toLowerCase() === name.toLowerCase());
      if (at >= 0) { entry.sold = items[at].sold; items[at] = entry; } else if (items.length < MAX_ITEMS) items.push(entry);
      else { note.textContent = `Your menu holds up to ${MAX_ITEMS} items. Remove one to save another.`; return; }
      persist();
      render();
      note.textContent = `${at >= 0 ? 'Updated' : 'Saved'} ${name} in your menu.${storable ? '' : BLOCKED}`;
    });
  });

  // Open a saved dish in its calculator: here if this page has it, otherwise on the home page
  groups.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open]');
    const del = e.target.closest('[data-remove]');
    if (openBtn) {
      const d = items[+openBtn.dataset.open];
      if (registry.tools[d.kind]) {
        registry.tools[d.kind].set(Object.fromEntries(new URLSearchParams(d.state)));
        if (registry.select) registry.select(d.kind);
        $(d.kind + '-dish').value = d.name;
        const panel = $(d.kind);
        panel.scrollIntoView({ block: 'start' });
        $(d.kind + '-dish').focus({ preventScroll: true });
        say(`Opened ${d.name}. Change it and save again to update it.`);
      } else {
        const home = (document.getElementById('talk-numbers') || {}).dataset?.home || './';
        location.href = new URL(`${home}?tool=${d.kind}&${d.state}#calculator`, location.href).href;
      }
    } else if (del) {
      const i = +del.dataset.remove;
      const d = items[i];
      const removeButtons = [...groups.querySelectorAll('[data-remove]')];
      const pos = removeButtons.indexOf(del);
      items.splice(i, 1);
      persist();
      render();
      say(`Removed ${d.name}.`);
      const left = [...groups.querySelectorAll('[data-remove]')];
      (left[Math.min(pos, left.length - 1)] || document.querySelector('[data-save]')).focus(); // the menu emptied: back to a save button
    }
  });

  // CSV: one row per item; "state" is the calculator's numbers, so imported items reopen too
  const COLUMNS = ['kind', 'name', 'cost', 'price', 'suggested', 'sold', 'state'];
  const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const parseCsv = (text) => text.split(/\r?\n/).filter((l) => l.trim()).map((line) => {
    const out = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { out.push(cell); cell = ''; } else cell += ch;
    }
    out.push(cell);
    return out;
  });

  $('menu-export').addEventListener('click', () => {
    const lines = [COLUMNS.join(','), ...items.map((d) => COLUMNS.map((c) => csvCell(c === 'suggested' ? (d.suggested ? 1 : 0) : (d[c] ?? ''))).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/csv' }));
    const a = el('a', { href: url, download: 'my-menu.csv' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say(`Downloaded ${items.length} ${items.length === 1 ? 'item' : 'items'} as a CSV file.`);
  });

  const file = $('menu-file');
  $('menu-import').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    const rows = parseCsv(f.size < 500000 ? await f.text() : '');
    const head = rows.shift() || [];
    const at = Object.fromEntries(COLUMNS.map((c) => [c, head.indexOf(c)]));
    const found = ['kind', 'name', 'cost', 'price'].every((c) => at[c] >= 0) ? rows.map((r) => ({
      kind: r[at.kind], name: (r[at.name] || '').trim().slice(0, 40), cost: parseFloat(r[at.cost]), price: parseFloat(r[at.price]),
      suggested: at.suggested >= 0 && r[at.suggested] === '1', sold: at.sold >= 0 ? Math.max(0, Math.floor(parseFloat(r[at.sold]) || 0)) : 0,
      state: at.state >= 0 ? r[at.state] || '' : '',
    })).filter((d) => valid(d) && d.cost >= 0 && d.price >= 0) : [];
    if (!found.length) { say('That file has no dishes this menu can read. Use a CSV downloaded from here.'); return; }
    for (const d of found) {
      const i = items.findIndex((x) => x.kind === d.kind && x.name.toLowerCase() === d.name.toLowerCase());
      if (i >= 0) items[i] = d; else if (items.length < MAX_ITEMS) items.push(d);
    }
    persist();
    render();
    say(`Imported ${found.length} ${found.length === 1 ? 'item' : 'items'}.${storable ? '' : BLOCKED}`);
  });

  // Clearing everything takes a second, deliberate click
  const clear = $('menu-clear');
  let armTimer = 0;
  const disarm = () => { clear.removeAttribute('data-armed'); clear.textContent = 'Clear my menu'; };
  clear.addEventListener('click', () => {
    if (!clear.hasAttribute('data-armed')) {
      clear.setAttribute('data-armed', '');
      clear.textContent = 'Click again to clear everything';
      clearTimeout(armTimer);
      armTimer = setTimeout(disarm, 5000);
      return;
    }
    clearTimeout(armTimer);
    disarm();
    items = [];
    persist();
    render();
    say('Cleared your menu from this browser.');
  });

  render();
})();

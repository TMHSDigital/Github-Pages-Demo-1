'use strict';

// Month-by-month prime cost tracker. A visitor saves the prime cost tool's current numbers
// against a month; saved months are kept in this browser only (localStorage), shown as a
// trend line and a table, and can be exported to or imported from CSV, or cleared.
// Nothing is saved until the visitor asks, and nothing is ever sent.
(() => {
  const box = document.getElementById('tracker');
  const prime = window.TMHSTools && window.TMHSTools.tools.prime;
  if (!box || !prime) return;

  const C = window.TMHSCalc;
  const KEY = 'tmhs-prime-months';
  const MAX_MONTHS = 60;
  const $ = (id) => document.getElementById('tracker-' + id);
  const monthInput = $('month');
  const status = $('status');
  const view = $('view');
  const clear = $('clear');
  const SVG = 'http://www.w3.org/2000/svg';

  let storable = true;
  const read = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data.filter(valid) : [];
    } catch {
      storable = false;
      return [];
    }
  };
  const write = (months) => {
    try {
      if (months.length) localStorage.setItem(KEY, JSON.stringify(months));
      else localStorage.removeItem(KEY);
      return true;
    } catch {
      storable = false;
      return false;
    }
  };

  const num = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  function valid(m) {
    return m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m.month) && num(m.sales) && num(m.food) && num(m.labor) && num(m.other);
  }
  const primeOf = (m) => C.primeCostPct(m.food, m.labor);
  const label = (month, style = 'long') => {
    const [y, mo] = month.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleString('en-US', { month: style, year: 'numeric' });
  };
  const points = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US') + (Math.abs(n) === 1 ? ' point' : ' points');

  let months = read();
  let statusTimer = 0;
  const say = (text) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 8000);
  };

  // Default to last month: the month most operators have just closed
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  monthInput.value = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
  monthInput.max = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const store = (next) => {
    months = next.sort((a, b) => a.month.localeCompare(b.month)).slice(-MAX_MONTHS);
    const saved = write(months);
    render();
    return saved;
  };

  // Trend line of prime cost %, with the 60% "strong" line for reference. The table below
  // carries the same numbers for screen readers, so the chart itself is hidden from them.
  const chart = (shown) => {
    const svg = $('chart');
    svg.replaceChildren();
    // Drawn at its real width, so text stays at its real size on a phone
    const W = Math.round(svg.getBoundingClientRect().width) || 640;
    const H = W < 480 ? 160 : 190;
    const pad = { l: 44, r: 20, t: 22, b: 30 };
    const values = shown.map(primeOf);
    const lo = Math.floor(Math.min(C.STRONG_BELOW, ...values) / 5) * 5 - 5;
    const hi = Math.ceil(Math.max(C.STRONG_BELOW, ...values) / 5) * 5 + 5;
    const x = (i) => (shown.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i * (W - pad.l - pad.r)) / (shown.length - 1));
    const y = (v) => pad.t + ((hi - v) * (H - pad.t - pad.b)) / (hi - lo);
    const el = (name, attrs, parent = svg) => {
      const n = document.createElementNS(SVG, name);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
      parent.append(n);
      return n;
    };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    for (let v = lo; v <= hi; v += 5) {
      if (v === C.STRONG_BELOW) continue;
      el('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) });
      el('text', { class: 'tick', x: pad.l - 8, y: y(v) + 4, 'text-anchor': 'end' }).textContent = v + '%';
    }
    el('line', { class: 'ref', x1: pad.l, x2: W - pad.r, y1: y(C.STRONG_BELOW), y2: y(C.STRONG_BELOW) });
    el('text', { class: 'ref-label', x: pad.l + 6, y: y(C.STRONG_BELOW) + 16 }).textContent = 'Strong: under ' + C.STRONG_BELOW + '%';
    el('text', { class: 'tick', x: pad.l - 8, y: y(C.STRONG_BELOW) + 4, 'text-anchor': 'end' }).textContent = C.STRONG_BELOW + '%';

    if (shown.length > 1) el('polyline', { class: 'trend', points: values.map((v, i) => `${x(i)},${y(v)}`).join(' ') });
    const every = Math.ceil(shown.length / Math.max(2, Math.floor((W - pad.l - pad.r) / 64))); // keep month labels from colliding
    shown.forEach((m, i) => {
      const g = el('g', { class: 'pt' + (i === shown.length - 1 ? ' is-last' : '') });
      el('circle', { class: 'hit', cx: x(i), cy: y(values[i]), r: 14 }, g);
      el('circle', { class: 'dot', cx: x(i), cy: y(values[i]), r: 5 }, g);
      el('title', {}, g).textContent = `${label(m.month)}: prime cost ${C.pct1(values[i])}`;
      if (i % every === 0 || i === shown.length - 1) {
        el('text', { class: 'tick', x: x(i), y: H - 8, 'text-anchor': i === shown.length - 1 && i ? 'end' : 'middle' }).textContent = label(m.month, 'short').replace(/ (\d{2})(\d{2})$/, ' ’$2');
      }
    });
    // the latest value, labelled directly
    const lastI = shown.length - 1;
    el('text', { class: 'val', x: x(lastI), y: y(values[lastI]) - 12, 'text-anchor': lastI && shown.length > 1 ? 'end' : 'middle' }).textContent = C.pct1(values[lastI]);
  };

  const summary = () => {
    const latest = months[months.length - 1];
    const p = primeOf(latest);
    let s = `Latest: ${label(latest.month)}, prime cost ${C.pct1(p)} (${C.band(p).label.toLowerCase()}).`;
    if (months.length > 1) {
      const prev = months[months.length - 2];
      const d = Math.round((p - primeOf(prev)) * 10) / 10;
      s += d === 0 ? ` Level with ${label(prev.month)}.` : ` ${d < 0 ? 'Down' : 'Up'} ${points(Math.abs(d))} from ${label(prev.month)}.`;
    }
    if (months.length >= 3) {
      const three = months.slice(-3).map(primeOf);
      s += ` Three-month average ${C.pct1(three.reduce((a, b) => a + b, 0) / 3)}.`;
    }
    return s;
  };

  const render = () => {
    view.hidden = !months.length;
    $('empty').hidden = months.length > 0;
    if (!months.length) return;
    chart(months.slice(-12));
    $('summary').textContent = summary();
    const rows = $('rows');
    rows.replaceChildren();
    for (const m of [...months].reverse()) {
      const tr = document.createElement('tr');
      const p = primeOf(m);
      const cells = [label(m.month, 'short'), m.sales ? C.usd(m.sales) : '–', C.pct1(m.food), C.pct1(m.labor), `${C.pct1(p)} (${C.band(p).label.toLowerCase()})`];
      cells.forEach((text, i) => {
        const td = document.createElement(i ? 'td' : 'th');
        if (!i) td.scope = 'row';
        td.textContent = text;
        tr.append(td);
      });
      const td = document.createElement('td');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'row-del';
      del.dataset.month = m.month;
      del.setAttribute('aria-label', 'Remove ' + label(m.month));
      del.innerHTML = '<svg aria-hidden="true"><use href="#i-x"/></svg>';
      td.append(del);
      tr.append(td);
      rows.append(tr);
    }
  };

  $('save').addEventListener('click', () => {
    if (!/^\d{4}-\d{2}$/.test(monthInput.value)) { say('Choose the month these numbers are for.'); monthInput.focus(); return; }
    const s = prime.snapshot();
    const entry = { month: monthInput.value, sales: s.sales, food: s.food, labor: s.labor, other: s.other };
    const replacing = months.some((m) => m.month === entry.month);
    const saved = store([...months.filter((m) => m.month !== entry.month), entry]);
    const what = `${replacing ? 'Updated' : 'Saved'} ${label(entry.month)}: prime cost ${C.pct1(primeOf(entry))}.`;
    say(saved ? what : what + ' Your browser is blocking storage, so it lasts only until you leave this page.');
  });

  $('rows').addEventListener('click', (e) => {
    const del = e.target.closest('.row-del');
    if (!del) return;
    const month = del.dataset.month;
    const i = [...$('rows').querySelectorAll('.row-del')].indexOf(del);
    store(months.filter((m) => m.month !== month));
    say(`Removed ${label(month)}.`);
    // keep keyboard focus nearby: the next remove button, else the save button
    const dels = [...$('rows').querySelectorAll('.row-del')];
    (dels[Math.min(i, dels.length - 1)] || $('save')).focus();
  });

  // CSV keeps the numbers portable: one row per month, shares as % of sales
  const COLUMNS = ['month', 'sales', 'food_pct', 'labor_pct', 'other_pct', 'prime_pct'];
  $('export').addEventListener('click', () => {
    const lines = [COLUMNS.join(','), ...months.map((m) => [m.month, m.sales, m.food, m.labor, m.other, primeOf(m)].join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n') + '\n'], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prime-cost-by-month.csv';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say(`Downloaded ${months.length} ${months.length === 1 ? 'month' : 'months'} as a CSV file.`);
  });

  const file = $('file');
  $('import').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    const text = f.size < 200000 ? await f.text() : '';
    const rows = text.split(/\r?\n/).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
    const head = rows.shift() || [];
    const at = Object.fromEntries(COLUMNS.map((c) => [c, head.indexOf(c)]));
    const found = head.length && ['month', 'food_pct', 'labor_pct'].every((c) => at[c] >= 0)
      ? rows.map((r) => ({
        month: r[at.month],
        sales: at.sales >= 0 ? Math.round(parseFloat(r[at.sales]) || 0) : 0,
        food: Math.round(parseFloat(r[at.food_pct]) * 10) / 10,
        labor: Math.round(parseFloat(r[at.labor_pct]) * 10) / 10,
        other: at.other_pct >= 0 ? Math.round((parseFloat(r[at.other_pct]) || 0) * 10) / 10 : 0,
      })).filter((m) => valid(m) && m.food <= 100 && m.labor <= 100 && m.other <= 100)
      : [];
    if (!found.length) {
      say('That file has no months this tracker can read. Use a CSV exported from here.');
      return;
    }
    const byMonth = new Map(months.map((m) => [m.month, m]));
    found.forEach((m) => byMonth.set(m.month, m));
    store([...byMonth.values()]);
    say(`Imported ${found.length} ${found.length === 1 ? 'month' : 'months'}.`);
  });

  // Clearing everything takes a second, deliberate click
  let armTimer = 0;
  const disarm = () => { clear.removeAttribute('data-armed'); clear.textContent = 'Clear saved months'; };
  clear.addEventListener('click', () => {
    if (!clear.hasAttribute('data-armed')) {
      clear.setAttribute('data-armed', '');
      clear.textContent = 'Click again to clear all';
      clearTimeout(armTimer);
      armTimer = setTimeout(disarm, 5000);
      return;
    }
    clearTimeout(armTimer);
    disarm();
    store([]);
    say('Cleared all saved months from this browser.');
    $('save').focus();
  });

  // The message builder can mention the trend when the visitor includes their numbers
  prime.history = () => (months.length ? 'Saved months: ' + months.slice(-6).map((m) => `${label(m.month, 'short')} ${C.pct1(primeOf(m))}`).join(', ') : '');

  // Redraw the chart when its width changes (rotation, window resize)
  let drawnAt = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w && w !== drawnAt && months.length) { drawnAt = w; chart(months.slice(-12)); }
    }).observe($('chart'));
  }

  if (!storable) say('Your browser is blocking storage, so saved months last only until you leave this page.');
  render();
})();

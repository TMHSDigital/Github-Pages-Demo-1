'use strict';

// Prime cost tool: readout, gauge, cost breakdown and what-if savings.
// Each cost line is held as typed: a % of sales, or a dollar amount from the P&L that becomes
// a % once sales is known, so sales and costs can be entered in any order.
(() => {
  const form = document.getElementById('calc');
  if (!form) return;

  const C = window.TMHSCalc;
  const $ = (id) => document.getElementById(id);
  const revenue = $('calc-revenue');
  const KEYS = ['food', 'labor', 'other'];
  const ranges = Object.fromEntries(KEYS.map((k) => [k, $('calc-' + k)]));
  const typed = Object.fromEntries(KEYS.map((k) => [k, $('calc-' + k + '-in')]));
  const out = form.querySelector('.calc-out');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lines = Object.fromEntries(KEYS.map((k) => [k, { mode: 'pct', value: +ranges[k].value }]));
  const view = { pct: 0, prime: 0, left: 0 };
  let raf = 0;
  let summaryTimer = 0;
  let current = { sales: 0, food: 0, labor: 0, other: 0, pct: 0, band: C.band(0) };

  const paint = () => {
    $('out-prime-pct').textContent = C.pct1(view.pct);
    $('out-prime-usd').textContent = C.usd(view.prime);
    $('out-left-usd').textContent = C.usd(view.left);
  };

  const tween = (target) => {
    cancelAnimationFrame(raf);
    if (reduced) { Object.assign(view, target); paint(); return; }
    const from = { ...view };
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / 550, 1);
      const e = 1 - Math.pow(1 - p, 3);
      for (const k of Object.keys(target)) view[k] = from[k] + (target[k] - from[k]) * e;
      if (p === 1) Object.assign(view, target); // land exactly, so the readout shows no rounding drift
      paint();
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  // Stacked bar of where each sales dollar goes; scaled down if costs pass 100%
  const paintSplit = (food, labor, other, leftPct) => {
    const scale = Math.max(100, food + labor + other);
    for (const [k, v] of Object.entries({ food, labor, other, left: leftPct })) {
      const seg = form.querySelector('.seg-' + k);
      if (seg) seg.style.setProperty('--w', (v / scale) * 100 + '%');
      const label = $('split-' + k);
      if (label) label.textContent = C.pct1(v);
    }
  };

  const points = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US') + (n === 1 ? ' point' : ' points');

  const paintWhatIf = (sales, pct) => {
    const w = C.whatIf(sales, pct);
    $('wi-point').textContent = sales ? C.usd(w.pointMonthly) + ' a month' : 'Enter your sales';
    $('wi-point-yr').textContent = sales ? C.usd(w.pointYearly) + ' a year' : '';
    if (!sales) {
      $('wi-gap').textContent = 'Enter your sales';
      $('wi-gap-note').textContent = '';
    } else if (w.gapPts > 0) {
      $('wi-gap').textContent = '+' + C.usd(w.gapYearly) + ' a year';
      $('wi-gap-note').textContent = 'if prime cost came down ' + points(w.gapPts);
    } else {
      $('wi-gap').textContent = 'Already there';
      $('wi-gap-note').textContent = 'prime cost is ' + C.STRONG_BELOW + '% or lower';
    }
  };

  // Say why a sales entry can't be used (a minus sign, scientific notation) instead of guessing
  const flagRevenue = () => {
    const issue = C.moneyIssue(revenue.value);
    $('calc-revenue-issue').textContent = issue;
    if (issue) revenue.setAttribute('aria-invalid', 'true');
    else revenue.removeAttribute('aria-invalid');
    return issue;
  };

  // A cost line as it reads in its field: dollars stay dollars, a % shows one decimal at most
  const lineText = (line, pct) => (line.mode === 'usd' ? C.usd(line.value) : C.pct1(pct));
  // The other way to read it, under the slider
  const altText = (line, pct, sales) => {
    if (line.mode === 'usd') return sales ? C.pct1(pct) + ' of sales' : 'Enter your monthly sales to turn this into a percentage';
    return sales ? C.usd((sales * pct) / 100) + ' a month' : '';
  };

  const update = () => {
    flagRevenue();
    const sales = C.parseMoney(revenue.value);
    const share = Object.fromEntries(KEYS.map((k) => [k, C.lineShare(lines[k], sales)]));

    for (const k of KEYS) {
      const el = ranges[k];
      const p = share[k];
      // The slider shows the nearest whole point it can; the typed value is what is used
      el.value = String(Math.min(+el.max, Math.max(+el.min, Math.round(p))));
      el.setAttribute('aria-valuetext', C.pct1(p) + ' of sales'); // the typed field is announced separately
      el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
      if (document.activeElement !== typed[k]) typed[k].value = lineText(lines[k], p);
      $('calc-' + k + '-alt').textContent = altText(lines[k], p, sales);
    }

    const { food, labor, other } = share;
    const pct = C.primeCostPct(food, labor);
    const leftPct = C.leftoverPct(food, labor, other);
    const band = C.band(pct);

    $('gauge-fill').setAttribute('stroke-dashoffset', String(100 - Math.min(pct, 100)));
    out.setAttribute('data-band', band.key);
    $('out-band').textContent = band.label;

    tween({ pct, prime: (sales * pct) / 100, left: (sales * leftPct) / 100 });
    paintSplit(food, labor, other, leftPct);
    paintWhatIf(sales, pct);
    current = { sales, food, labor, other, pct, band };
    document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: 'prime' } }));

    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(() => {
      const total = Math.round((food + labor + other) * 10) / 10;
      let money;
      if (!sales) money = ' Enter your monthly sales to see dollar amounts.';
      else if (total >= 100) money = ' These costs add up to ' + C.pct1(total) + ' of sales, so nothing is left for rent, other overheads or profit.';
      else money = ' About ' + C.usd((sales * leftPct) / 100) + ' is left after these costs.';
      $('out-summary').textContent = 'Prime cost is ' + C.pct1(pct) + ', ' + band.label.toLowerCase() + '.' + money;
    }, 450);
  };

  const tidyRevenue = () => {
    if (flagRevenue()) return; // leave it as typed so it can be corrected
    const n = C.parseMoney(revenue.value);
    revenue.value = n ? n.toLocaleString('en-US') : '';
  };

  // Reformat with thousands separators while keeping the caret after the same digit.
  // Shorthand ("120k", "1.5m"), a decimal point or an entry that needs correcting is left as
  // typed until the field is left, so it can be finished; the numbers update live either way.
  revenue.addEventListener('input', () => {
    if (/[.km]/i.test(revenue.value) || C.moneyIssue(revenue.value)) { update(); return; }
    const caret = revenue.selectionStart ?? revenue.value.length;
    const digitsBefore = revenue.value.slice(0, caret).replace(/[^\d]/g, '').length;
    const n = C.parseMoney(revenue.value);
    revenue.value = n ? n.toLocaleString('en-US') : '';
    let pos = 0;
    for (let seen = 0; pos < revenue.value.length && seen < digitsBefore; pos++) {
      if (/\d/.test(revenue.value[pos])) seen++;
    }
    if (document.activeElement === revenue) revenue.setSelectionRange(pos, pos);
    update();
  });
  revenue.addEventListener('change', tidyRevenue);

  for (const k of KEYS) {
    // Dragging a slider sets that line as a percentage
    ranges[k].addEventListener('input', () => {
      lines[k] = { mode: 'pct', value: +ranges[k].value };
      update();
    });
    // Typing updates live without touching the field; leaving it shows the value as used
    typed[k].addEventListener('input', () => {
      const line = C.parseCost(typed[k].value);
      if (line) { lines[k] = line; update(); }
    });
    typed[k].addEventListener('blur', update);
  }

  const defaults = { revenue: revenue.defaultValue, ...Object.fromEntries(KEYS.map((k) => [k, +ranges[k].defaultValue])) };
  const reset = $('calc-reset');
  if (reset) {
    reset.addEventListener('click', () => {
      revenue.value = defaults.revenue;
      for (const k of KEYS) lines[k] = { mode: 'pct', value: defaults[k] };
      update();
    });
  }

  // From a shared link: "food=31.5" is a percentage, "food_usd=31240" a dollar amount
  const readLine = (s, k) => {
    const usd = parseFloat(s[k + '_usd']);
    if (Number.isFinite(usd) && usd >= 0) return { mode: 'usd', value: Math.min(Math.round(usd), 10000000) };
    const pct = parseFloat(s[k]);
    if (Number.isFinite(pct)) return { mode: 'pct', value: Math.min(100, Math.max(0, Math.round(pct * 10) / 10)) };
    return null;
  };

  const describe = (k) => C.pct1(current[k]) + (lines[k].mode === 'usd' ? ' (' + C.usd(lines[k].value) + ')' : '');

  window.TMHSTools.tools.prime = {
    label: 'prime cost',
    get: () => ({
      sales: current.sales,
      ...Object.fromEntries(KEYS.map((k) => (lines[k].mode === 'usd' ? [k + '_usd', lines[k].value] : [k, lines[k].value]))),
    }),
    set: (s) => {
      if (s.sales != null) { revenue.value = String(s.sales); tidyRevenue(); }
      for (const k of KEYS) {
        const line = readLine(s, k);
        if (line) lines[k] = line;
      }
      update();
    },
    summary: () => [
      'Monthly sales: ' + (current.sales ? C.usd(current.sales) : 'not entered'),
      'Food and beverage ' + describe('food') + ', labor ' + describe('labor') + ', other controllable costs ' + describe('other'),
      'Prime cost: ' + C.pct1(current.pct) + ' (' + current.band.label.toLowerCase() + ')',
    ],
  };

  update();
})();

'use strict';

// Prime cost tool: readout, gauge, cost breakdown and what-if savings.
(() => {
  const form = document.getElementById('calc');
  if (!form) return;

  const C = window.TMHSCalc;
  const $ = (id) => document.getElementById(id);
  const revenue = $('calc-revenue');
  const ranges = { food: $('calc-food'), labor: $('calc-labor'), other: $('calc-other') };
  const out = form.querySelector('.calc-out');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const view = { pct: 0, prime: 0, left: 0 };
  let raf = 0;
  let summaryTimer = 0;
  let current = { sales: 0, food: 0, labor: 0, other: 0, pct: 0, band: C.band(0) };

  const paint = () => {
    $('out-prime-pct').textContent = Math.round(view.pct) + '%';
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
      if (label) label.textContent = v + '%';
    }
  };

  const paintWhatIf = (sales, pct) => {
    const w = C.whatIf(sales, pct);
    $('wi-point').textContent = sales ? C.usd(w.pointMonthly) + ' a month' : 'Enter your sales';
    $('wi-point-yr').textContent = sales ? C.usd(w.pointYearly) + ' a year' : '';
    if (!sales) {
      $('wi-gap').textContent = 'Enter your sales';
      $('wi-gap-note').textContent = '';
    } else if (w.gapPts > 0) {
      $('wi-gap').textContent = '+' + C.usd(w.gapYearly) + ' a year';
      $('wi-gap-note').textContent = 'if prime cost came down ' + w.gapPts + (w.gapPts === 1 ? ' point' : ' points');
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

  const update = () => {
    flagRevenue();
    const sales = C.parseMoney(revenue.value);
    const food = +ranges.food.value;
    const labor = +ranges.labor.value;
    const other = +ranges.other.value;

    for (const [k, el] of Object.entries(ranges)) {
      $('calc-' + k + '-out').textContent = el.value + '%';
      el.setAttribute('aria-valuetext', el.value + '% of sales'); // the visible % label is hidden from screen readers
      el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
    }

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
      const total = food + labor + other;
      let money;
      if (!sales) money = ' Enter your monthly sales to see dollar amounts.';
      else if (total >= 100) money = ' These costs add up to ' + total + '% of sales, so nothing is left for rent, other overheads or profit.';
      else money = ' About ' + C.usd((sales * leftPct) / 100) + ' is left after these costs.';
      $('out-summary').textContent = 'Prime cost is ' + pct + '%, ' + band.label.toLowerCase() + '.' + money;
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
  Object.values(ranges).forEach((el) => el.addEventListener('input', update));

  const defaults = { revenue: revenue.defaultValue, food: ranges.food.defaultValue, labor: ranges.labor.defaultValue, other: ranges.other.defaultValue };
  const reset = $('calc-reset');
  if (reset) {
    reset.addEventListener('click', () => {
      revenue.value = defaults.revenue;
      ranges.food.value = defaults.food;
      ranges.labor.value = defaults.labor;
      ranges.other.value = defaults.other;
      update();
    });
  }

  const clampRange = (el, v) => {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) el.value = String(Math.min(+el.max, Math.max(+el.min, n)));
  };

  window.TMHSTools.tools.prime = {
    label: 'prime cost',
    get: () => ({ sales: current.sales, food: current.food, labor: current.labor, other: current.other }),
    set: (s) => {
      if (s.sales != null) { revenue.value = String(s.sales); tidyRevenue(); }
      for (const k of Object.keys(ranges)) if (s[k] != null) clampRange(ranges[k], s[k]);
      update();
    },
    summary: () => [
      'Monthly sales: ' + (current.sales ? C.usd(current.sales) : 'not entered'),
      'Food and beverage ' + current.food + '%, labor ' + current.labor + '%, other controllable costs ' + current.other + '%',
      'Prime cost: ' + current.pct + '% (' + current.band.label.toLowerCase() + ')',
    ],
  };

  update();
})();

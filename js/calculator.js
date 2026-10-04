'use strict';

// Prime cost calculator. Everything runs in the browser; nothing is sent or stored.
// Bands are common rules of thumb and are flagged TODO(verify) in index.html.
const TMHSCalc = (() => {
  const MAX_SALES = 10000000;

  const parseMoney = (text) => {
    const whole = String(text).split('.')[0]; // ignore cents
    const n = parseInt(whole.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? Math.min(n, MAX_SALES) : 0;
  };

  const primeCostPct = (food, labor) => food + labor;
  const leftoverPct = (food, labor, other) => Math.max(0, 100 - food - labor - other);

  // under 60 strong, 60 to <65 on target, 65 to <70 watch, 70+ needs attention
  const band = (pct) => {
    if (pct < 60) return { key: 'strong', label: 'Strong', color: '#6EE7B7' };
    if (pct < 65) return { key: 'target', label: 'On target', color: '#86CCF8' };
    if (pct < 70) return { key: 'watch', label: 'Watch closely', color: '#FCD34D' };
    return { key: 'attention', label: 'Needs attention', color: '#FCA5A5' };
  };

  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');

  return { parseMoney, primeCostPct, leftoverPct, band, usd };
})();

window.TMHSCalc = TMHSCalc;

(() => {
  const form = document.getElementById('calc');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const revenue = $('calc-revenue');
  const ranges = { food: $('calc-food'), labor: $('calc-labor'), other: $('calc-other') };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const view = { pct: 0, prime: 0, left: 0 };
  let raf = 0;
  let summaryTimer = 0;

  const paint = () => {
    $('out-prime-pct').textContent = Math.round(view.pct) + '%';
    $('out-prime-usd').textContent = TMHSCalc.usd(view.prime);
    $('out-left-usd').textContent = TMHSCalc.usd(view.left);
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

  const update = () => {
    const sales = TMHSCalc.parseMoney(revenue.value);
    const food = +ranges.food.value;
    const labor = +ranges.labor.value;
    const other = +ranges.other.value;

    for (const [k, el] of Object.entries(ranges)) {
      $('calc-' + k + '-out').textContent = el.value + '%';
      el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
    }

    const pct = TMHSCalc.primeCostPct(food, labor);
    const leftPct = TMHSCalc.leftoverPct(food, labor, other);
    const band = TMHSCalc.band(pct);

    const gauge = $('gauge-fill');
    gauge.style.setProperty('--gauge', band.color);
    gauge.setAttribute('stroke-dashoffset', String(100 - Math.min(pct, 100)));
    form.querySelector('.calc-out').style.setProperty('--gauge', band.color);
    $('out-band').textContent = band.label;

    tween({ pct, prime: (sales * pct) / 100, left: (sales * leftPct) / 100 });

    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(() => {
      const money = sales ? ' About ' + TMHSCalc.usd((sales * leftPct) / 100) + ' is left after these costs.' : ' Enter your monthly sales to see dollar amounts.';
      $('out-summary').textContent = 'Prime cost is ' + pct + '%, ' + band.label.toLowerCase() + '.' + money;
    }, 450);
  };

  // Reformat with thousands separators while keeping the caret after the same digit
  revenue.addEventListener('input', () => {
    const caret = revenue.selectionStart ?? revenue.value.length;
    const digitsBefore = revenue.value.slice(0, caret).replace(/[^\d]/g, '').length;
    const n = TMHSCalc.parseMoney(revenue.value);
    revenue.value = n ? n.toLocaleString('en-US') : '';
    let pos = 0;
    for (let seen = 0; pos < revenue.value.length && seen < digitsBefore; pos++) {
      if (/\d/.test(revenue.value[pos])) seen++;
    }
    if (document.activeElement === revenue) revenue.setSelectionRange(pos, pos);
    update();
  });
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

  update();
})();

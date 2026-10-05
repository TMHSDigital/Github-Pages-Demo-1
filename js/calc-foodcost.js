'use strict';

// Actual food cost tool: food used (opening inventory + purchases - closing inventory) as a share
// of food sales, and the gap to theoretical (recipe) food cost in points and dollars.
// Example values and the gap bands are flagged TODO(verify) in index.html and js/calc-math.js.
(() => {
  const panel = document.getElementById('foodcost');
  if (!panel) return;

  const C = window.TMHSCalc;
  const $ = (id) => document.getElementById('fc-' + id);
  const fields = { open: $('open'), purchases: $('purchases'), close: $('close'), sales: $('sales') };
  const theory = $('theory');
  const out = panel.querySelector('.calc-out');
  let summaryTimer = 0;
  let current = {};

  const read = () => ({
    ...Object.fromEntries(Object.entries(fields).map(([k, el]) => [k, C.parseMoney(el.value)])),
    theory: theory.value.trim() ? Math.min(C.parseAmount(theory.value, 100), 100) : null,
  });
  const points = (n) => C.pct1(Math.abs(n)).replace('%', '') + (Math.abs(n) === 1 ? ' point' : ' points');
  const show = (id, text) => { $(id).textContent = text; };

  const update = () => {
    const s = read();
    const used = C.cogs(s.open, s.purchases, s.close);
    const miscount = used < 0;
    show('close-issue', miscount ? 'Closing inventory is more than opening inventory plus purchases. Check the counts and invoices.' : '');
    if (miscount) fields.close.setAttribute('aria-invalid', 'true');
    else fields.close.removeAttribute('aria-invalid');

    const pct = !miscount && s.sales > 0 ? (used / s.sales) * 100 : null;
    const gap = pct != null && s.theory != null ? C.variance(pct, s.theory, s.sales) : null;
    const band = gap ? C.varianceBand(gap.pts) : null;

    show('out-pct', pct == null ? (miscount ? 'Check counts' : 'Add sales') : C.pct1(pct));
    show('out-cogs', miscount ? '–' : C.usd(used));
    show('out-month', gap ? (gap.pts > 0 ? C.usd(gap.monthly) : 'None') : '–');
    show('out-year', gap ? (gap.pts > 0 ? C.usd(gap.yearly) : 'None') : '–');
    const chip = $('band');
    chip.hidden = !band;
    if (band) chip.textContent = gap.pts > 0 ? `${band.label}: +${points(gap.pts)}` : `${band.label}: ${gap.pts < 0 ? points(gap.pts) + ' under' : 'on the nose'}`;
    out.setAttribute('data-band', band ? band.key : 'none');

    current = { ...s, used, pct, gap, band, miscount };
    document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: 'foodcost' } }));

    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(() => {
      let text;
      if (miscount) text = 'Closing inventory is more than opening inventory plus purchases, so food used comes out negative. Check the counts.';
      else if (pct == null) text = `Food used is ${C.usd(used)}. Add food sales to see it as a percentage.`;
      else {
        text = `Food used is ${C.usd(used)}, so actual food cost is ${C.pct1(pct)} of sales.`;
        if (gap) {
          text += gap.pts > 0
            ? ` That is ${points(gap.pts)} over your ${C.pct1(s.theory)} theoretical, about ${C.usd(gap.monthly)} a month or ${C.usd(gap.yearly)} a year.`
            : ` That is at or under your ${C.pct1(s.theory)} theoretical.`;
        }
      }
      show('summary', text);
    }, 450);
  };

  // Once a field is left, show the amount exactly as it is used
  const tidy = (el) => () => { const n = C.parseMoney(el.value); el.value = n ? n.toLocaleString('en-US') : (el.value.trim() ? '0' : ''); };
  for (const el of Object.values(fields)) {
    el.addEventListener('input', update);
    el.addEventListener('change', tidy(el));
  }
  theory.addEventListener('input', update);
  theory.addEventListener('change', () => { if (theory.value.trim()) theory.value = String(Math.min(C.parseAmount(theory.value, 100), 100)); });

  const all = [...Object.values(fields), theory];
  const defaults = Object.fromEntries(all.map((el) => [el.id, el.defaultValue]));
  $('reset').addEventListener('click', () => {
    for (const el of all) el.value = defaults[el.id];
    update();
  });

  window.TMHSTools.tools.foodcost = {
    label: 'actual food cost',
    get: () => ({ open: current.open, purchases: current.purchases, close: current.close, sales: current.sales, theory: current.theory ?? '' }),
    set: (s) => {
      for (const [k, el] of Object.entries(fields)) {
        if (s[k] != null) { el.value = String(s[k]); tidy(el)(); }
      }
      if (s.theory != null) theory.value = s.theory === '' ? '' : String(Math.min(C.parseAmount(s.theory, 100), 100));
      update();
    },
    summary: () => {
      const lines = ['Opening inventory ' + C.usd(current.open) + ', purchases ' + C.usd(current.purchases) + ', closing inventory ' + C.usd(current.close) + ', food sales ' + C.usd(current.sales)];
      if (current.miscount) return [...lines, 'Food used comes out negative: the counts need checking'];
      lines.push('Food used: ' + C.usd(current.used) + (current.pct != null ? ', actual food cost ' + C.pct1(current.pct) : ''));
      if (current.gap) {
        lines.push(current.gap.pts > 0
          ? 'Against ' + C.pct1(current.theory) + ' theoretical: ' + points(current.gap.pts) + ' over, about ' + C.usd(current.gap.yearly) + ' a year'
          : 'At or under ' + C.pct1(current.theory) + ' theoretical');
      }
      return lines;
    },
  };

  update();
})();

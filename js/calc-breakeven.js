'use strict';

// Break-even tool: the monthly sales that cover fixed costs once variable costs are paid, per
// week, per day open and in guests a day, plus how far the visitor's own sales sit from it.
// Variable costs can be dragged in whole points or typed as a % (one decimal) or as a dollar
// amount from the P&L, which becomes a share of the visitor's monthly sales.
// Example values are flagged TODO(verify) in index.html.
(() => {
  const panel = document.getElementById('breakeven');
  if (!panel) return;

  const C = window.TMHSCalc;
  const $ = (id) => document.getElementById('be-' + id);
  const fixed = $('fixed');
  const variable = $('variable');
  const typed = $('variable-in');
  const check = $('check');
  const days = $('days');
  const sales = $('sales');
  const out = panel.querySelector('.calc-out');
  const MAX_CHECK = 1000;
  const MAX_VARIABLE = 99; // at 100% nothing is ever left to cover fixed costs
  let line = { mode: 'pct', value: +variable.value };
  let summaryTimer = 0;
  let current = {};

  const read = () => ({
    fixed: C.parseMoney(fixed.value),
    check: C.parseAmount(check.value, MAX_CHECK),
    days: +days.value,
    sales: C.parseMoney(sales.value),
  });
  const fill = (el) => el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  const plural = (n, word) => n.toLocaleString('en-US') + ' ' + word + (n === 1 ? '' : 's');
  const show = (id, text) => { $(id).textContent = text; };

  const update = () => {
    const s = read();
    // A dollar amount needs sales to become a share; until then there is no answer to give
    const resolved = line.mode === 'pct' || s.sales > 0;
    const pct = resolved ? Math.min(C.lineShare(line, s.sales), MAX_VARIABLE) : null;

    if (pct != null) {
      variable.value = String(Math.min(+variable.max, Math.max(+variable.min, Math.round(pct))));
      variable.setAttribute('aria-valuetext', C.pct1(pct) + ' of sales');
    }
    fill(variable);
    if (document.activeElement !== typed) typed.value = line.mode === 'usd' ? C.usd(line.value) : C.pct1(pct);
    show('variable-alt', line.mode === 'usd'
      ? (resolved ? C.pct1(pct) + ' of your monthly sales' : 'Enter your monthly sales below to turn this into a percentage')
      : '');
    show('days-out', String(s.days));
    days.setAttribute('aria-valuetext', plural(s.days, 'day'));
    fill(days);

    if (!resolved) {
      for (const id of ['out-month', 'out-week', 'out-day', 'out-guests']) show(id, id === 'out-month' ? 'Add your sales' : '–');
      $('band').hidden = true;
      out.setAttribute('data-band', 'none');
      current = { ...s, variable: null, month: null };
      document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: 'breakeven' } }));
      clearTimeout(summaryTimer);
      summaryTimer = setTimeout(() => show('summary', 'Variable costs are in dollars, so enter your monthly sales to see break-even.'), 450);
      return;
    }

    const month = C.breakEven(s.fixed, pct);
    const day = month / s.days;
    const guests = s.check > 0 ? Math.ceil(day / s.check) : null; // a part guest still has to walk in
    show('out-month', C.usd(month));
    show('out-week', C.usd(month / C.WEEKS_PER_MONTH));
    show('out-day', C.usd(day));
    show('out-guests', guests == null ? 'Add a check' : guests.toLocaleString('en-US'));

    const profit = s.sales ? C.profitAt(s.sales, s.fixed, pct) : null;
    let band = null;
    if (profit != null) {
      band = s.sales >= month
        ? { key: 'strong', label: 'Above break-even by ' + C.usd(s.sales - month) }
        : { key: 'attention', label: 'Below break-even by ' + C.usd(month - s.sales) };
    }
    const chip = $('band');
    chip.hidden = !band;
    if (band) chip.textContent = band.label;
    out.setAttribute('data-band', band ? band.key : 'none');

    current = { ...s, variable: pct, month, day, guests, profit, band };
    document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: 'breakeven' } }));

    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(() => {
      let text = `Break-even is about ${C.usd(month)} a month, or ${C.usd(day)} for each of ${plural(s.days, 'day')} open`;
      text += guests == null ? '.' : `: ${plural(guests, 'guest')} a day at a ${C.usd2(s.check)} average check.`;
      if (profit != null) {
        text += profit >= 0
          ? ` At ${C.usd(s.sales)} a month, about ${C.usd(profit)} is left after these costs.`
          : ` At ${C.usd(s.sales)} a month, sales fall about ${C.usd(-profit)} short of covering these costs.`;
      }
      show('summary', text);
    }, 450);
  };

  // Once a field is left, show the amount exactly as it is used
  const tidyDollars = (el) => () => { const n = C.parseMoney(el.value); el.value = n ? n.toLocaleString('en-US') : ''; };
  fixed.addEventListener('change', tidyDollars(fixed));
  sales.addEventListener('change', tidyDollars(sales));
  check.addEventListener('change', () => { const n = C.parseAmount(check.value, MAX_CHECK); check.value = n ? n.toFixed(2) : ''; });
  // Dragging sets a whole-point percentage; typing takes a % or a dollar amount
  variable.addEventListener('input', () => { line = { mode: 'pct', value: +variable.value }; update(); });
  typed.addEventListener('input', () => {
    const parsed = C.parseCost(typed.value);
    if (parsed) { line = parsed.mode === 'pct' ? { mode: 'pct', value: Math.min(parsed.value, MAX_VARIABLE) } : parsed; update(); }
  });
  typed.addEventListener('blur', update);
  [fixed, check, days, sales].forEach((el) => el.addEventListener('input', update));

  const defaults = Object.fromEntries([fixed, variable, check, days, sales].map((el) => [el.id, el.defaultValue]));
  $('reset').addEventListener('click', () => {
    for (const el of [fixed, variable, check, days, sales]) el.value = defaults[el.id];
    line = { mode: 'pct', value: +defaults[variable.id] };
    update();
  });

  const clamp = (el, v) => String(Math.min(+el.max, Math.max(+el.min, Math.round(v))));

  window.TMHSTools.tools.breakeven = {
    label: 'break-even',
    // A typed dollar amount travels as dollars (variable_usd=) so it stays tied to the sales figure
    get: () => ({
      fixed: current.fixed,
      ...(line.mode === 'usd' ? { variable_usd: line.value } : { variable: line.value }),
      check: current.check || '',
      days: current.days,
      sales: current.sales || '',
    }),
    set: (s) => {
      if (s.fixed != null) { fixed.value = String(s.fixed); tidyDollars(fixed)(); }
      if (s.sales != null) { sales.value = String(s.sales); tidyDollars(sales)(); }
      if (s.check != null) { const n = C.parseAmount(s.check, MAX_CHECK); check.value = n ? n.toFixed(2) : ''; }
      const usd = parseFloat(s.variable_usd);
      const v = parseFloat(s.variable);
      if (Number.isFinite(usd) && usd >= 0) line = { mode: 'usd', value: Math.min(Math.round(usd), 10000000) };
      else if (Number.isFinite(v)) line = { mode: 'pct', value: Math.min(MAX_VARIABLE, Math.max(0, Math.round(v * 10) / 10)) };
      const d = parseFloat(s.days);
      if (Number.isFinite(d)) days.value = clamp(days, d);
      update();
    },
    summary: () => {
      if (current.month == null) return ['Variable costs: ' + C.usd(line.value) + ' a month (add monthly sales to see break-even)'];
      const lines = [
        'Monthly fixed costs: ' + C.usd(current.fixed) + ', variable costs ' + C.pct1(current.variable) + ' of sales' + (line.mode === 'usd' ? ' (' + C.usd(line.value) + ')' : ''),
        'Break-even sales: ' + C.usd(current.month) + ' a month, ' + C.usd(current.day) + ' a day over ' + plural(current.days, 'day') + ' open',
      ];
      if (current.guests != null) lines.push('That is ' + plural(current.guests, 'guest') + ' a day at a ' + C.usd2(current.check) + ' average check');
      if (current.band) lines.push('My sales: ' + C.usd(current.sales) + ' a month, ' + current.band.label.toLowerCase());
      return lines;
    },
  };

  update();
})();

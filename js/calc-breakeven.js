'use strict';

// Break-even tool: the monthly sales that cover fixed costs once variable costs are paid, per
// week, per day open and in guests a day, plus how far the visitor's own sales sit from it.
// Example values are flagged TODO(verify) in index.html.
(() => {
  const panel = document.getElementById('breakeven');
  if (!panel) return;

  const C = window.TMHSCalc;
  const $ = (id) => document.getElementById('be-' + id);
  const fixed = $('fixed');
  const variable = $('variable');
  const check = $('check');
  const days = $('days');
  const sales = $('sales');
  const out = panel.querySelector('.calc-out');
  const MAX_CHECK = 1000;
  let summaryTimer = 0;
  let current = {};

  const read = () => ({
    fixed: C.parseMoney(fixed.value),
    variable: +variable.value,
    check: C.parseAmount(check.value, MAX_CHECK),
    days: +days.value,
    sales: C.parseMoney(sales.value),
  });
  const fill = (el) => el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  const plural = (n, word) => n.toLocaleString('en-US') + ' ' + word + (n === 1 ? '' : 's');

  const update = () => {
    const s = read();
    $('variable-out').textContent = s.variable + '%';
    variable.setAttribute('aria-valuetext', s.variable + '% of sales');
    fill(variable);
    $('days-out').textContent = String(s.days);
    days.setAttribute('aria-valuetext', plural(s.days, 'day'));
    fill(days);

    const month = C.breakEven(s.fixed, s.variable); // the slider stops short of 100%, so this is finite
    const day = month / s.days;
    const guests = s.check > 0 ? Math.ceil(day / s.check) : null; // a part guest still has to walk in
    $('out-month').textContent = C.usd(month);
    $('out-week').textContent = C.usd(month / C.WEEKS_PER_MONTH);
    $('out-day').textContent = C.usd(day);
    $('out-guests').textContent = guests == null ? 'Add a check' : guests.toLocaleString('en-US');

    const profit = s.sales ? C.profitAt(s.sales, s.fixed, s.variable) : null;
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

    current = { ...s, month, day, guests, profit, band };
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
      $('summary').textContent = text;
    }, 450);
  };

  // Once a field is left, show the amount exactly as it is used
  const tidyDollars = (el) => () => { const n = C.parseMoney(el.value); el.value = n ? n.toLocaleString('en-US') : ''; };
  fixed.addEventListener('change', tidyDollars(fixed));
  sales.addEventListener('change', tidyDollars(sales));
  check.addEventListener('change', () => { const n = C.parseAmount(check.value, MAX_CHECK); check.value = n ? n.toFixed(2) : ''; });
  [fixed, variable, check, days, sales].forEach((el) => el.addEventListener('input', update));

  const defaults = Object.fromEntries([fixed, variable, check, days, sales].map((el) => [el.id, el.defaultValue]));
  $('reset').addEventListener('click', () => {
    for (const el of [fixed, variable, check, days, sales]) el.value = defaults[el.id];
    update();
  });

  const clamp = (el, v) => String(Math.min(+el.max, Math.max(+el.min, Math.round(v))));

  window.TMHSTools.tools.breakeven = {
    label: 'break-even',
    get: () => ({ fixed: current.fixed, variable: current.variable, check: current.check || '', days: current.days, sales: current.sales || '' }),
    set: (s) => {
      if (s.fixed != null) { fixed.value = String(s.fixed); tidyDollars(fixed)(); }
      if (s.sales != null) { sales.value = String(s.sales); tidyDollars(sales)(); }
      if (s.check != null) { const n = C.parseAmount(s.check, MAX_CHECK); check.value = n ? n.toFixed(2) : ''; }
      const v = parseFloat(s.variable);
      if (Number.isFinite(v)) variable.value = clamp(variable, v);
      const d = parseFloat(s.days);
      if (Number.isFinite(d)) days.value = clamp(days, d);
      update();
    },
    summary: () => {
      const lines = [
        'Monthly fixed costs: ' + C.usd(current.fixed) + ', variable costs ' + current.variable + '% of sales',
        'Break-even sales: ' + C.usd(current.month) + ' a month, ' + C.usd(current.day) + ' a day over ' + plural(current.days, 'day') + ' open',
      ];
      if (current.guests != null) lines.push('That is ' + plural(current.guests, 'guest') + ' a day at a ' + C.usd2(current.check) + ' average check');
      if (current.band) lines.push('My sales: ' + C.usd(current.sales) + ' a month, ' + current.band.label.toLowerCase());
      return lines;
    },
  };

  update();
})();

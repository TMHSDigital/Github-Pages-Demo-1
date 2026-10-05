'use strict';

// Plate cost and cocktail cost tools. Both are "ingredient rows -> cost -> price at a target cost %",
// so one recipe tool renders either from a small config. Example recipes and targets are flagged
// TODO(verify) in index.html.
(() => {
  const C = window.TMHSCalc;
  const MAX_ROWS = 12;
  // One cap per field, used for typing, tidying on blur and reading shared links alike
  const MAX_PRICE = 10000; // menu or drink price
  const MAX_EXTRA = 1000; // mixers, garnish and ice
  const SIZES = [375, 700, 750, 1000, 1750];
  const nearestSize = (ml) => SIZES.reduce((a, b) => (Math.abs(b - ml) < Math.abs(a - ml) ? b : a));
  // share links store rows as name_cost*name_cost, so those two characters are kept out of names
  const cleanName = (s) => String(s || '').replace(/[_*]/g, ' ').slice(0, 40);
  const money2 = (n) => (n ? n.toFixed(2) : '');
  const plain = (n) => (n ? String(n) : '');

  const CONFIGS = {
    plate: {
      label: 'plate cost',
      costWord: 'food cost',
      item: 'plate',
      fields: { name: 'name', cost: 'cost' },
      max: { cost: 1000 },
      rowCost: (r) => r.cost,
      fromParts: ([name, cost], max) => ({ name: cleanName(name), cost: C.parseAmount(cost, max.cost) }),
      toParts: (r) => [r.name, r.cost],
      blank: () => ({ name: '', cost: 0 }),
      defaults: () => ({
        rows: [
          { name: 'Protein', cost: 4.2 }, { name: 'Starch', cost: 0.6 },
          { name: 'Vegetables', cost: 0.85 }, { name: 'Sauce and garnish', cost: 0.55 },
        ],
        target: 30, price: 22, extra: 0,
      }),
    },
    cocktail: {
      label: 'cocktail cost',
      costWord: 'pour cost',
      item: 'drink',
      fields: { name: 'name', price: 'bottle price', ml: 'bottle size', oz: 'pour in ounces' },
      max: { price: 5000, oz: 20 },
      rowCost: (r) => C.pourCost(r.price, r.ml, r.oz),
      fromParts: ([name, price, ml, oz], max) => ({
        name: cleanName(name), price: C.parseAmount(price, max.price), ml: nearestSize(C.parseAmount(ml, 5000) || 750), oz: C.parseAmount(oz, max.oz),
      }),
      toParts: (r) => [r.name, r.price, r.ml, r.oz],
      blank: () => ({ name: '', price: 0, ml: 750, oz: 0 }),
      defaults: () => ({
        rows: [
          { name: 'Tequila', price: 30, ml: 750, oz: 2 },
          { name: 'Orange liqueur', price: 32, ml: 750, oz: 0.75 },
        ],
        target: 20, price: 14, extra: 0.4,
      }),
    },
  };

  const recipeTool = (key, cfg) => {
    const panel = document.getElementById(key);
    if (!panel) return;
    const $ = (id) => document.getElementById(key + '-' + id);
    const list = $('rows');
    const tpl = document.getElementById(key + '-row');
    const add = $('add');
    const target = $('target');
    const price = $('price');
    const extra = $('extra'); // cocktail only: mixers, garnish and ice as one flat cost
    const out = panel.querySelector('.calc-out');
    let state = cfg.defaults();
    let summaryTimer = 0;
    let result = {};

    const labelRow = (li, i) => {
      li.dataset.i = String(i);
      const n = 'Ingredient ' + (i + 1);
      li.querySelectorAll('[data-k]').forEach((el) => el.setAttribute('aria-label', n + ' ' + cfg.fields[el.dataset.k]));
      li.querySelector('.row-del').setAttribute('aria-label', 'Remove ' + (state.rows[i].name || n.toLowerCase()));
    };

    const render = () => {
      list.replaceChildren();
      state.rows.forEach((r, i) => {
        const li = tpl.content.firstElementChild.cloneNode(true);
        li.querySelectorAll('[data-k]').forEach((el) => {
          const v = r[el.dataset.k];
          const k = el.dataset.k;
          el.value = k === 'name' || k === 'ml' ? String(v) : k === 'oz' ? plain(v) : money2(v);
        });
        labelRow(li, i);
        list.append(li);
      });
      add.disabled = state.rows.length >= MAX_ROWS;
      $('add-note').textContent = state.rows.length >= MAX_ROWS ? 'That is the maximum of ' + MAX_ROWS + ' ingredients.' : '';
      $('empty').hidden = state.rows.length > 0;
    };

    const update = () => {
      state.target = +target.value;
      state.price = C.parseAmount(price.value, MAX_PRICE);
      if (extra) state.extra = C.parseAmount(extra.value, MAX_EXTRA);

      $('target-out').textContent = target.value + '%';
      target.setAttribute('aria-valuetext', target.value + '% ' + cfg.costWord);
      target.style.setProperty('--fill', ((target.value - target.min) / (target.max - target.min)) * 100 + '%');

      list.querySelectorAll('.row').forEach((li) => {
        const o = li.querySelector('.r-out');
        if (o) o.textContent = C.usd2(cfg.rowCost(state.rows[+li.dataset.i]));
      });

      const cost = state.rows.reduce((sum, r) => sum + cfg.rowCost(r), 0) + (state.extra || 0);
      const suggested = C.priceAtTarget(cost, state.target);
      const at = state.price || suggested;
      const pct = state.price ? C.costPct(cost, state.price) : 0;
      const band = state.price ? C.vsTarget(pct, state.target) : null;
      result = { cost, suggested, pct, band, profit: at - cost };

      $('out-price').textContent = C.usd2(suggested);
      $('out-target').textContent = 'at ' + state.target + '% ' + cfg.costWord;
      $('out-cost').textContent = C.usd2(cost);
      $('out-pct').textContent = state.price ? C.pct1(pct) : 'Add your price';
      $('out-profit').textContent = C.usd2(Math.max(0, at - cost));
      $('profit-at').textContent = state.price ? 'at your price' : 'at the suggested price';
      const chip = $('band');
      chip.hidden = !band;
      if (band) chip.textContent = band.label;
      out.setAttribute('data-band', band ? band.key : 'none');
      document.dispatchEvent(new CustomEvent('tmhs:calc', { detail: { tool: key } }));

      clearTimeout(summaryTimer);
      summaryTimer = setTimeout(() => {
        let s = 'Cost per ' + cfg.item + ' is ' + C.usd2(cost) + '. At a ' + state.target + '% ' + cfg.costWord + ' target, price it at about ' + C.usd2(suggested) + '.';
        if (band) s += ' At your ' + C.usd2(state.price) + ' price, ' + cfg.costWord + ' is ' + C.pct1(pct) + ', ' + band.label.toLowerCase() + '.';
        $('summary').textContent = s;
      }, 450);
    };

    // Typing updates the numbers in place, so focus and caret are never disturbed
    list.addEventListener('input', (e) => {
      const el = e.target.closest('[data-k]');
      if (!el) return;
      const li = el.closest('.row');
      const r = state.rows[+li.dataset.i];
      const k = el.dataset.k;
      if (k === 'name') { r.name = cleanName(el.value); labelRow(li, +li.dataset.i); }
      else if (k === 'ml') r.ml = +el.value;
      else r[k] = C.parseAmount(el.value, cfg.max[k]);
      update();
    });
    // Once the visitor leaves a field, show the amount exactly as it is used: tidied to cents
    // (ounces as typed), with a decimal comma read as a point and anything over the cap clamped
    const capFor = (el) => (el === price ? MAX_PRICE : el === extra ? MAX_EXTRA : cfg.max[el.dataset.k]);
    panel.addEventListener('focusout', (e) => {
      const el = e.target;
      if (!el.matches('[inputmode="decimal"]') || !el.value.trim()) return;
      const v = C.parseAmount(el.value, capFor(el));
      el.value = el.dataset.k === 'oz' ? plain(v) : money2(v);
    });
    list.addEventListener('click', (e) => {
      const del = e.target.closest('.row-del');
      if (!del) return;
      const i = +del.closest('.row').dataset.i;
      state.rows.splice(i, 1);
      render();
      update();
      // keep keyboard focus nearby: the next row's remove button, else the add button
      const next = list.querySelectorAll('.row-del')[Math.min(i, state.rows.length - 1)];
      (next || add).focus();
    });
    add.addEventListener('click', () => {
      if (state.rows.length >= MAX_ROWS) return;
      state.rows.push(cfg.blank());
      render();
      update();
      list.lastElementChild.classList.add('is-new');
      list.lastElementChild.querySelector('[data-k="name"]').focus();
    });
    [target, price, extra].forEach((el) => el && el.addEventListener('input', update));

    const apply = (s) => {
      if (Array.isArray(s.rows)) state.rows = s.rows.slice(0, MAX_ROWS);
      if (s.target != null) target.value = String(Math.min(+target.max, Math.max(+target.min, Math.round(s.target) || +target.value)));
      if (s.price != null) price.value = money2(s.price);
      if (extra && s.extra != null) extra.value = money2(s.extra);
      render();
      update();
    };
    $('reset').addEventListener('click', () => apply(cfg.defaults()));

    window.TMHSTools.tools[key] = {
      label: cfg.label,
      // The figures in use, for saving a dish to the menu (js/calc-menu.js)
      snapshot: () => ({ cost: result.cost, suggested: result.suggested, price: state.price, target: state.target }),
      get: () => ({
        rows: state.rows.map((r) => cfg.toParts(r).join('_')).join('*'),
        target: state.target, price: state.price || '', ...(extra ? { extra: state.extra || '' } : {}),
      }),
      set: (s) => apply({
        rows: typeof s.rows === 'string' && s.rows ? s.rows.split('*').map((p) => cfg.fromParts(p.split('_'), cfg.max)) : undefined,
        target: s.target != null ? C.parseAmount(s.target, 100) : undefined,
        price: s.price != null ? C.parseAmount(s.price, MAX_PRICE) : undefined,
        extra: s.extra != null ? C.parseAmount(s.extra, MAX_EXTRA) : undefined,
      }),
      summary: () => {
        const lines = state.rows.filter((r) => r.name || cfg.rowCost(r)).map((r) => '- ' + (r.name || 'Ingredient') + ': ' + C.usd2(cfg.rowCost(r)));
        if (state.extra) lines.push('- Mixers and garnish: ' + C.usd2(state.extra));
        lines.push('Cost per ' + cfg.item + ': ' + C.usd2(result.cost) + ', target ' + cfg.costWord + ' ' + state.target + '%, suggested price ' + C.usd2(result.suggested));
        if (result.band) lines.push('My price ' + C.usd2(state.price) + ' puts ' + cfg.costWord + ' at ' + C.pct1(result.pct));
        return lines;
      },
    };

    apply(state);
  };

  Object.entries(CONFIGS).forEach(([key, cfg]) => recipeTool(key, cfg));
})();

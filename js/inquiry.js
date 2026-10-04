'use strict';

// Set to a real address to turn the contact buttons into email links.
// While empty, the page points visitors to LinkedIn instead.
const CONTACT_EMAIL = '';

// Inquiry builder: composes a message from a few choices (and, optionally, the toolkit's numbers)
// for the visitor to copy or email. Nothing is sent from the page itself.
(() => {
  const box = document.getElementById('composer');
  const cta = document.getElementById('email-cta');

  if (CONTACT_EMAIL && cta) {
    cta.href = `mailto:${CONTACT_EMAIL}?subject=Hospitality%20strategy%20inquiry`;
    cta.removeAttribute('target');
    cta.removeAttribute('rel');
    cta.firstChild.textContent = 'Email me ';
  }
  if (!box) return;

  const $ = (id) => document.getElementById(id);
  const topics = [...box.querySelectorAll('.topics input')];
  const venue = $('inq-venue');
  const note = $('inq-note');
  const include = $('inq-calc');
  const preview = $('inq-preview');
  const copy = $('inq-copy');
  const email = $('inq-email');
  const status = $('inq-status');
  const hint = $('inq-hint');
  const registry = window.TMHSTools;

  const joinList = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  const compose = () => {
    const chosen = topics.filter((t) => t.checked).map((t) => t.value);
    const kind = venue.value;
    const lines = ['Hi TM Hospitality Strategies,', ''];
    let intro = kind ? 'I run ' + (/^[aeiou]/i.test(kind) ? 'an ' : 'a ') + kind.toLowerCase() : 'I run a hospitality business';
    intro += chosen.length ? ' and would like help with ' + joinList(chosen) + '.' : ' and would like to talk about where you could help.';
    lines.push(intro);
    if (note.value.trim()) lines.push('', note.value.trim());
    const tool = registry && registry.tools[registry.active];
    if (include.checked && tool) {
      lines.push('', 'My numbers from your ' + tool.label + ' calculator:', ...tool.summary());
      if (registry.shareUrl) lines.push('Link: ' + registry.shareUrl());
    }
    lines.push('', 'Thanks,');
    return lines.join('\n');
  };

  const refresh = () => {
    const text = compose();
    preview.textContent = text;
    if (email) email.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Hospitality strategy inquiry')}&body=${encodeURIComponent(text)}`;
  };

  if (CONTACT_EMAIL && email) {
    email.hidden = false;
    hint.textContent = 'Email it straight from your mail app, or copy it to send another way.';
  }

  box.addEventListener('input', refresh);
  box.addEventListener('change', refresh);
  document.addEventListener('tmhs:calc', () => { if (include.checked) refresh(); });

  let statusTimer = 0;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(compose());
      status.textContent = CONTACT_EMAIL ? 'Message copied.' : 'Message copied. Paste it into a LinkedIn message.';
    } catch (e) {
      // Clipboard blocked: select the preview so it can be copied by hand
      const range = document.createRange();
      range.selectNodeContents(preview);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      status.textContent = 'Press Ctrl+C (or Command+C) to copy the selected message.';
    }
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 8000);
  });

  // "Talk through these numbers" in the toolkit brings its results into the message
  const talk = $('talk-numbers');
  if (talk) {
    talk.addEventListener('click', () => {
      include.checked = true;
      refresh();
      // after the jump to #contact, put keyboard focus in the builder
      setTimeout(() => box.focus({ preventScroll: true }), 0);
    });
  }

  refresh();
})();

'use strict';

/**
 * Minimal inline rich text for short branding strings (e.g. the attribution line).
 * Output contains only <b>, <i>, <u> without attributes; text is HTML-escaped; one line.
 */
const ALLOWED = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u' };
const DROP_CONTENT = new Set(['script', 'style', 'template', 'noscript']);
const BLOCK = new Set(['br', 'div', 'p', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };

const decode = (s) => s.replace(/&(amp|lt|gt|quot|apos|#39|nbsp);/g, (_, e) => ENTITIES[e]);
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sanitizeInline(input, maxText = 120) {
  const html = String(input ?? '');
  const tokens = html.split(/(<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>)/);
  const out = [];
  const stack = [];
  let dropping = null;
  let length = 0;

  for (const token of tokens) {
    const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(token);
    if (!tag) {
      if (dropping || !token) continue;
      let text = decode(token).replace(/\s+/g, ' ');
      if (length + text.length > maxText) text = text.slice(0, maxText - length);
      length += text.length;
      if (text) out.push({ text });
      continue;
    }
    const [, closing, rawName] = tag;
    const name = rawName.toLowerCase();
    if (DROP_CONTENT.has(name)) { dropping = closing ? null : name; continue; }
    if (dropping) continue;
    if (BLOCK.has(name)) { out.push({ text: ' ' }); continue; }
    const mapped = ALLOWED[name];
    if (!mapped) continue;
    if (!closing) {
      stack.push(mapped);
      out.push({ open: mapped });
    } else if (stack.includes(mapped)) {
      // Close inner tags first so the output stays well-formed.
      while (stack.length) {
        const top = stack.pop();
        out.push({ close: top });
        if (top === mapped) break;
      }
    }
  }
  while (stack.length) out.push({ close: stack.pop() });

  let result = out.map((p) => (p.text !== undefined ? escape(p.text) : p.open ? `<${p.open}>` : `</${p.close}>`)).join('');
  // Remove empty/whitespace-only pairs (repeat for nesting), then normalise spacing.
  let prev;
  do { prev = result; result = result.replace(/<(b|i|u)>(\s*)<\/\1>/g, '$2'); } while (result !== prev);
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/^(<(?:b|i|u)>)+\s+/, (m) => m.replace(/\s+/g, '')).replace(/\s+((<\/(?:b|i|u)>)+)$/, '$1');
  return inlineText(result).trim() ? result : '';
}

/** Visible text of a sanitised inline string. */
function inlineText(html) {
  return decode(String(html ?? '').replace(/<[^>]*>/g, ''));
}

module.exports = { sanitizeInline, inlineText };

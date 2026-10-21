'use strict';

const { sanitizeInline, inlineText } = require('../services/richtext');

describe('sanitizeInline (attribution rich text)', () => {
  it('keeps bold, italic and underline, normalising strong/em', () => {
    expect(sanitizeInline('<strong>NexFinance</strong> oleh <em>Nexora</em> <u>Tech</u>'))
      .toBe('<b>NexFinance</b> oleh <i>Nexora</i> <u>Tech</u>');
  });

  it('drops other tags, attributes and script/style content', () => {
    expect(sanitizeInline('<span style="color:red" onclick="x()">Hai</span><script>alert(1)</script><style>b{}</style> <a href="javascript:x">link</a>'))
      .toBe('Hai link');
    expect(sanitizeInline('<b onmouseover="x()">Tebal</b>')).toBe('<b>Tebal</b>');
  });

  it('escapes text and decodes harmless entities once', () => {
    expect(sanitizeInline('A &amp; B &lt;img src=x onerror=1&gt;&nbsp;C')).toBe('A &amp; B &lt;img src=x onerror=1&gt; C');
    expect(sanitizeInline('1 < 2 > 0 "ok"')).toBe('1 &lt; 2 &gt; 0 "ok"');
  });

  it('balances tags, removes empty ones and keeps a single line', () => {
    expect(sanitizeInline('<b>tebal <i>miring</b> sisa')).toBe('<b>tebal <i>miring</i></b> sisa');
    expect(sanitizeInline('<div>Baris 1</div><div>Baris 2<br></div><b></b>')).toBe('Baris 1 Baris 2');
    expect(sanitizeInline('  banyak    spasi  ')).toBe('banyak spasi');
  });

  it('caps the visible text length without breaking markup', () => {
    const out = sanitizeInline(`<b>${'x'.repeat(200)}</b>`, 120);
    expect(out).toBe(`<b>${'x'.repeat(120)}</b>`);
    expect(inlineText(out)).toHaveLength(120);
  });

  it('returns an empty string for nothing visible', () => {
    expect(sanitizeInline('<b> </b><br>')).toBe('');
    expect(sanitizeInline(null)).toBe('');
  });
});

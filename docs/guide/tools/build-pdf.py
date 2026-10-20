import markdown, re, sys, base64, pathlib
G = pathlib.Path(sys.argv[1]); SP = pathlib.Path(sys.argv[2])
md = (G / 'PANDUAN_E2E_AL_MUSABBIHIN.md').read_text()
# Drop the markdown title block + TOC: the PDF gets its own cover and TOC.
body_md = md.split('## 1. Ringkasan', 1)[1]
body_md = '## 1. Ringkasan' + body_md
# Tenant-shareable PDF: drop internal (technical / Nexora-only) blocks; the Markdown keeps them.
body_md = re.sub(r'<!-- internal -->.*?<!-- /internal -->', '', body_md, flags=re.S)
html = markdown.markdown(body_md, extensions=['tables', 'toc', 'sane_lists', 'attr_list'])
# Wrap images as figures with captions.
from PIL import Image as _I
def _fig(m):
    alt, src = m.group(1), m.group(2)
    w, h = _I.open(G / src).size
    cls = 'tall' if h / w > 1.15 else ('phone' if w < 700 else 'wide')
    return f'<figure class="{cls}"><img src="{src}" alt="{alt}"><figcaption>{alt}</figcaption></figure>'
html = re.sub(r'<p><img alt="([^"]*)" src="([^"]+)" ?/?></p>', _fig, html)
html = html.replace('[ ]', '<span class="box"></span>')
# Renumber chapters after internal ones were removed (Markdown keeps its own numbering).
_n = [0]
def _renum(m):
    _n[0] += 1
    return f'<h2 id="{m.group(1)}">{_n[0]}. {m.group(2)}</h2>'
html = re.sub(r'<h2 id="([^"]+)">\d+\.\s*([^<]+)</h2>', _renum, html)
toc = ''.join(f'<li><a href="#{a}">{t}</a></li>' for a, t in re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>', html))
def b64(p): return 'data:image/png;base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
logo_school = b64(str(G.parent / 'tenants/al-musabbihin/logo.png'))
logo_nf = b64(str(G.parent.parent / 'frontend-next/public/brand/nexfinance-mark.png'))
logo_nx = b64(str(G.parent.parent / 'frontend-next/public/brand/nexora-logo.png'))
doc = f'''<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Panduan E2E NexFinance Tenant — SIT Al Musabbihin</title>
<style>
@page {{ size: A4; margin: 18mm 15mm 18mm 15mm; }}

:root {{ --brand:#196fb0; --brand2:#5ebd69; --ink:#0f1f33; --muted:#5b6b80; --line:#dbe3ee; --soft:#f3f7fb; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, 'DejaVu Sans', sans-serif; color: var(--ink); font-size: 10.2pt; line-height: 1.55; margin: 0; }}
.cover {{ height: 297mm; width: 210mm; position: relative; background: linear-gradient(160deg,#0f2a44 0%,#153147 55%,#196fb0 100%); color: #fff; padding: 26mm 22mm; page-break-after: always; overflow: hidden; }}
.cover:after {{ content:''; position:absolute; right:-60mm; bottom:-60mm; width:170mm; height:170mm; border-radius:50%; background: radial-gradient(circle, rgba(94,189,105,.35), rgba(94,189,105,0) 70%); }}
.cover .logos {{ display:flex; gap:14px; align-items:center; }}
.cover .logos img {{ height: 64px; background:#fff; border-radius:14px; padding:8px; }}
.cover .kicker {{ margin-top: 46mm; letter-spacing:.18em; text-transform:uppercase; font-size:10pt; color:#a8d8ff; font-weight:700; }}
.cover h1 {{ font-size: 34pt; line-height:1.1; margin: 6mm 0 4mm; font-weight:800; }}
.cover .sub {{ font-size: 14pt; color:#d8e8f6; max-width: 150mm; }}
.cover .meta {{ position:absolute; bottom: 26mm; left:22mm; right:22mm; display:grid; grid-template-columns: repeat(3,1fr); gap:10px; font-size:9pt; z-index:1; }}
.cover .meta div {{ background: rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:10px 12px; }}
.cover .meta b {{ display:block; color:#a8d8ff; font-size:7.5pt; letter-spacing:.12em; text-transform:uppercase; margin-bottom:3px; }}
.cover .powered {{ position:absolute; top:26mm; right:22mm; display:flex; align-items:center; gap:8px; font-size:8.5pt; color:#d8e8f6; z-index:1; }}
.cover .powered img {{ height: 24px; background:#fff; border-radius:6px; padding:3px 6px; }}
.toc {{ page-break-after: always; }}
.toc h2 {{ border:0; }}
.toc ul {{ font-size: 11.5pt; line-height: 2.1; }}
.toc a {{ color: var(--ink); text-decoration: none; }}
.toc .note {{ background: var(--soft); border-left: 4px solid var(--brand); padding: 10px 14px; border-radius: 8px; color: var(--muted); }}
h2 {{ font-size: 17pt; color: var(--brand); border-bottom: 3px solid var(--brand2); padding-bottom: 4px; margin: 0 0 10px; page-break-before: always; }}
h3 {{ font-size: 12.5pt; margin: 16px 0 6px; color: #11365a; page-break-after: avoid; }}
p, li {{ orphans: 3; widows: 3; }}
code {{ overflow-wrap: anywhere; word-break: break-word; font-family: 'DejaVu Sans Mono', monospace; font-size: 8.6pt; background: #eef3f9; padding: 1px 5px; border-radius: 4px; color: #0b4a80; }}
table {{ width: 100%; table-layout: fixed; border-collapse: collapse; margin: 8px 0 12px; font-size: 9pt; page-break-inside: auto; }}
th {{ background: #153147; color: #fff; text-align: left; padding: 6px 8px; font-weight: 600; }}
td {{ overflow-wrap: anywhere; border-bottom: 1px solid var(--line); padding: 5px 8px; vertical-align: top; }}
tr:nth-child(even) td {{ background: #f7f9fc; }}
tr {{ page-break-inside: avoid; }}
blockquote {{ margin: 10px 0; background: #fff8e6; border-left: 4px solid #f5b70a; padding: 8px 12px; border-radius: 6px; color: #5c4400; }}
blockquote p {{ margin: 0; }}
figure {{ margin: 10px 0 14px; page-break-inside: avoid; text-align: center; }}
figure img {{ max-width: 100%; max-height: 112mm; }}
figure.tall img {{ max-height: 228mm; }}
figure.phone img {{ max-height: 150mm; }}
td img {{ max-height: 140mm; }}
td img {{ max-width: 100%; }}
figcaption {{ font-size: 8.4pt; color: var(--muted); margin-top: 2px; }}
.box {{ display:inline-block; width:10px; height:10px; border:1.5px solid var(--brand); border-radius:2px; margin-right:6px; vertical-align:-1px; }}
ul li {{ margin: 2px 0; }}
hr {{ display: none; }}
a {{ color: var(--brand); }}
</style></head><body>
<section class="cover">
  <div class="logos"><img src="{logo_school}" alt="Logo SIT Al Musabbihin"><img src="{logo_nf}" alt="NexFinance"></div>
  <div class="powered">Produk dari <img src="{logo_nx}" alt="Nexora"></div>
  <div class="kicker">Panduan end-to-end &amp; user manual</div>
  <h1>NexFinance Tenant</h1>
  <div class="sub">Dari setup tenant di Console sampai sekolah beroperasi penuh — studi kasus <b>SIT Al Musabbihin</b>, untuk semua peran: Operator Nexora, Super Admin, Bendahara, Kepala Bagian, Staf, dan Auditor.</div>
  <div class="meta">
    <div><b>Tenant contoh</b>almusabbihin-nexfinance.nexoratech.co</div>
    <div><b>Disiapkan oleh</b>Tim Nexora · nexoratech.co</div>
    <div><b>Versi</b>1.2 · 20 Oktober 2026</div>
  </div>
</section>
<section class="toc"><h2 style="page-break-before:avoid">Daftar isi</h2><ul style="list-style:none;padding-left:0">{toc}</ul>
<p class="note">Semua screenshot diambil langsung dari aplikasi NexFinance dengan contoh data SIT Al Musabbihin. Alamat yang tampil di bilah browser adalah alamat yang Anda pakai sehari-hari; angka-angka di dalamnya adalah hasil transaksi contoh.</p></section>
{html}
</body></html>'''
# Leak guard: the PDF goes to schools, so it must not carry infrastructure or code details.
FORBIDDEN = [r'postgre', r'\bschema', r't_al_', r'saas_', r'onboard_tenants', r'\bdeploy', r'\bserver', r'\bssh\b',
             r'database', r'/api/', r'\bapi\b', r'docs/', r'playwright', r'\bsecret', r'\brunner', r'\bdns\b', r'\bvps\b',
             r'github', r'\benv\b', r'variabel', r'traefik', r'docker', r'\brepo\b', r'\bbuild\b', r'\btoken', r'migrat',
             r'\bendpoint', r'frontend', r'backend', r'\bfield\b', r'\bstaging']
_text = re.sub(r'<[^>]+>', ' ', re.sub(r'<style>.*?</style>|<img[^>]*>', ' ', doc, flags=re.S))
_leaks = sorted({m.group(0) for pat in FORBIDDEN for m in re.finditer(pat, _text, flags=re.I)})
if _leaks:
    for pat in FORBIDDEN:
        for m in re.finditer(pat, _text, flags=re.I):
            print('LEAK', repr(m.group(0)), '…' + _text[max(0, m.start() - 60):m.end() + 40].replace('\n', ' ') + '…')
    sys.exit(f'Tenant PDF would expose technical terms: {_leaks} — wrap them in <!-- internal --> blocks.')
head, rest = doc.split('<section class="cover">', 1)
cover, body = rest.split('</section>', 1)
(G / '_print_cover.html').write_text(head.replace('@page {{','@page {{').replace('@page { size: A4; margin: 18mm 15mm 18mm 15mm; }','@page { size: A4; margin: 0; }') + '<section class="cover">' + cover + '</section></body></html>')
(G / '_print.html').write_text(head + body)
print('ok', len(doc))

#!/bin/sh
set -e
SP="${SP:-/tmp/nexfin-docs}"
TOOLS="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$TOOLS/../../.." && pwd)"
mkdir -p "$SP/logs"
for pid in $(pgrep -x node); do tr '\0' ' ' < /proc/$pid/cmdline | grep -q "src/index.js" && kill $pid; done
sleep 1
psql -h 127.0.0.1 -p 55432 -U postgres -qc "drop database if exists nexfin_docs" -c "create database nexfin_docs"
cd "$REPO/backend"
DATABASE_URL=postgres://postgres@127.0.0.1:55432/nexfin_docs JWT_SECRET=docs-secret PORT=5080 CONSOLE_HOSTS=console-nexfinance.nexoratech.co TENANT_BASE_DOMAIN='{label}-nexfinance.nexoratech.co' CONSOLE_ADMIN_EMAIL=ops@nexoratech.co CONSOLE_ADMIN_NAME="Nexora Ops" CONSOLE_ADMIN_PASSWORD=Console-Docs-2026 LOGIN_RATE_LIMIT_MAX=1000 nohup node src/index.js > $SP/logs/be.log 2>&1 &
sleep 5
cd "$TOOLS"; mkdir -p "$SP/shots"; export OUT="$SP/shots"
node p1-console.js; node p1b-detail.js
sh reset.sh > "$SP/shots/.temp-pass"
node p2-admin.js; node p3a-admin-setup.js; node p3b-bendahara.js; node p3c-flow.js
node p1c-detail-reshoot.js
pdftoppm -png -r 80 -f 1 -l 2 "$SP/shots/laporan.pdf" "$SP/shots/47-report-pdf"
pdftoppm -png -r 80 -f 6 -l 7 "$SP/shots/laporan.pdf" "$SP/shots/47-report-pdf"  # notes (CALK A–G)
python3 frame.py "$SP" "$REPO/docs/guide/img"
python3 - "$REPO/docs/guide/img" <<'PY'
import glob, os, sys
from PIL import Image
for f in glob.glob(sys.argv[1] + '/*.png'):
    im = Image.open(f).convert('RGBA'); bg = Image.new('RGB', im.size, 'white'); bg.paste(im, mask=im.split()[3])
    bg.save(f[:-4] + '.jpg', quality=85, optimize=True, progressive=True); os.remove(f)
PY
python3 build-pdf.py "$REPO/docs/guide" "$SP"
node print-pdf.js "$REPO/docs/guide/_print_cover.html" "$SP/cover.pdf" plain
node print-pdf.js "$REPO/docs/guide/_print.html" "$SP/body.pdf"
pdfunite "$SP/cover.pdf" "$SP/body.pdf" "$REPO/docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.pdf"
mv "$REPO/docs/guide/_print.html" "$REPO/docs/guide/_print_cover.html" "$SP/"
# School edition (shared with the school itself): no Console / operator content.
python3 build-pdf.py "$REPO/docs/guide" "$SP" school
node print-pdf.js "$REPO/docs/guide/_print_cover.html" "$SP/cover-s.pdf" plain
node print-pdf.js "$REPO/docs/guide/_print.html" "$SP/body-s.pdf"
pdfunite "$SP/cover-s.pdf" "$SP/body-s.pdf" "$REPO/docs/guide/PANDUAN_PENGGUNA_SIT_AL_MUSABBIHIN.pdf"
mv "$REPO/docs/guide/_print.html" "$REPO/docs/guide/_print_cover.html" "$SP/"
echo "✅ docs/guide regenerated"

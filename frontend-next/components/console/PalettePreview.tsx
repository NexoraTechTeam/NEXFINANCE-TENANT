import type { Palette } from '@/lib/theme';

/** Static mock-up of the tenant UI rendered with raw palette values (no global CSS vars). */
export default function PalettePreview({ palette, schoolName, logoSrc }: { palette: Palette; schoolName: string; logoSrc?: string | null }) {
  const swatches: Array<[string, string]> = [
    ['Primer', palette.primary], ['Sekunder', palette.secondary], ['Aksen', palette.accent], ['Sidebar', palette.sidebar],
  ];
  return (
    <figure aria-label="Pratinjau tema" style={{ margin: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', minHeight: 180 }}>
        <div data-testid="preview-sidebar" style={{ backgroundColor: palette.sidebar, padding: 12, display: 'grid', gap: 8, alignContent: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {logoSrc
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              ? <img src={logoSrc} alt="" width={22} height={22} style={{ background: '#fff', borderRadius: 6, padding: 2, objectFit: 'contain' }} />
              : <span style={{ width: 22, height: 22, borderRadius: 6, background: palette.brand['500'] }} />}
            <span style={{ height: 6, flex: 1, borderRadius: 4, background: 'rgba(255,255,255,0.5)' }} />
          </div>
          <span style={{ height: 22, borderRadius: 6, background: `${palette.brand['500']}55`, boxShadow: `inset 3px 0 0 ${palette.accent}` }} />
          {[0, 1, 2].map((i) => <span key={i} style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.18)' }} />)}
        </div>
        <div style={{ background: '#f6f8fb', padding: 14, display: 'grid', gap: 10, alignContent: 'start' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f1b2d' }}>{schoolName || 'Nama sekolah'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[palette.brand['500'], palette.secondary, palette.accent].map((c) => (
              <div key={c} style={{ background: '#fff', borderRadius: 8, padding: 8, borderTop: `3px solid ${c}` }}>
                <span style={{ display: 'block', height: 6, width: '60%', borderRadius: 3, background: palette.brand['100'] }} />
                <span style={{ display: 'block', height: 10, width: '80%', marginTop: 6, borderRadius: 3, background: c }} />
              </div>
            ))}
          </div>
          <button
            type="button"
            data-testid="preview-button"
            tabIndex={-1}
            style={{ justifySelf: 'start', backgroundColor: palette.brand['500'], color: '#fff', border: 0, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
          >
            Buat Invoice
          </button>
        </div>
      </div>
      <figcaption style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        {swatches.map(([label, hex]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
            {label} <code>{hex}</code>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

import { formatAmount, type StatementRow } from '@/lib/isak335';

const STYLES: Record<StatementRow['kind'], React.CSSProperties> = {
  section: { fontSize: 11.5, fontWeight: 800, color: 'var(--brand-600)', textTransform: 'uppercase', letterSpacing: '.6px', paddingTop: 14 },
  line: { fontSize: 14, color: 'var(--text-2)' },
  subtotal: { fontSize: 14, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--border)' },
  total: { fontSize: 15, fontWeight: 800, color: 'var(--text)', borderTop: '2px solid var(--text)', borderBottom: '3px double var(--text)' },
};

/** One ISAK 335 statement as a two-column table (description, amount). */
export default function StatementTable({ title, subtitle, rows }: { title: string; subtitle?: string; rows: StatementRow[] }) {
  return (
    <section className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }} aria-label={title}>
      <h2 className="isak-section-header" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-4)', margin: '4px 0 10px' }}>{subtitle}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.label}-${i}`}>
              <td style={{ padding: '7px 4px', paddingLeft: r.kind === 'line' ? 18 : 4, ...STYLES[r.kind] }}>{r.label}</td>
              <td style={{ padding: '7px 4px', textAlign: 'right', whiteSpace: 'nowrap', ...STYLES[r.kind], color: (r.amount ?? 0) < 0 ? '#b91c1c' : STYLES[r.kind].color }}>
                {r.amount === undefined ? '' : formatAmount(r.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

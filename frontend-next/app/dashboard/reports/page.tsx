'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, TrendingUp, BarChart2, Download, ExternalLink, Layers, Wallet, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { accountingService } from '@/lib/api';
import { useTenant } from '@/components/tenant/TenantProvider';
import { downloadFinancialReportPdf } from '@/lib/report-pdf';
import { axisMoney, shortMoney, toMonthlyRows, type LedgerMonth } from '@/lib/financials';
import { ACTIVITY_LABELS, CLASS_LABELS, buildStatements, formatAmount, type Isak335Package } from '@/lib/isak335';
import StatementTable from '@/components/reports/StatementTable';

const TABS = [
  { value: 'position', label: 'Posisi Keuangan', icon: BarChart2 },
  { value: 'income', label: 'Penghasilan Komprehensif', icon: FileText },
  { value: 'netassets', label: 'Perubahan Aset Neto', icon: Layers },
  { value: 'cashflow', label: 'Arus Kas', icon: Wallet },
  { value: 'notes', label: 'Catatan (CALK)', icon: BookOpen },
  { value: 'trend', label: 'Tren Bulanan', icon: TrendingUp },
] as const;
type Tab = (typeof TABS)[number]['value'];

const STANDARD = 'ISAK 335 (d/h ISAK 35)';
const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

interface ChartTooltipEntry { color?: string; name?: string; value?: number }
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: ChartTooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: p.color }}>{p.name}</span>
          <span className="chart-tooltip-value">{shortMoney(p.value || 0)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const tenant = useTenant();
  const { palette } = tenant;
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [tab, setTab] = useState<Tab>('position');
  const [pkg, setPkg] = useState<Isak335Package | null>(null);
  const [months, setMonths] = useState<LedgerMonth[] | undefined>(undefined);
  const [loadError, setLoadError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    Promise.all([accountingService.getIsak335(year), accountingService.getMonthly(year)])
      .then(([isakRes, monthlyRes]) => {
        if (cancelled) return;
        setPkg(isakRes.data || null);
        setMonths(monthlyRes.data?.months);
      })
      .catch(() => { if (!cancelled) { setPkg(null); setLoadError('Laporan belum dapat dimuat. Coba muat ulang halaman.'); } });
    return () => { cancelled = true; };
  }, [year]);

  const statements = useMemo(() => (pkg ? buildStatements(pkg) : []), [pkg]);
  const monthly = toMonthlyRows(months, { year });
  const standard = pkg?.standard || STANDARD;
  const fp = pkg?.financialPosition;
  const endDate = pkg ? (year === thisYear ? new Date().toISOString().slice(0, 10) : pkg.period.end) : '';
  const subtitles: Record<string, string> = pkg ? {
    position: `Per ${longDate(endDate)}`,
    income: `Untuk tahun yang berakhir ${longDate(pkg.period.end)}`,
    netassets: `Untuk tahun yang berakhir ${longDate(pkg.period.end)}`,
    cashflow: `Untuk tahun yang berakhir ${longDate(pkg.period.end)} — metode langsung`,
  } : {};
  const activeLabel = TABS.find((t) => t.value === tab)?.label || 'Laporan';
  const snapshot = [
    { label: 'Total aset', value: fp?.totals.assets ?? 0, color: '#10B981' },
    { label: 'Total liabilitas', value: fp?.totals.liabilities ?? 0, color: '#EF4444' },
    { label: 'Aset neto tanpa pembatasan', value: fp?.netAssets.unrestricted ?? 0, color: 'var(--brand-500)' },
    { label: 'Aset neto dengan pembatasan', value: fp?.netAssets.restricted ?? 0, color: 'var(--brand-700)' },
  ];

  const handleDownloadPdf = async () => {
    if (!pkg) return;
    setDownloadingPdf(true);
    setExportError('');
    try {
      await downloadFinancialReportPdf({
        year,
        schoolName: tenant.name,
        reportName: 'Laporan Keuangan',
        colors: { navy: palette.sidebar, primary: palette.brand['500'], secondary: palette.secondary },
        fileSlug: tenant.slug,
        activeTabLabel: activeLabel,
        monthly,
        standard,
        framework: pkg.framework,
        statements: statements.map((s) => ({ ...s, subtitle: subtitles[s.key] })),
        notes: pkg.notes,
        summary: {
          revenue: pkg.comprehensiveIncome.unrestricted.totalRevenue + pkg.comprehensiveIncome.restricted.totalRevenue,
          expenses: pkg.comprehensiveIncome.unrestricted.totalExpenses,
          surplus: pkg.comprehensiveIncome.totalComprehensiveIncome,
          netAssets: pkg.financialPosition.totals.netAssets,
        },
      });
    } catch (error) {
      console.error(error);
      setExportError('PDF belum berhasil dibuat. Silakan coba lagi beberapa saat lagi.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const axisStyle = { fontSize: 13, fill: '#6b7280' };
  const statement = statements.find((s) => s.key === tab);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <style jsx global>{`
        @media (max-width: 768px) {
          .rpt-page-header { flex-direction: column !important; align-items: flex-start !important; }
          .rpt-export-row { width: 100% !important; flex-direction: column !important; }
          .rpt-export-row a, .rpt-export-row button, .rpt-export-row select { width: 100% !important; justify-content: center !important; }
          .rpt-tab-bar { overflow-x: auto !important; white-space: nowrap !important; scrollbar-width: none; }
          .rpt-tab-bar::-webkit-scrollbar { display: none; }
          .rpt-isak35-table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .rpt-isak35-table-wrapper table { min-width: 640px; }
        }
        .isak-section-header { border-left: 3px solid var(--brand-500); padding-left: 12px; }
        .rpt-action-btn { transition: opacity 160ms, transform 160ms; cursor: pointer; }
        .rpt-action-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div className="page-header rpt-page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Laporan Keuangan</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            {standard} · {pkg?.framework || 'SAK Entitas Privat'} · Tahun {year}
          </p>
        </div>
        <div className="rpt-export-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <label htmlFor="rpt-year" className="sr-only">Tahun laporan</label>
          <select id="rpt-year" className="form-input" style={{ width: 'auto', minHeight: 46 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[thisYear, thisYear - 1, thisYear - 2].map((y) => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
          <a href="/docs/nexfinance-export-guidance.pdf" target="_blank" rel="noreferrer" className="btn-secondary rpt-action-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ExternalLink size={16} strokeWidth={1.8} /> Panduan PDF
          </a>
          <button type="button" onClick={handleDownloadPdf} disabled={downloadingPdf || !pkg} className="btn-primary rpt-action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46 }}>
            <Download size={16} strokeWidth={1.8} /> {downloadingPdf ? 'Menyusun PDF...' : 'Unduh PDF'}
          </button>
        </div>
      </div>

      {(exportError || loadError) && (
        <div role="alert" style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#b91c1c', fontSize: 13 }}>
          {exportError || loadError}
        </div>
      )}

      <div className="card anim-fadeup" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="isak-section-header" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              Ringkasan posisi keuangan
            </div>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', maxWidth: 760 }}>
              Laporan entitas berorientasi nonlaba: aset neto disajikan dalam dua kelas — tanpa pembatasan dan dengan pembatasan dari pemberi sumber daya.
              Semua angka dihitung dari jurnal.
            </p>
          </div>
          <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}>{standard}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {snapshot.map((item) => (
            <div key={item.label} style={{ padding: 14, borderRadius: 14, background: '#fff', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', color: item.color, fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: 6, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800 }}>{formatAmount(item.value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar rpt-tab-bar" style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`tab-btn${tab === value ? ' tab-btn-active' : ''}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Icon size={16} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {statement && <div className="anim-fadeup"><StatementTable title={statement.title} subtitle={subtitles[statement.key]} rows={statement.rows} /></div>}

      {tab === 'notes' && pkg && (
        <section className="card anim-fadeup" style={{ padding: 'clamp(16px, 3vw, 24px)' }} aria-label="Catatan atas Laporan Keuangan">
          <h2 className="isak-section-header" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Catatan atas Laporan Keuangan</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', margin: '4px 0 12px' }}>
            Disusun otomatis dari pembukuan. Tinjau dan lengkapi oleh bendahara/akuntan sebelum diterbitkan.
          </p>
          {pkg.notes.map((note) => (
            <div key={note.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px' }}>{note.id}. {note.title}</h3>
              {note.paragraphs?.map((p) => <p key={p} style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 6px' }}>{p}</p>)}
              {note.rows && (note.rows.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Tidak ada saldo/transaksi pada periode ini.</p>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                    <tbody>
                      {note.rows.map((r) => (
                        <tr key={r.label}><td style={{ padding: '5px 0 5px 14px' }}>{r.label}</td><td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatAmount(r.amount)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ))}
            </div>
          ))}
        </section>
      )}

      {tab === 'trend' && (
        <div className="card anim-fadeup" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          <h2 className="isak-section-header" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Tren pendapatan &amp; beban bulanan {year}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Grafik pendukung untuk pimpinan; bukan bagian dari laporan keuangan ISAK 335.</p>
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} tickFormatter={axisMoney} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill={palette.brand['500']} radius={[5, 5, 0, 0]} />
                <Bar dataKey="beban" name="Beban" fill="#EF4444" radius={[5, 5, 0, 0]} />
                <Bar dataKey="surplus" name="Surplus" fill="#10B981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card anim-fadeup" style={{ padding: 20, marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="isak-section-header" style={{ fontSize: 16, fontWeight: 800 }}>Klasifikasi akun</div>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Kelas aset neto dan aktivitas arus kas tiap akun — dasar penyusunan laporan di atas.</p>
          </div>
          <span className="badge badge-neutral">{pkg?.accounts.length ?? 0} akun</span>
        </div>
        <div className="rpt-isak35-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Kode', 'Nama akun', 'Tipe', 'Pos laporan', 'Kelas aset neto', 'Aktivitas arus kas'].map((h) => (
                  <th key={h} style={{ padding: '11px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(pkg?.accounts ?? []).map((a, idx) => (
                <tr key={a.code} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-info">{a.code}</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 13.5 }}>{a.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13.5 }}>{a.type || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13.5 }}>{a.isak35 || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13.5 }}>{a.netAssetClass ? CLASS_LABELS[a.netAssetClass] : '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13.5 }}>{ACTIVITY_LABELS[a.activity]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

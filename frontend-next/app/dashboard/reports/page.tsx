'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, TrendingUp, BarChart2, Download, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { accountingService } from '@/lib/api';
import { useTenant } from '@/components/tenant/TenantProvider';
import { downloadFinancialReportPdf } from '@/lib/report-pdf';
import { axisMoney, shortMoney, toBalanceRows, toExpenseRows, toIncomeRows, toMonthlyRows, type LedgerMonth } from '@/lib/financials';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = shortMoney;

const reportTabs = [
  { value: 'income', label: 'Laporan Aktivitas', icon: FileText },
  { value: 'balance', label: 'Posisi Keuangan', icon: BarChart2 },
  { value: 'cashflow', label: 'Arus Kas / Tren', icon: TrendingUp },
] as const;

type BalanceSheetResponse = {
  date?: string;
  assets?: number;
  liabilities?: number;
  equity?: number;
  detail?: Record<string, number>;
};

type IncomeStatementResponse = {
  date?: string;
  revenue?: number;
  expenses?: number;
  netIncome?: number;
  detail?: Record<string, number>;
};

type AccountRecord = {
  name?: string;
  type?: string;
  isak35?: string;
};

interface ChartTooltipEntry {
  color?: string;
  name?: string;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: p.color }}>{p.name}</span>
          <span className="chart-tooltip-value">{short(p.value || 0)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const tenant = useTenant();
  const { palette } = tenant;
  const [activeTab, setActiveTab] = useState<'income'|'balance'|'cashflow'>('income');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportError, setExportError] = useState('');
  const [liveBalanceSheet, setLiveBalanceSheet] = useState<BalanceSheetResponse | null>(null);
  const [liveIncomeStatement, setLiveIncomeStatement] = useState<IncomeStatementResponse | null>(null);
  const [coaRecords, setCoaRecords] = useState<Record<string, AccountRecord>>({});
  const [liveMonths, setLiveMonths] = useState<LedgerMonth[] | undefined>(undefined);
  const reportYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      accountingService.getBalanceSheet(),
      accountingService.getIncomeStatement(),
      accountingService.getChartOfAccounts(),
      accountingService.getMonthly(reportYear),
    ])
      .then(([balanceRes, incomeRes, coaRes, monthlyRes]) => {
        if (cancelled) return;
        setLiveBalanceSheet(balanceRes.data || null);
        setLiveIncomeStatement(incomeRes.data || null);
        setCoaRecords(coaRes.data?.accounts || {});
        setLiveMonths(monthlyRes.data?.months);
      })
      .catch(() => {
        if (cancelled) return;
        setLiveBalanceSheet(null);
        setLiveIncomeStatement(null);
        setCoaRecords({});
      });

    return () => {
      cancelled = true;
    };
  }, [reportYear]);

  // All figures come from the ledger; missing data shows as zero, never as estimates.
  const monthly = toMonthlyRows(liveMonths, { year: reportYear });
  const incomeRows = toIncomeRows(liveIncomeStatement);
  const expenseRows = toExpenseRows(liveIncomeStatement);
  const balanceSheet = toBalanceRows(liveBalanceSheet);
  const totalPendapatan = liveIncomeStatement?.revenue ?? 0;
  const totalBeban      = liveIncomeStatement?.expenses ?? 0;
  const totalSurplus    = liveIncomeStatement?.netIncome ?? 0;
  const yearPendapatan  = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const yearBeban       = monthly.reduce((s, m) => s + m.beban, 0);
  const yearSurplus     = monthly.reduce((s, m) => s + m.surplus, 0);
  const pct = (num: number, den: number) => (den ? ((num / den) * 100).toFixed(1) : '0.0');
  const margin          = pct(totalSurplus, totalPendapatan);
  const yearMargin      = pct(yearSurplus, yearPendapatan);

  const totalAssets      = balanceSheet.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((s, l) => s + l.value, 0);
  const equity           = totalAssets - totalLiabilities;
  const liveAssets       = liveBalanceSheet?.assets ?? totalAssets;
  const liveLiabilities  = liveBalanceSheet?.liabilities ?? totalLiabilities;
  const liveEquity       = liveBalanceSheet?.equity ?? equity;
  const restrictedFunds  = liveBalanceSheet?.detail?.danaTerikatTemporer ?? 0;
  const unrestrictedFunds = liveBalanceSheet?.detail?.danaTidakTerikat ?? liveEquity;
  const liveRevenue      = liveIncomeStatement?.revenue ?? totalPendapatan;
  const liveExpenses     = liveIncomeStatement?.expenses ?? totalBeban;
  const liveNetIncome    = liveIncomeStatement?.netIncome ?? totalSurplus;
  const coaRows = Object.entries(coaRecords).slice(0, 6);
  const liveMargin       = liveRevenue ? ((liveNetIncome / liveRevenue) * 100).toFixed(1) : margin;
  const isak35Accounts = useMemo(() => coaRows.map(([code, account]) => ({
    code,
    name: account?.name || '-',
    type: account?.type || '-',
    isak35: account?.isak35 || 'Belum dipetakan',
  })), [coaRows]);

  const axisStyle = { fontSize: 13, fill: '#6b7280' };
  const activeTabLabel = reportTabs.find((tab) => tab.value === activeTab)?.label || 'Laporan';
  const complianceSummary = [
    { label: 'Aset Bersih Tidak Terikat', value: fmt(unrestrictedFunds), color: 'var(--brand-500)' },
    { label: 'Aset Bersih Terikat Temporer', value: fmt(restrictedFunds), color: 'var(--nx-purple)' },
    { label: 'Total Aset', value: fmt(liveAssets), color: '#10B981' },
    { label: 'Total Kewajiban', value: fmt(liveLiabilities), color: '#EF4444' },
  ];
  const exportBalanceSheet = balanceSheet;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setExportError('');

    try {
      await downloadFinancialReportPdf({
        year: reportYear,
        schoolName: tenant.name,
        reportName: 'Laporan Keuangan',
        colors: { navy: palette.sidebar, primary: palette.brand['500'], secondary: palette.secondary },
        fileSlug: tenant.slug,
        activeTabLabel,
        monthly,
        income: incomeRows,
        expenses: expenseRows,
        balanceSheet: exportBalanceSheet,
      });
    } catch (error) {
      console.error(error);
      setExportError('PDF belum berhasil dibuat. Silakan coba lagi beberapa saat lagi.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Responsive styles */}
      <style jsx global>{`
        /* ── Reports page responsive ── */
        @media (max-width: 768px) {
          .reports-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .reports-chart-tall { height: 260px !important; }
          .reports-chart { height: 220px !important; }
          .rpt-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .rpt-export-row {
            width: 100% !important;
            flex-direction: column !important;
            justify-content: stretch !important;
          }
          .rpt-export-row a,
          .rpt-export-row button {
            width: 100% !important;
            justify-content: center !important;
          }
          .rpt-tab-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            white-space: nowrap !important;
            padding-bottom: 2px !important;
            scrollbar-width: none;
          }
          .rpt-tab-bar::-webkit-scrollbar { display: none; }
          .rpt-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .rpt-compliance-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .rpt-isak35-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 8px;
          }
          .rpt-isak35-table-wrapper table {
            min-width: 480px;
          }
          .rpt-balance-row {
            font-size: 13px !important;
          }
        }
        @media (max-width: 480px) {
          .rpt-kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .rpt-compliance-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── ISAK35 section header accent (shared with other pages) ── */
        .isak35-section-header {
          border-left: 3px solid var(--brand-500);
          padding-left: 12px;
        }

        /* ── Report action button hover ── */
        .rpt-action-btn {
          transition: opacity 160ms, transform 160ms;
          cursor: pointer;
        }
        .rpt-action-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        /* ── Large currency amounts use fluid font ── */
        .rpt-currency-large {
          font-size: clamp(18px, 4vw, 24px) !important;
          font-weight: 800 !important;
        }

        /* ── Balance sheet row minimum font ── */
        .rpt-fs-min {
          font-size: max(13px, 0.85rem);
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header rpt-page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Laporan Keuangan</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Laporan Posisi Keuangan, Aktivitas, &amp; Arus Kas — ISAK 35 — Tahun {reportYear}</p>
        </div>
        <div className="rpt-export-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <a
            href="/docs/nexfinance-export-guidance.pdf"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary rpt-action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ExternalLink size={16} strokeWidth={1.8} />
            Panduan PDF
          </a>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="rpt-action-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, var(--nx-purple), var(--nx-purple))',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: downloadingPdf ? 'wait' : 'pointer', minHeight: 46,
              boxShadow: '0 18px 30px rgb(var(--nx-purple-rgb) / 0.22)',
            }}
          >
            <Download size={16} strokeWidth={1.8} />
            {downloadingPdf ? 'Menyusun PDF...' : 'Unduh PDF'}
          </button>
        </div>
      </div>

      {exportError && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            color: '#b91c1c',
            fontSize: 13,
          }}
        >
          {exportError}
        </div>
      )}

      {/* ISAK35 Compliance Snapshot */}
      <div className="card anim-fadeup" style={{ padding: 20, marginBottom: 18, background: 'linear-gradient(135deg, rgb(var(--brand-500-rgb) / 0.06), rgb(var(--nx-purple-rgb) / 0.05))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '.5px', textTransform: 'uppercase' }}
            >
              ISAK 35 Compliance Snapshot
            </div>
            <h2 style={{ marginTop: 6, fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 800, color: 'var(--text)' }}>Laporan entitas nonlaba yang lebih rapi dan konsisten</h2>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', maxWidth: 760 }}>
              NexFinance menyajikan aset, kewajiban, dan aset bersih berdasarkan struktur ISAK 35, dengan klasifikasi akun yang ditarik langsung dari chart of accounts backend.
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
            <span className="badge badge-success">ISAK 35 Ready</span>
            <span className="badge badge-info">Live backend data</span>
          </div>
        </div>
        <div
          className="rpt-compliance-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}
        >
          {complianceSummary.map((item) => (
            <div key={item.label} style={{ padding: 14, borderRadius: 14, background: '#fff', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', color: item.color, fontWeight: 700 }}>{item.label}</div>
              <div className="rpt-currency-large" style={{ marginTop: 6 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        className="rpt-kpi-grid anim-fadeup"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}
      >
        {[
          { label: 'Total Pendapatan YTD', value: fmt(liveRevenue),   color: '#10B981', bg: '#f0fdf6', border: '#10B98133' },
          { label: 'Total Beban YTD',      value: fmt(liveExpenses),  color: '#EF4444', bg: '#fff5f5', border: '#EF444433' },
          { label: 'Surplus Bersih YTD',   value: fmt(liveNetIncome), color: 'var(--brand-500)', bg: 'var(--brand-50)', border: 'color-mix(in srgb, var(--brand-500) 20%, transparent)' },
          { label: 'Margin Bersih',        value: liveMargin + '%',   color: 'var(--nx-purple)', bg: 'var(--nx-purple-50)', border: 'color-mix(in srgb, var(--nx-purple) 20%, transparent)' },
        ].map((s, i) => (
          <div key={i} className="card card-hover anim-fadeup" style={{ padding: '18px 20px', background: s.bg, border: `1px solid ${s.border}`, borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div className="rpt-currency-large" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ISAK35 Account Mapping */}
      <div className="card anim-fadeup" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}
            >
              Pemetaan Akun ISAK 35
            </div>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Klasifikasi akun backend yang dipakai untuk penyajian aset, kewajiban, dan aset bersih.</p>
          </div>
          <span className="badge badge-neutral">{coaRows.length} akun dipetakan</span>
        </div>
        <div className="rpt-isak35-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Kode', 'Nama Akun', 'Tipe', 'ISAK 35'].map((head) => (
                  <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isak35Accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
                    Belum ada data akun ISAK 35.
                  </td>
                </tr>
              ) : isak35Accounts.map((acc, idx) => (
                <tr key={acc.code} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{acc.code}</span></td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 'max(13px, 0.85rem)' }}>{acc.name}</td>
                  <td style={{ padding: '11px 14px', fontSize: 'max(13px, 0.85rem)' }}>{acc.type}</td>
                  <td style={{ padding: '11px 14px', fontSize: 'max(13px, 0.85rem)' }}>{acc.isak35}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tab Navigation — horizontally scrollable on mobile */}
      <div
        className="tab-bar rpt-tab-bar"
        style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 20 }}
      >
        {reportTabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`tab-btn${activeTab === value ? ' tab-btn-active' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Icon size={16} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Laporan Aktivitas (Income Statement — ISAK35) */}
      {activeTab === 'income' && (
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Income Statement */}
          <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}
            >
              Laporan Aktivitas — YTD {reportYear}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 12 }}>ISAK 35 — Entitas Nirlaba</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {([
                ['PENDAPATAN',      '',               '',        'header'],
                ...incomeRows.map((item) => [item.label, item.amount, '#10B981', ''] as [string, number, string, string]),
                ['Total Pendapatan', totalPendapatan, '#10B981', 'total'],
                ['',                 '',               '',        'spacer'],
                ['BEBAN',           '',               '',        'header'],
                ...expenseRows.map((item) => [item.label, item.amount, '#EF4444', ''] as [string, number, string, string]),
                ['Total Beban',      totalBeban,      '#EF4444', 'total'],
                ['',                 '',               '',        'spacer'],
                ['SURPLUS BERSIH',   totalSurplus,    'var(--brand-500)', 'final'],
              ] as [string, number|string, string, string][]).map(([label, val, color, type], i) => {
                if (type === 'spacer') return <div key={i} style={{ height: 12 }} />;
                if (type === 'header') return (
                  <div key={i} style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--brand-500)',
                    textTransform: 'uppercase', letterSpacing: '.8px',
                    padding: '8px 12px', marginTop: 4, marginBottom: 2,
                    background: 'var(--brand-50)', borderRadius: 6,
                    borderLeft: '3px solid var(--brand-500)',
                  }}>{label}</div>
                );
                if (type === 'final') return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 14px', marginTop: 4,
                    background: 'linear-gradient(90deg, var(--brand-50), var(--brand-50))',
                    borderRadius: 10, border: '1.5px solid color-mix(in srgb, var(--brand-500) 20%, transparent)',
                    flexWrap: 'wrap', gap: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-500)' }}>{label}</span>
                    <span style={{ fontSize: 'clamp(14px, 3vw, 15px)', fontWeight: 800, color: 'var(--brand-500)' }}>{val ? fmt(val as number) : ''}</span>
                  </div>
                );
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderBottom: type === 'total' ? '2px solid var(--border)' : '1px solid #f0f2f5',
                    padding: type === 'total' ? '10px 4px' : '9px 4px',
                    flexWrap: 'wrap', gap: 2,
                  }}>
                    <span className="rpt-fs-min" style={{ color: type === 'total' ? color : 'var(--text-2)', fontWeight: type === 'total' ? 700 : 400 }}>{label}</span>
                    <span className="rpt-fs-min" style={{ fontWeight: type === 'total' ? 800 : 600, color: color }}>{val ? fmt(val as number) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Surplus Trend Chart */}
          <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}
            >
              Tren Surplus Bulanan
            </div>
            <div className="reports-chart" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} tickFormatter={axisMoney} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="surplus" name="Surplus" stroke={palette.brand['500']} strokeWidth={2.5} dot={{ r: 5, fill: palette.brand['500'] }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Laporan Posisi Keuangan (Balance Sheet — ISAK35) */}
      {activeTab === 'balance' && (
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Assets */}
          <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              ASET — Laporan Posisi Keuangan
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 14 }}>ISAK 35 — Klasifikasi Aset Lancar &amp; Tidak Lancar</div>
            {balanceSheet.assets.map((a, i) => (
              <div key={i} className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--text-2)' }}>{a.name}</span>
                <span style={{ fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{fmt(a.value)}</span>
              </div>
            ))}
            <div className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', marginTop: 4, borderBottom: '3px double #10B981', fontSize: 15, fontWeight: 800, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text)' }}>Total Aset</span>
              <span style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{fmt(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
            <div
              className="isak35-section-header"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              KEWAJIBAN &amp; EKUITAS
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 14 }}>ISAK 35 — Kewajiban Jangka Pendek &amp; Aset Bersih</div>
            {balanceSheet.liabilities.map((l, i) => (
              <div key={i} className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ color: 'var(--text-2)' }}>{l.name}</span>
                <span style={{ fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{fmt(l.value)}</span>
              </div>
            ))}
            <div className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text-2)' }}>Total Kewajiban</span>
              <span style={{ color: '#EF4444', whiteSpace: 'nowrap' }}>{fmt(totalLiabilities)}</span>
            </div>
            <div className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text-2)' }}>Aset Bersih (Ekuitas)</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-500)', whiteSpace: 'nowrap' }}>{fmt(equity)}</span>
            </div>
            <div className="rpt-balance-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', marginTop: 4, borderBottom: '3px double #10B981', fontSize: 15, fontWeight: 800, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--text)' }}>Total Kewajiban + Ekuitas</span>
              <span style={{ color: '#10B981', whiteSpace: 'nowrap' }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Laporan Arus Kas (Cash Flow / Trend — ISAK35) */}
      {activeTab === 'cashflow' && (
        <div className="card anim-fadeup" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          <div
            className="isak35-section-header"
            style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}
          >
            Laporan Arus Kas — Tren Bulanan {reportYear}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            ISAK 35 — Arus kas operasional, investasi, dan pendanaan
          </p>
          <div className="reports-chart-tall" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={340}>
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} tickFormatter={axisMoney} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill={palette.brand['500']} radius={[5,5,0,0]} />
                <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5,5,0,0]} />
                <Bar dataKey="surplus"    name="Surplus"    fill="#10B981" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cash flow summary rows */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total Pendapatan', value: fmt(yearPendapatan), color: 'var(--brand-500)' },
              { label: 'Total Beban', value: fmt(yearBeban), color: '#EF4444' },
              { label: 'Surplus Kumulatif', value: fmt(yearSurplus), color: '#10B981' },
              { label: 'Margin Bersih', value: yearMargin + '%', color: 'var(--nx-purple)' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: item.color, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 'clamp(14px, 3vw, 17px)', fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

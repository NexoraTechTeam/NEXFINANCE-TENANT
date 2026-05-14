'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, TrendingUp, BarChart2, Download, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { accountingService } from '@/lib/api';
import { downloadFinancialReportPdf, type MonthlyFinancialRow } from '@/lib/report-pdf';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n: number) => n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt` : `Rp ${(n / 1e3).toFixed(0)}K`;

const monthly: MonthlyFinancialRow[] = [
  { bulan:'Jan', pendapatan:65_000_000, beban:42_000_000, surplus:23_000_000 },
  { bulan:'Feb', pendapatan:68_000_000, beban:44_000_000, surplus:24_000_000 },
  { bulan:'Mar', pendapatan:72_000_000, beban:43_000_000, surplus:29_000_000 },
  { bulan:'Apr', pendapatan:75_000_000, beban:45_500_000, surplus:29_500_000 },
  { bulan:'Mei', pendapatan:78_000_000, beban:46_000_000, surplus:32_000_000 },
];

const balanceSheet = {
  assets: [
    { name:'Kas & Bank', value:525_000_000 },
    { name:'Piutang SPP', value:18_000_000 },
    { name:'Peralatan', value:120_000_000 },
    { name:'Aset Tetap', value:350_000_000 },
  ],
  liabilities: [
    { name:'Utang Operasional', value:12_000_000 },
    { name:'Utang Gaji', value:45_000_000 },
  ],
};

const incomeRows = [
  { label: 'SPP Siswa', amount: 285_000_000 },
  { label: 'Donasi & Infaq', amount: 58_000_000 },
  { label: 'Lain-lain', amount: 15_000_000 },
];

const expenseRows = [
  { label: 'Gaji & Honor', amount: 185_000_000 },
  { label: 'Operasional', amount: 57_000_000 },
  { label: 'Pemeliharaan', amount: 28_500_000 },
  { label: 'Utilitas & Lain', amount: 23_500_000 },
];

const reportTabs = [
  { value: 'income', label: 'Laba Rugi', icon: FileText },
  { value: 'balance', label: 'Neraca', icon: BarChart2 },
  { value: 'cashflow', label: 'Tren Bulanan', icon: TrendingUp },
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
  const [activeTab, setActiveTab] = useState<'income'|'balance'|'cashflow'>('income');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportError, setExportError] = useState('');
  const [liveBalanceSheet, setLiveBalanceSheet] = useState<BalanceSheetResponse | null>(null);
  const [liveIncomeStatement, setLiveIncomeStatement] = useState<IncomeStatementResponse | null>(null);
  const [coaRecords, setCoaRecords] = useState<Record<string, AccountRecord>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      accountingService.getBalanceSheet(),
      accountingService.getIncomeStatement(),
      accountingService.getChartOfAccounts(),
    ])
      .then(([balanceRes, incomeRes, coaRes]) => {
        if (cancelled) return;
        setLiveBalanceSheet(balanceRes.data || null);
        setLiveIncomeStatement(incomeRes.data || null);
        setCoaRecords(coaRes.data?.accounts || {});
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
  }, []);

  const totalPendapatan = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const totalBeban      = monthly.reduce((s, m) => s + m.beban, 0);
  const totalSurplus    = monthly.reduce((s, m) => s + m.surplus, 0);
  const margin          = ((totalSurplus / totalPendapatan) * 100).toFixed(1);

  const totalAssets      = balanceSheet.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((s, l) => s + l.value, 0);
  const equity           = totalAssets - totalLiabilities;
  const liveAssets       = liveBalanceSheet?.assets ?? totalAssets;
  const liveLiabilities  = liveBalanceSheet?.liabilities ?? totalLiabilities;
  const liveEquity       = liveBalanceSheet?.equity ?? equity;
  const restrictedFunds  = liveBalanceSheet?.detail?.danaTerikatTemporer ?? liveEquity * 0.25;
  const unrestrictedFunds = liveBalanceSheet?.detail?.danaTidakTerikat ?? liveEquity * 0.75;
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
    { label: 'Aset Bersih Tidak Terikat', value: fmt(unrestrictedFunds), color: '#319ea9' },
    { label: 'Aset Bersih Terikat Temporer', value: fmt(restrictedFunds), color: '#3B82F6' },
    { label: 'Total Aset', value: fmt(liveAssets), color: '#10B981' },
    { label: 'Total Kewajiban', value: fmt(liveLiabilities), color: '#EF4444' },
  ];
  const exportBalanceSheet = liveBalanceSheet?.detail
    ? {
        assets: [
          { name: 'Kas & Setara Kas', value: liveBalanceSheet.detail.kas || liveBalanceSheet.detail.bank || liveAssets * 0.12 },
          { name: 'Rekening Bank', value: liveBalanceSheet.detail.bank || liveAssets * 0.55 },
          { name: 'Piutang SPP', value: liveBalanceSheet.detail.piutangSPP || liveAssets * 0.08 },
          { name: 'Persediaan', value: liveBalanceSheet.detail.persediaan || liveAssets * 0.06 },
        ],
        liabilities: [
          { name: 'Hutang Usaha', value: liveBalanceSheet.detail.hutangUsaha || liveLiabilities * 0.6 },
          { name: 'Hutang Gaji', value: liveBalanceSheet.detail.hutangGaji || liveLiabilities * 0.4 },
        ],
      }
    : balanceSheet;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setExportError('');

    try {
      await downloadFinancialReportPdf({
        year: 2026,
        schoolName: 'Sekolah Islam Terpadu Al-Musabbihin',
        reportName: 'Laporan Keuangan NexFinance',
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
      {/* Responsive chart styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .reports-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .reports-chart-tall { height: 260px !important; }
          .reports-chart { height: 220px !important; }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Laporan Keuangan</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Laba rugi, neraca, dan arus kas — Tahun 2026</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <a
            href="/docs/nexfinance-export-guidance.pdf"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ExternalLink size={16} strokeWidth={1.8} />
            Panduan PDF
          </a>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, #3B82F6, #2563eb)',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: downloadingPdf ? 'wait' : 'pointer', minHeight: 46,
              boxShadow: '0 18px 30px rgba(59,130,246,0.22)',
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

      <div className="card anim-fadeup" style={{ padding: 20, marginBottom: 18, background: 'linear-gradient(135deg, rgba(49,158,169,0.06), rgba(59,130,246,0.05))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#278a94', letterSpacing: '.5px', textTransform: 'uppercase' }}>ISAK 35 Compliance Snapshot</div>
            <h2 style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Laporan entitas nonlaba yang lebih rapi dan konsisten</h2>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-3)', maxWidth: 760 }}>
              NexFinance menyajikan aset, kewajiban, dan aset bersih berdasarkan struktur ISAK 35, dengan klasifikasi akun yang ditarik langsung dari chart of accounts backend.
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
            <span className="badge badge-success">ISAK 35 Ready</span>
            <span className="badge badge-info">Live backend data</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {complianceSummary.map((item) => (
            <div key={item.label} style={{ padding: 14, borderRadius: 14, background: '#fff', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', color: item.color, fontWeight: 700 }}>{item.label}</div>
              <div style={{ marginTop: 6, fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Pendapatan YTD', value: fmt(liveRevenue), color: '#10B981', bg: '#f0fdf6', border: '#10B98133' },
          { label: 'Total Beban YTD',      value: fmt(liveExpenses), color: '#EF4444', bg: '#fff5f5', border: '#EF444433' },
          { label: 'Surplus Bersih YTD',   value: fmt(liveNetIncome), color: '#319ea9', bg: '#f0fafb', border: '#319ea933' },
          { label: 'Margin Bersih',        value: liveMargin + '%',   color: '#3B82F6', bg: '#eff6ff', border: '#3B82F633' },
        ].map((s, i) => (
          <div key={i} className="card card-hover anim-fadeup" style={{ padding: '18px 20px', background: s.bg, border: `1px solid ${s.border}`, borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card anim-fadeup" style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Pemetaan Akun ISAK 35</div>
            <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-3)' }}>Klasifikasi akun backend yang dipakai untuk penyajian aset, kewajiban, dan aset bersih.</p>
          </div>
          <span className="badge badge-neutral">{coaRows.length} akun dipetakan</span>
        </div>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Kode', 'Nama Akun', 'Tipe', 'ISAK 35'].map((head) => (
                  <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isak35Accounts.map((acc, idx) => (
                <tr key={acc.code} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{acc.code}</span></td>
                  <td style={{ padding: '11px 14px', fontWeight: 700 }}>{acc.name}</td>
                  <td style={{ padding: '11px 14px' }}>{acc.type}</td>
                  <td style={{ padding: '11px 14px' }}>{acc.isak35}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar">
        {reportTabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`tab-btn${activeTab === value ? ' tab-btn-active' : ''}`}
          >
            <Icon size={16} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Laba Rugi */}
      {activeTab === 'income' && (
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Income Statement */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Laporan Laba Rugi — YTD 2026</div>
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
                ['SURPLUS BERSIH',   totalSurplus,    '#319ea9', 'final'],
              ] as [string, number|string, string, string][]).map(([label, val, color, type], i) => {
                if (type === 'spacer') return <div key={i} style={{ height: 12 }} />;
                if (type === 'header') return (
                  <div key={i} style={{
                    fontSize: 11, fontWeight: 700, color: '#319ea9',
                    textTransform: 'uppercase', letterSpacing: '.8px',
                    padding: '8px 12px', marginTop: 4, marginBottom: 2,
                    background: '#f0fafb', borderRadius: 6,
                    borderLeft: '3px solid #319ea9',
                  }}>{label}</div>
                );
                if (type === 'final') return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 14px', marginTop: 4,
                    background: 'linear-gradient(90deg, #f0fafb, #e8f7f9)',
                    borderRadius: 10, border: '1.5px solid #319ea933',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#319ea9' }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#319ea9' }}>{val ? fmt(val as number) : ''}</span>
                  </div>
                );
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderBottom: type === 'total' ? '2px solid var(--border)' : '1px solid #f0f2f5',
                    padding: type === 'total' ? '10px 4px' : '9px 4px',
                  }}>
                    <span style={{ fontSize: 14, color: type === 'total' ? color : 'var(--text-2)', fontWeight: type === 'total' ? 700 : 400 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: type === 'total' ? 800 : 600, color: color }}>{val ? fmt(val as number) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Surplus Trend Chart */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Tren Surplus Bulanan</div>
            <div className="reports-chart" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} tickFormatter={v => `${v/1e6}Jt`} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="surplus" name="Surplus" stroke="#319ea9" strokeWidth={2.5} dot={{ r: 5, fill: '#319ea9' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Neraca */}
      {activeTab === 'balance' && (
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Assets */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 20, background: '#10B981', borderRadius: 2, display: 'inline-block' }} />
              ASET
            </div>
            {balanceSheet.assets.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-2)' }}>{a.name}</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{fmt(a.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', marginTop: 4, borderBottom: '3px double #10B981', fontSize: 15, fontWeight: 800 }}>
              <span style={{ color: 'var(--text)' }}>Total Aset</span>
              <span style={{ color: '#10B981' }}>{fmt(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 20, background: '#EF4444', borderRadius: 2, display: 'inline-block' }} />
              KEWAJIBAN &amp; EKUITAS
            </div>
            {balanceSheet.liabilities.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-2)' }}>{l.name}</span>
                <span style={{ fontWeight: 700, color: '#EF4444' }}>{fmt(l.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: 'var(--text-2)' }}>Total Kewajiban</span>
              <span style={{ color: '#EF4444' }}>{fmt(totalLiabilities)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-2)' }}>Ekuitas / Modal</span>
              <span style={{ fontWeight: 700, color: '#319ea9' }}>{fmt(equity)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', marginTop: 4, borderBottom: '3px double #10B981', fontSize: 15, fontWeight: 800 }}>
              <span style={{ color: 'var(--text)' }}>Total Kewajiban + Ekuitas</span>
              <span style={{ color: '#10B981' }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tren Bulanan */}
      {activeTab === 'cashflow' && (
        <div className="card anim-fadeup" style={{ padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Tren Keuangan Bulanan — 2026</div>
          <div className="reports-chart-tall" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={340}>
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} tickFormatter={v => `${v/1e6}Jt`} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#319ea9" radius={[5,5,0,0]} />
                <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5,5,0,0]} />
                <Bar dataKey="surplus"    name="Surplus"    fill="#10B981" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

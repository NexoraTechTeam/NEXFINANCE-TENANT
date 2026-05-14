'use client';

import { useState } from 'react';
import { FileText, TrendingUp, BarChart2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n: number) => n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt` : `Rp ${(n / 1e3).toFixed(0)}K`;

const monthly = [
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: p.color }}>{p.name}</span>
          <span className="chart-tooltip-value">{short(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'income'|'balance'|'cashflow'>('income');

  const totalPendapatan = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const totalBeban      = monthly.reduce((s, m) => s + m.beban, 0);
  const totalSurplus    = monthly.reduce((s, m) => s + m.surplus, 0);
  const margin          = ((totalSurplus / totalPendapatan) * 100).toFixed(1);

  const totalAssets      = balanceSheet.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = balanceSheet.liabilities.reduce((s, l) => s + l.value, 0);
  const equity           = totalAssets - totalLiabilities;

  const axisStyle = { fontSize: 13, fill: '#6b7280' };

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
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6, #2563eb)',
          color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', minHeight: 44,
          boxShadow: '0 4px 14px rgba(59,130,246,0.30)',
        }}>
          <Download size={16} strokeWidth={1.8} /> Unduh PDF
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Pendapatan YTD', value: fmt(totalPendapatan), color: '#10B981', bg: '#f0fdf6', border: '#10B98133' },
          { label: 'Total Beban YTD',      value: fmt(totalBeban),      color: '#EF4444', bg: '#fff5f5', border: '#EF444433' },
          { label: 'Surplus Bersih YTD',   value: fmt(totalSurplus),    color: '#319ea9', bg: '#f0fafb', border: '#319ea933' },
          { label: 'Margin Bersih',        value: margin + '%',          color: '#3B82F6', bg: '#eff6ff', border: '#3B82F633' },
        ].map((s, i) => (
          <div key={i} className="card card-hover anim-fadeup" style={{ padding: '18px 20px', background: s.bg, border: `1px solid ${s.border}`, borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar">
        {([
          ['income',   'Laba Rugi',    FileText],
          ['balance',  'Neraca',       BarChart2],
          ['cashflow', 'Tren Bulanan', TrendingUp],
        ] as [string, string, any][]).map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => setActiveTab(val as 'income'|'balance'|'cashflow')}
            className={`tab-btn${activeTab === val ? ' tab-btn-active' : ''}`}
          >
            <Icon size={16} strokeWidth={1.8} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Laba Rugi */}
      {activeTab === 'income' && (
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Income Statement */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Laporan Laba Rugi — YTD 2026</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {([
                ['PENDAPATAN',      '',               '',        'header'],
                ['SPP Siswa',        285_000_000,     '#10B981', ''],
                ['Donasi & Infaq',   58_000_000,      '#10B981', ''],
                ['Lain-lain',        15_000_000,      '#10B981', ''],
                ['Total Pendapatan', totalPendapatan, '#10B981', 'total'],
                ['',                 '',               '',        'spacer'],
                ['BEBAN',           '',               '',        'header'],
                ['Gaji & Honor',     185_000_000,     '#EF4444', ''],
                ['Operasional',      57_000_000,      '#EF4444', ''],
                ['Pemeliharaan',     28_500_000,      '#EF4444', ''],
                ['Utilitas & Lain',  23_500_000,      '#EF4444', ''],
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
              <ResponsiveContainer width="100%" height="100%">
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
        <div className="reports-grid anim-fadeup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            <ResponsiveContainer width="100%" height="100%">
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

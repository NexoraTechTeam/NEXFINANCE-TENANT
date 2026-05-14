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
          <span className="chart-tooltip-label" style={{ color:p.color }}>{p.name}</span>
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>Laporan Keuangan</h1>
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Laba rugi, neraca, dan arus kas — Tahun 2026</p>
        </div>
        <button style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'#3B82F6', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', minHeight:44 }}>
          <Download size={16} strokeWidth={1.8}/> Unduh PDF
        </button>
      </div>

      {/* Summary KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Pendapatan YTD', value: fmt(totalPendapatan), color:'#10B981', bg:'#f0fdf6' },
          { label:'Total Beban YTD',      value: fmt(totalBeban),      color:'#EF4444', bg:'#fff5f5' },
          { label:'Surplus Bersih YTD',   value: fmt(totalSurplus),    color:'#319ea9', bg:'#f0fafb' },
          { label:'Margin Bersih',        value: margin + '%',          color:'#3B82F6', bg:'#eff6ff' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding:'18px 20px', background: s.bg, border:`1px solid ${s.color}22` }}>
            <div style={{ fontSize:12, fontWeight:600, color: s.color, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid var(--border)' }}>
        {[['income','Laba Rugi',FileText],['balance','Neraca',BarChart2],['cashflow','Tren Bulanan',TrendingUp]].map(([val,label,Icon]: any) => (
          <button key={val} onClick={() => setActiveTab(val)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 22px', borderRadius:'8px 8px 0 0', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:'none', border:'none', borderBottom: activeTab===val ? '3px solid #319ea9' : '3px solid transparent', color: activeTab===val ? '#319ea9' : 'var(--text-3)', marginBottom:-2, minHeight:44 }}>
            <Icon size={16} strokeWidth={1.8}/> {label}
          </button>
        ))}
      </div>

      {/* Tab: Laba Rugi */}
      {activeTab === 'income' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Laporan Laba Rugi — YTD 2026</div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[
                ['PENDAPATAN','','','header'],
                ['SPP Siswa', 285_000_000, '#10B981', ''],
                ['Donasi & Infaq', 58_000_000, '#10B981', ''],
                ['Lain-lain', 15_000_000, '#10B981', ''],
                ['Total Pendapatan', totalPendapatan, '#10B981', 'total'],
                ['','','','spacer'],
                ['BEBAN','','','header'],
                ['Gaji & Honor', 185_000_000, '#EF4444', ''],
                ['Operasional', 57_000_000, '#EF4444', ''],
                ['Pemeliharaan', 28_500_000, '#EF4444', ''],
                ['Utilitas & Lain', 23_500_000, '#EF4444', ''],
                ['Total Beban', totalBeban, '#EF4444', 'total'],
                ['','','','spacer'],
                ['SURPLUS BERSIH', totalSurplus, '#319ea9', 'final'],
              ].map(([label, val, color, type], i) => {
                if (type === 'spacer') return <div key={i} style={{ height:12 }} />;
                if (type === 'header') return <div key={i} style={{ fontSize:12, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.6px', padding:'8px 0 4px', borderTop:'1px solid var(--border)', marginTop:4 }}>{label}</div>;
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom: type==='total'||type==='final' ? '2px solid var(--border)' : '1px solid #f0f2f5', background: type==='final' ? '#f0fafb' : 'transparent', borderRadius: type==='final' ? 8 : 0, padding: type==='final' ? '10px 12px' : '9px 4px' }}>
                    <span style={{ fontSize: type==='total'||type==='final' ? 14 : 14, color: type==='total'||type==='final' ? color as string : 'var(--text-2)', fontWeight: type==='total'||type==='final' ? 700 : 400 }}>{label}</span>
                    <span style={{ fontSize:14, fontWeight: type==='total'||type==='final' ? 800 : 600, color: color as string }}>{val ? fmt(val as number) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Tren Surplus Bulanan</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} tickFormatter={v => `${v/1e6}Jt`} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:13 }} />
                <Line type="monotone" dataKey="surplus" name="Surplus" stroke="#319ea9" strokeWidth={2.5} dot={{ r:5, fill:'#319ea9' }} activeDot={{ r:7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Neraca */}
      {activeTab === 'balance' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:20 }}>ASET</div>
            {balanceSheet.assets.map((a, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                <span style={{ color:'var(--text-2)' }}>{a.name}</span>
                <span style={{ fontWeight:700, color:'#10B981' }}>{fmt(a.value)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', marginTop:4, borderTop:'2px solid var(--border)', fontSize:15, fontWeight:800 }}>
              <span style={{ color:'var(--text)' }}>Total Aset</span>
              <span style={{ color:'#10B981' }}>{fmt(totalAssets)}</span>
            </div>
          </div>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:20 }}>KEWAJIBAN & EKUITAS</div>
            {balanceSheet.liabilities.map((l, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                <span style={{ color:'var(--text-2)' }}>{l.name}</span>
                <span style={{ fontWeight:700, color:'#EF4444' }}>{fmt(l.value)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
              <span style={{ color:'var(--text-2)' }}>Total Kewajiban</span>
              <span style={{ fontWeight:700, color:'#EF4444' }}>{fmt(totalLiabilities)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
              <span style={{ color:'var(--text-2)' }}>Ekuitas / Modal</span>
              <span style={{ fontWeight:700, color:'#319ea9' }}>{fmt(equity)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', marginTop:4, borderTop:'2px solid var(--border)', fontSize:15, fontWeight:800 }}>
              <span style={{ color:'var(--text)' }}>Total Kewajiban + Ekuitas</span>
              <span style={{ color:'#10B981' }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tren Bulanan */}
      {activeTab === 'cashflow' && (
        <div className="card" style={{ padding:24 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Tren Keuangan Bulanan — 2026</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} tickFormatter={v => `${v/1e6}Jt`} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize:13, paddingTop:8 }} />
              <Bar dataKey="pendapatan" name="Pendapatan" fill="#319ea9" radius={[5,5,0,0]} />
              <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5,5,0,0]} />
              <Bar dataKey="surplus"    name="Surplus"    fill="#10B981" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, FileText, Download, BarChart2, DollarSign, CheckCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const COLORS = ['#41A9A9', '#2C3E50', '#1ABC9C', '#66C2C2', '#3B82F6', '#8B5CF6'];

const monthlyData = [
  { bulan: 'Jan', pendapatan: 65000000, beban: 42000000, laba: 23000000 },
  { bulan: 'Feb', pendapatan: 68000000, beban: 44000000, laba: 24000000 },
  { bulan: 'Mar', pendapatan: 70000000, beban: 43000000, laba: 27000000 },
  { bulan: 'Apr', pendapatan: 72000000, beban: 45000000, laba: 27000000 },
  { bulan: 'Mei', pendapatan: 75000000, beban: 48000000, laba: 27000000 },
];

const sppCollectionData = [
  { bulan: 'Jan', terkumpul: 87, target: 100 },
  { bulan: 'Feb', terkumpul: 91, target: 100 },
  { bulan: 'Mar', terkumpul: 89, target: 100 },
  { bulan: 'Apr', terkumpul: 94, target: 100 },
  { bulan: 'Mei', terkumpul: 88, target: 100 },
];

const expenseBreakdown = [
  { name: 'Gaji & Honor', value: 45000000 },
  { name: 'Operasional', value: 12000000 },
  { name: 'Pemeliharaan', value: 6000000 },
  { name: 'ATK & Supplies', value: 3000000 },
  { name: 'Utilitas', value: 2000000 },
];

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6F6 100%)', padding: '32px 20px' },
  wrapper: { maxWidth: '1400px', margin: '0 auto' },
  title: { fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#9CA3AF', marginBottom: '32px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#2C3E50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB', overflowX: 'auto' },
  tab: (active) => ({ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: active ? '#41A9A9' : '#9CA3AF', borderBottom: active ? '3px solid #41A9A9' : '3px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }),
  btn: (bg) => ({ background: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }),
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6', fontSize: '14px' },
  badge: (color) => ({ background: color + '20', color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }),
};

const FinancialReports = () => {
  const [period, setPeriod] = useState('2026-05');
  const [tab, setTab] = useState('overview');

  const ttlPendapatan = monthlyData.reduce((s, m) => s + m.pendapatan, 0);
  const ttlBeban = monthlyData.reduce((s, m) => s + m.beban, 0);
  const ttlLaba = ttlPendapatan - ttlBeban;
  const avgCollection = Math.round(sppCollectionData.reduce((s, m) => s + m.terkumpul, 0) / sppCollectionData.length);

  const tooltipStyle = { background: 'white', border: '2px solid #41A9A9', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={styles.title}>📊 Laporan Keuangan</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none' }} />
            <button style={styles.btn('linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)')} onClick={() => window.print()}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>
        <div style={styles.subtitle}>Dashboard laporan keuangan ISAK 35 — Sekolah Islam Terpadu Al-Musabbihin</div>

        <div style={styles.statsGrid}>
          {[
            { label: 'Total Pendapatan YTD', value: fmt(ttlPendapatan), color: '#10B981', icon: TrendingUp, trend: '+12% vs tahun lalu' },
            { label: 'Total Beban YTD', value: fmt(ttlBeban), color: '#EF4444', icon: DollarSign, trend: '+8% vs tahun lalu' },
            { label: 'Surplus Dana', value: fmt(ttlLaba), color: '#41A9A9', icon: CheckCircle, trend: '+18% vs tahun lalu' },
            { label: 'Rata-rata SPP', value: `${avgCollection}%`, color: '#F59E0B', icon: BarChart2, trend: 'Tingkat koleksi' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C3E50', marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>{s.trend}</div>
              </div>
            );
          })}
        </div>

        <div style={styles.card}>
          <div style={styles.tabs}>
            {[
              { key: 'overview', label: '📈 Overview' },
              { key: 'spp', label: '💰 Koleksi SPP' },
              { key: 'expense', label: '💸 Breakdown Beban' },
              { key: 'cashflow', label: '🔄 Arus Kas' },
            ].map(t => <button key={t.key} style={styles.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>

          {tab === 'overview' && (
            <>
              <div style={styles.cardTitle}><TrendingUp size={20} color="#41A9A9" /> Pendapatan vs Beban (5 Bulan Terakhir)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="bulan" stroke="#9CA3AF" fontSize={13} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#41A9A9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="beban" name="Beban" fill="#2C3E50" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="laba" name="Surplus" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {tab === 'spp' && (
            <>
              <div style={styles.cardTitle}><DollarSign size={20} color="#41A9A9" /> Tingkat Koleksi SPP (%)</div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={sppCollectionData}>
                  <defs>
                    <linearGradient id="colorSPP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#41A9A9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#41A9A9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="bulan" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[80, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="terkumpul" name="Terkumpul" stroke="#41A9A9" strokeWidth={3} fill="url(#colorSPP)" dot={{ fill: '#41A9A9', r: 5 }} />
                  <Line type="monotone" dataKey="target" name="Target" stroke="#E5E7EB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {tab === 'expense' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={styles.cardTitle}><BarChart2 size={20} color="#41A9A9" /> Distribusi Beban</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name }) => name}>
                      {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#2C3E50', marginBottom: '16px' }}>Rincian Beban</div>
                {expenseBreakdown.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>{item.name}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#2C3E50' }}>{fmt(item.value)}</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px' }}>({((item.value / ttlBeban) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <>
              <div style={styles.cardTitle}><FileText size={20} color="#41A9A9" /> Laporan Arus Kas</div>
              <div style={{ maxWidth: '700px' }}>
                {[
                  { section: 'AKTIVITAS OPERASIONAL', color: '#41A9A9', items: [['Penerimaan SPP', 65000000], ['Penerimaan Lain-lain', 8000000], ['Pembayaran Gaji', -45000000], ['Pembayaran Beban Operasional', -14000000]], subtotal: 14000000 },
                  { section: 'AKTIVITAS INVESTASI', color: '#3B82F6', items: [['Pembelian Peralatan', -5000000], ['Pembelian Kendaraan', 0]], subtotal: -5000000 },
                  { section: 'AKTIVITAS PENDANAAN', color: '#8B5CF6', items: [['Penerimaan Infaq/Sedekah', 3000000], ['Penerimaan Wakaf', 2000000]], subtotal: 5000000 },
                ].map(({ section, color, items, subtotal }) => (
                  <div key={section} style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '800', color, marginBottom: '10px', fontSize: '14px', letterSpacing: '0.3px' }}>{section}</div>
                    {items.map(([name, val]) => (
                      <div key={name} style={styles.summaryRow}>
                        <span style={{ color: '#6B7280', paddingLeft: '16px' }}>{name}</span>
                        <span style={{ fontWeight: '600', color: val >= 0 ? '#2C3E50' : '#EF4444' }}>{fmt(val)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: '800', fontSize: '14px', borderTop: `2px solid ${color}20` }}>
                      <span style={{ color }}>Subtotal {section.split(' ').slice(0, 2).join(' ')}</span>
                      <span style={{ color: subtotal >= 0 ? '#10B981' : '#EF4444' }}>{fmt(subtotal)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ background: '#EFF6F6', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: '#2C3E50' }}>Kenaikan Bersih Kas</span>
                  <span style={{ fontWeight: '800', fontSize: '20px', color: '#41A9A9' }}>{fmt(14000000)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;

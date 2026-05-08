import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, Users, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, RefreshCw,
  Wallet, ClipboardList,
} from 'lucide-react';
import { dashboardService } from '../services/api';

const IDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n) => n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M` : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt` : `Rp ${(n / 1e3).toFixed(0)}K`;
const COLORS = ['#41A9A9', '#2C3E50', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

const monthly = [
  { bulan: 'Jan', pendapatan: 65_000_000, beban: 42_000_000, laba: 23_000_000 },
  { bulan: 'Feb', pendapatan: 68_000_000, beban: 44_000_000, laba: 24_000_000 },
  { bulan: 'Mar', pendapatan: 72_000_000, beban: 43_000_000, laba: 29_000_000 },
  { bulan: 'Apr', pendapatan: 75_000_000, beban: 45_500_000, laba: 29_500_000 },
  { bulan: 'Mei', pendapatan: 78_000_000, beban: 46_000_000, laba: 32_000_000 },
];
const expDist = [
  { name: 'Gaji & Honor', value: 185_000_000 },
  { name: 'Operasional', value: 57_000_000 },
  { name: 'Pemeliharaan', value: 28_500_000 },
  { name: 'ATK & Supplies', value: 9_250_000 },
  { name: 'Utilitas', value: 14_250_000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: p.color }}>{p.name}</span>
          <span className="chart-tooltip-value">{short(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const total = expDist.reduce((s, e) => s + e.value, 0);
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{name}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Jumlah</span>
        <span className="chart-tooltip-value">{short(value)}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Proporsi</span>
        <span className="chart-tooltip-value">{((value / total) * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

const Skeleton = ({ h = 20, w = '100%', r = 8 }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
);

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(null);
  const [activePie, setActivePie] = useState(null);
  const [chartMode, setChartMode] = useState('area'); // area | bar
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await dashboardService.getKPI();
      setKpi(r.data);
    } catch {
      setKpi({ monthRevenue: 10_200_000, collectionRate: '66.7%', cashBalance: 525_000_000, pendingItems: 6, totalEmployees: 7, totalInvoices: 12, paidInvoices: 8 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpiCards = kpi ? [
    { label: 'Pendapatan Bulan Ini', value: IDR(kpi.monthRevenue), icon: DollarSign, color: '#41A9A9', bg: '#EFF6F6', trend: '+12%', up: true, sub: 'vs bulan lalu' },
    { label: 'Collection SPP', value: kpi.collectionRate, icon: TrendingUp, color: '#10B981', bg: '#D1FAE5', trend: '+3.2%', up: true, sub: `${kpi.paidInvoices}/${kpi.totalInvoices} invoice lunas` },
    { label: 'Saldo Kas & Bank', value: IDR(kpi.cashBalance), icon: Wallet, color: '#3B82F6', bg: '#DBEAFE', trend: '+8.4%', up: true, sub: 'Total aset likuid' },
    { label: 'Item Perlu Aksi', value: kpi.pendingItems, icon: AlertCircle, color: '#F59E0B', bg: '#FEF3C7', trend: `-${kpi.pendingItems}`, up: false, sub: `${kpi.pendingExpenses} pengeluaran + ${kpi.pendingPR} PR` },
  ] : [];

  const infoCards = kpi ? [
    { label: 'Total Siswa', value: kpi.totalStudents || 450, icon: Users, color: '#8B5CF6' },
    { label: 'Total Karyawan', value: kpi.totalEmployees, icon: Users, color: '#41A9A9' },
    { label: 'Total Invoice SPP', value: kpi.totalInvoices, icon: ClipboardList, color: '#10B981' },
    { label: 'Pengeluaran Pending', value: kpi.pendingExpenses, icon: Activity, color: '#F59E0B' },
  ] : [];

  const totalPend = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const totalBeban = monthly.reduce((s, m) => s + m.beban, 0);
  const totalLaba = totalPend - totalBeban;
  const totalExpDist = expDist.reduce((s, e) => s + e.value, 0);

  const getPieIndexFromEvent = (evt) => {
    if (!evt || typeof evt !== 'object') return null;
    if (Number.isInteger(evt.activeTooltipIndex)) return evt.activeTooltipIndex;

    const clickedPayload = evt.activePayload?.[0]?.payload;
    if (clickedPayload) {
      const idx = expDist.findIndex(
        (item) => item.name === clickedPayload.name && item.value === clickedPayload.value
      );
      if (idx >= 0) return idx;
    }

    if (Number.isInteger(evt.index)) return evt.index;
    return null;
  };

  const handlePieClick = (evt) => {
    const index = getPieIndexFromEvent(evt);
    if (index === null || index < 0 || index >= expDist.length) return;
    setActivePie((prev) => (prev === index ? null : index));
  };

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Dashboard Keuangan</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
              Sekolah Islam Terpadu Al-Musabbihin &nbsp;·&nbsp; {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'anim-spin' : ''} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────── */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
          {loading ? Array(4).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ padding: 22 }}>
              <Skeleton h={12} w="60%" r={4} />
              <div style={{ marginTop: 10 }}><Skeleton h={28} w="80%" r={4} /></div>
              <div style={{ marginTop: 8 }}><Skeleton h={10} w="50%" r={4} /></div>
            </div>
          )) : kpiCards.map((c, i) => {
            const Icon = c.icon;
            const Arrow = c.up ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={i} className="card card-hover anim-fadeup" style={{ padding: 22, cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ background: c.bg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: c.up ? '#D1FAE5' : '#FEF3C7', color: c.up ? '#10B981' : '#F59E0B', padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                    <Arrow size={12} />{c.trend}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── Info strip ─────────────────────────── */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
            {infoCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="anim-fadeup" style={{ animationDelay: `${i * .05}s`, background: 'var(--card)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{c.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Charts Row 1 ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Revenue vs Beban — switchable */}
          <div className="card anim-fadeup" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Tren Keuangan Bulanan</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Klik bar/area untuk detail</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['area', 'bar'].map(m => (
                  <button key={m} onClick={() => setChartMode(m)} className={`btn btn-sm ${chartMode === m ? 'btn-ghost' : ''}`} style={{ background: chartMode === m ? 'var(--teal-light)' : 'transparent', color: chartMode === m ? 'var(--teal)' : 'var(--text-3)', border: `1px solid ${chartMode === m ? 'var(--teal)' : 'var(--border)'}` }}>
                    {m === 'area' ? '∿ Area' : '▌ Bar'}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              {chartMode === 'area' ? (
                <AreaChart data={monthly} onClick={d => d && setActiveBar(d.activePayload?.[0]?.payload)}>
                  <defs>
                    <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#41A9A9" stopOpacity={.25} />
                      <stop offset="95%" stopColor="#41A9A9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBeban" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={.18} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#41A9A9" strokeWidth={2.5} fill="url(#gPend)" dot={{ r: 4, fill: '#41A9A9' }} activeDot={{ r: 6, cursor: 'pointer' }} />
                  <Area type="monotone" dataKey="beban"      name="Beban"      stroke="#EF4444" strokeWidth={2} fill="url(#gBeban)" dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6, cursor: 'pointer' }} />
                  <Area type="monotone" dataKey="laba"       name="Surplus"    stroke="#10B981" strokeWidth={2} fill="none" strokeDasharray="5 4" dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5, cursor: 'pointer' }} />
                </AreaChart>
              ) : (
                <BarChart data={monthly} onClick={d => d && setActiveBar(d.activePayload?.[0]?.payload)} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#41A9A9" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="laba"       name="Surplus"    fill="#10B981" radius={[5, 5, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Drill-down box */}
            {activeBar && (
              <div className="anim-scalein" style={{ marginTop: 12, background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 13 }}>📅 {activeBar.bulan}</span>
                {[['Pendapatan', activeBar.pendapatan, '#41A9A9'], ['Beban', activeBar.beban, '#EF4444'], ['Surplus', activeBar.laba, '#10B981']].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{short(v)}</div>
                  </div>
                ))}
                <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'none', color: 'var(--text-3)', border: '1px solid var(--border)', padding: '4px 10px', fontSize: 11 }} onClick={() => setActiveBar(null)}>✕</button>
              </div>
            )}
          </div>

          {/* Expense Pie */}
          <div className="card anim-fadeup" style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Distribusi Beban</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>Klik segmen untuk detail</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart onClick={handlePieClick}>
                <Pie data={expDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {expDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={activePie === null || activePie === i ? 1 : 0.4} stroke={activePie === i ? '#fff' : 'none'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
              {expDist.map((e, i) => (
                <div key={i} onClick={() => setActivePie(i === activePie ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', background: activePie === i ? COLORS[i % COLORS.length] + '15' : 'transparent', transition: 'background .15s' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-2)', flex: 1 }}>{e.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{short(e.value)}</span>
                </div>
              ))}
            </div>
            {activePie !== null && !!expDist[activePie] && (
              <div className="anim-scalein" style={{ marginTop: 10, background: COLORS[activePie % COLORS.length] + '15', borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${COLORS[activePie % COLORS.length]}` }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, marginBottom: 3 }}>{expDist[activePie].name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS[activePie % COLORS.length] }}>{IDR(expDist[activePie].value)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{((expDist[activePie].value / totalExpDist) * 100).toFixed(1)}% dari total beban</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Summary Row ─────────────────────────── */}
        <div className="anim-fadeup card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Ringkasan Keuangan YTD</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              ['Total Pendapatan', totalPend, '#10B981', '#D1FAE5'],
              ['Total Beban', totalBeban, '#EF4444', '#FEE2E2'],
              ['Surplus Bersih', totalLaba, '#41A9A9', '#EFF6F6'],
              ['Margin Bersih', ((totalLaba / totalPend) * 100).toFixed(1) + '%', '#3B82F6', '#DBEAFE'],
            ].map(([label, val, color, bg]) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{typeof val === 'string' ? val : short(val)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

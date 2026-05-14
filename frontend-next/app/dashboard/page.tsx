'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertCircle, RefreshCw,
  Wallet, ClipboardList, Users, Activity,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { dashboardService } from '@/lib/api';

const IDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M`
  : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt`
  : `Rp ${(n / 1e3).toFixed(0)}K`;

const COLORS = ['#319ea9', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

const monthly = [
  { bulan: 'Jan', pendapatan: 65_000_000, beban: 42_000_000, laba: 23_000_000 },
  { bulan: 'Feb', pendapatan: 68_000_000, beban: 44_000_000, laba: 24_000_000 },
  { bulan: 'Mar', pendapatan: 72_000_000, beban: 43_000_000, laba: 29_000_000 },
  { bulan: 'Apr', pendapatan: 75_000_000, beban: 45_500_000, laba: 29_500_000 },
  { bulan: 'Mei', pendapatan: 78_000_000, beban: 46_000_000, laba: 32_000_000 },
];
const expDist = [
  { name: 'Gaji & Honor',   value: 185_000_000 },
  { name: 'Operasional',    value:  57_000_000 },
  { name: 'Pemeliharaan',   value:  28_500_000 },
  { name: 'ATK & Supplies', value:   9_250_000 },
  { name: 'Utilitas',       value:  14_250_000 },
];

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

const PieTooltip = ({ active, payload }: any) => {
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

const Skeleton = ({ h = 20, w = '100%' }: { h?: number; w?: string }) => (
  <div className="skeleton" style={{ height: h, width: w }} />
);

export default function DashboardPage() {
  const router = useRouter();
  const [kpi, setKpi]           = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode]   = useState<'area' | 'bar'>('area');
  const [activePie, setActivePie]   = useState<number | null>(null);

  const fallbackKpi = {
    monthRevenue: 10_200_000, collectionRate: '66.7%',
    cashBalance: 525_000_000, pendingItems: 6,
    totalStudents: 15, totalEmployees: 7,
    totalInvoices: 12, paidInvoices: 8,
    pendingExpenses: 3, pendingPR: 3,
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const r = await dashboardService.getKPI();
      setKpi(r.data);
    } catch {
      setKpi(fallbackKpi);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpiCards = kpi ? [
    { label: 'Pendapatan Bulan Ini', value: IDR(kpi.monthRevenue), icon: DollarSign, color: '#319ea9', bg: '#f0fafb', trend: '+12%',          up: true,  sub: 'vs bulan lalu',                              to: '/dashboard/reports'    },
    { label: 'Collection SPP',       value: kpi.collectionRate,    icon: TrendingUp,  color: '#10B981', bg: '#f0fdf6', trend: '+3.2%',         up: true,  sub: `${kpi.paidInvoices}/${kpi.totalInvoices} invoice lunas`, to: '/dashboard/spp' },
    { label: 'Saldo Kas & Bank',     value: IDR(kpi.cashBalance),  icon: Wallet,      color: '#3B82F6', bg: '#eff6ff', trend: '+8.4%',         up: true,  sub: 'Total aset likuid',                           to: '/dashboard/accounting' },
    { label: 'Item Perlu Aksi',      value: kpi.pendingItems,      icon: AlertCircle, color: '#F59E0B', bg: '#fffbeb', trend: `-${kpi.pendingItems}`, up: false, sub: `${kpi.pendingExpenses} pengeluaran pending`, to: '/dashboard/reports' },
  ] : [];

  const infoCards = kpi ? [
    { label: 'Total Siswa',          value: kpi.totalStudents ?? 0, icon: Users,        color: '#8B5CF6' },
    { label: 'Total Karyawan',       value: kpi.totalEmployees,     icon: Users,        color: '#319ea9' },
    { label: 'Total Invoice SPP',    value: kpi.totalInvoices,      icon: ClipboardList,color: '#10B981' },
    { label: 'Pengeluaran Pending',  value: kpi.pendingExpenses,    icon: Activity,     color: '#F59E0B' },
  ] : [];

  const totalPend    = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const totalBeban   = monthly.reduce((s, m) => s + m.beban, 0);
  const totalLaba    = totalPend - totalBeban;
  const totalExpDist = expDist.reduce((s, e) => s + e.value, 0);

  const now = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ─── shared axis style ─── */
  const axisStyle = { fontSize: 13, fill: '#6b7280' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1 className="anim-fadeup dashboard-title">
            Dashboard Keuangan
          </h1>
          <p className="dashboard-subtitle">
            Sekolah Islam Terpadu Al-Musabbihin &nbsp;·&nbsp; {now}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="refresh-btn"
        >
          <RefreshCw size={16} strokeWidth={1.8}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: '#319ea9' }} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <Skeleton h={13} w="55%" />
            <div style={{ marginTop: 12 }}><Skeleton h={30} w="75%" /></div>
            <div style={{ marginTop: 10 }}><Skeleton h={12} w="50%" /></div>
          </div>
        )) : kpiCards.map((c, i) => {
          const Icon  = c.icon;
          const Arrow = c.up ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={i}
              className="card card-hover anim-fadeup kpi-card"
              style={{
                padding: 24,
                animationDelay: `${i * 0.07}s`,
                borderTop: `3px solid ${c.color}`,
              }}
              onClick={() => router.push(c.to)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={c.color} strokeWidth={1.8} />
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: c.up ? '#f0fdf4' : '#fffbeb',
                  color: c.up ? '#059669' : '#d97706',
                  padding: '5px 11px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                }}>
                  <Arrow size={13} />{c.trend}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {c.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-4)' }}>{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Info strip ── */}
      {!loading && (
        <div className="info-strip-grid">
          {infoCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="stat-strip anim-fadeup" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${c.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={19} color={c.color} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="charts-row">

        {/* Tren Keuangan */}
        <div className="card anim-fadeup" style={{ padding: 24 }}>
          <div className="chart-header">
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Tren Keuangan Bulanan</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>Pendapatan vs Beban vs Surplus</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['area', 'bar'] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: chartMode === m ? 600 : 400, minHeight: 38,
                  background: chartMode === m ? '#f0fafb' : '#fff',
                  border: `1px solid ${chartMode === m ? '#319ea9' : 'var(--border)'}`,
                  color: chartMode === m ? '#319ea9' : 'var(--text-3)',
                  transition: 'all 160ms ease',
                }}>
                  {m === 'area' ? '∿ Area' : '▌ Bar'}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container-main">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#319ea9" stopOpacity={.18} />
                      <stop offset="95%" stopColor="#319ea9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBeban" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={.12} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 8 }} />
                  <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#319ea9" strokeWidth={2.5} fill="url(#gPend)"  dot={{ r: 5, fill: '#319ea9' }} activeDot={{ r: 7 }} />
                  <Area type="monotone" dataKey="beban"      name="Beban"      stroke="#EF4444" strokeWidth={2}   fill="url(#gBeban)" dot={{ r: 5, fill: '#EF4444' }} activeDot={{ r: 7 }} />
                  <Area type="monotone" dataKey="laba"       name="Surplus"    stroke="#10B981" strokeWidth={2}   fill="none" strokeDasharray="5 4" dot={{ r: 4, fill: '#10B981' }} />
                </AreaChart>
              ) : (
                <BarChart data={monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="bulan" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 8 }} />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#319ea9" radius={[5,5,0,0]} />
                  <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5,5,0,0]} />
                  <Bar dataKey="laba"       name="Surplus"    fill="#10B981" radius={[5,5,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Beban */}
        <div className="card anim-fadeup" style={{ padding: 24, animationDelay: '0.1s' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Distribusi Beban</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Klik segmen untuk detail</div>

          <div className="chart-container-pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onClick={(evt: any) => {
                const idx = evt?.activeTooltipIndex ?? null;
                if (idx !== null) setActivePie(prev => prev === idx ? null : idx);
              }}>
                <Pie data={expDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {expDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]}
                      opacity={activePie === null || activePie === i ? 1 : 0.3}
                      stroke={activePie === i ? '#fff' : 'none'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {expDist.map((e, i) => (
              <div key={i} onClick={() => setActivePie(i === activePie ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                background: activePie === i ? `${COLORS[i % COLORS.length]}12` : 'transparent',
                transition: 'background 150ms',
                minHeight: 36,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{e.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{short(e.value)}</span>
              </div>
            ))}
          </div>

          {activePie !== null && expDist[activePie] && (
            <div className="anim-scalein" style={{ marginTop: 12, background: `${COLORS[activePie % COLORS.length]}10`, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${COLORS[activePie % COLORS.length]}` }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>{expDist[activePie].name}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS[activePie % COLORS.length] }}>{IDR(expDist[activePie].value)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
                {((expDist[activePie].value / totalExpDist) * 100).toFixed(1)}% dari total beban
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary YTD ── */}
      <div className="card anim-fadeup" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Ringkasan Keuangan YTD</div>
        <div className="ytd-grid">
          {([
            ['Total Pendapatan', totalPend,  '#10B981', '#f0fdf6'],
            ['Total Beban',      totalBeban, '#EF4444', '#fff5f5'],
            ['Surplus Bersih',   totalLaba,  '#319ea9', '#f0fafb'],
            ['Margin Bersih',    ((totalLaba / totalPend) * 100).toFixed(1) + '%', '#3B82F6', '#eff6ff'],
          ] as [string, number | string, string, string][]).map(([label, val, color, bg]) => (
            <div key={label} className="card-hover ytd-card" style={{
              background: bg, border: `1px solid ${color}22`,
              borderRadius: 12, padding: '16px 20px', minHeight: 80,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.3px' }}>
                {typeof val === 'string' ? val : short(val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Dashboard Header ── */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dashboard-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        .dashboard-subtitle {
          color: var(--text-3);
          font-size: 14px;
        }
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 14px;
          background: #fff;
          border: 1px solid var(--border);
          color: var(--text-2);
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          min-height: 44px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: box-shadow 180ms ease;
          flex-shrink: 0;
        }
        .refresh-btn:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }

        /* ── KPI Grid ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        /* ── Info Strip Grid ── */
        .info-strip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        /* ── Charts Row ── */
        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        /* ── Chart header (title + mode toggle) ── */
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ── Chart container heights (desktop) ── */
        .chart-container-main {
          width: 100%;
          height: 280px;
        }
        .chart-container-pie {
          width: 100%;
          height: 190px;
        }

        /* ── YTD Grid ── */
        .ytd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
        }

        /* ── Mobile: ≤ 640px ── */
        @media (max-width: 640px) {
          .dashboard-title {
            font-size: 22px;
          }
          .dashboard-subtitle {
            font-size: 12px;
          }
          .kpi-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-strip-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .charts-row {
            grid-template-columns: 1fr;
          }
          .chart-container-main {
            height: 200px;
          }
          .chart-container-pie {
            height: 160px;
          }
          .ytd-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .ytd-card {
            padding: 12px 14px !important;
            min-height: 64px !important;
          }
          .ytd-card > div:last-child {
            font-size: 18px !important;
          }
        }

        /* ── Tablet: 641px – 900px ── */
        @media (min-width: 641px) and (max-width: 900px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
          .chart-container-main {
            height: 240px;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Extra small: ≤ 400px ── */
        @media (max-width: 400px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .info-strip-grid {
            grid-template-columns: 1fr 1fr;
          }
          .ytd-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

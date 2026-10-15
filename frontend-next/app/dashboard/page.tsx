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
  ArrowUpRight, ArrowDownRight, Sparkles,
} from 'lucide-react';
import { dashboardService } from '@/lib/api';

const IDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M`
  : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt`
  : `Rp ${(n / 1e3).toFixed(0)}K`;

const COLORS = ['#4373B8', '#10B981', '#6B4FA0', '#F5B70A', '#8FAEE0'];

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

interface DashboardKpi {
  monthRevenue: number;
  collectionRate: string;
  cashBalance: number;
  pendingItems: number;
  totalStudents: number;
  totalEmployees: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingExpenses: number;
  pendingPR: number;
}

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

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}

const fallbackKpi: DashboardKpi = {
  monthRevenue: 10_200_000,
  collectionRate: '66.7%',
  cashBalance: 525_000_000,
  pendingItems: 6,
  totalStudents: 15,
  totalEmployees: 7,
  totalInvoices: 12,
  paidInvoices: 8,
  pendingExpenses: 3,
  pendingPR: 3,
};

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

const PieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value = 0 } = payload[0];
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
  const [kpi, setKpi]           = useState<DashboardKpi | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode]   = useState<'area' | 'bar'>('area');
  const [activePie, setActivePie]   = useState<number | null>(null);

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
    { label: 'Pendapatan Bulan Ini', value: IDR(kpi.monthRevenue), icon: DollarSign, color: '#4373b8', bg: '#eef3fb', trend: '+12%',          up: true,  sub: 'vs bulan lalu',                              to: '/dashboard/reports'    },
    { label: 'Collection SPP',       value: kpi.collectionRate,    icon: TrendingUp,  color: '#10B981', bg: '#f0fdf6', trend: '+3.2%',         up: true,  sub: `${kpi.paidInvoices}/${kpi.totalInvoices} invoice lunas`, to: '/dashboard/spp' },
    { label: 'Saldo Kas & Bank',     value: IDR(kpi.cashBalance),  icon: Wallet,      color: '#6B4FA0', bg: '#f3effa', trend: '+8.4%',         up: true,  sub: 'Total aset likuid',                           to: '/dashboard/accounting' },
    { label: 'Item Perlu Aksi',      value: kpi.pendingItems,      icon: AlertCircle, color: '#F59E0B', bg: '#fffbeb', trend: `-${kpi.pendingItems}`, up: false, sub: `${kpi.pendingExpenses} pengeluaran pending`, to: '/dashboard/reports' },
  ] : [];

  const infoCards = kpi ? [
    { label: 'Total Siswa',          value: kpi.totalStudents ?? 0, icon: Users,        color: '#2A4F8C' },
    { label: 'Total Karyawan',       value: kpi.totalEmployees,     icon: Users,        color: '#4373b8' },
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
            Yayasan ISAk 35 &nbsp;·&nbsp; {now}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="refresh-btn"
        >
          <RefreshCw size={16} strokeWidth={1.8}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: '#4373b8' }} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      <section className="card executive-banner anim-fadeup">
        <div>
          <div className="executive-kicker">
            <Sparkles size={14} strokeWidth={2} />
            Executive snapshot
          </div>
          <div className="executive-title">Yayasan ISAk 35 financial control center</div>
          <p className="executive-copy">
            Pantau arus kas, koleksi, dan item operasional prioritas dari satu workspace yang lebih tenang dan siap dipakai tim finance.
          </p>
        </div>
        <div className="executive-metrics">
          <div className="executive-metric">
            <span>Koleksi saat ini</span>
            <strong>{kpi ? kpi.collectionRate : '--'}</strong>
          </div>
          <div className="executive-metric">
            <span>Outstanding prioritas</span>
            <strong>{kpi ? `${kpi.pendingItems} item` : '--'}</strong>
          </div>
          <div className="executive-metric">
            <span>Coverage invoice</span>
            <strong>{kpi ? `${kpi.paidInvoices}/${kpi.totalInvoices}` : '--'}</strong>
          </div>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="card kpi-card-inner">
            <Skeleton h={13} w="55%" />
            <div style={{ marginTop: 12 }}><Skeleton h={28} w="75%" /></div>
            <div style={{ marginTop: 10 }}><Skeleton h={12} w="50%" /></div>
          </div>
        )) : kpiCards.map((c, i) => {
          const Icon  = c.icon;
          const Arrow = c.up ? ArrowUpRight : ArrowDownRight;
          return (
            <button
              key={i}
              type="button"
              className="card card-hover anim-fadeup kpi-card kpi-card-inner"
              style={{
                animationDelay: `${i * 0.07}s`,
                borderTop: `3px solid ${c.color}`,
              }}
              onClick={() => router.push(c.to)}
              aria-label={`${c.label}: ${c.value}. Buka ${c.label}`}
            >
              <div className="kpi-card-top">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={c.color} strokeWidth={1.8} />
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: c.up ? '#f0fdf4' : '#fffbeb',
                  color: c.up ? '#059669' : '#d97706',
                  padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  <Arrow size={12} />{c.trend}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>
                {c.label}
              </div>
              <div className="kpi-card-value">
                {c.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{c.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ── Info strip ── */}
      {!loading && (
        <div className="info-strip-grid">
          {infoCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={i}
                type="button"
                className="stat-strip anim-fadeup"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => router.push('/dashboard/reports')}
                aria-label={`${c.label}: ${c.value}`}
              >
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${c.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={19} color={c.color} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{c.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="charts-row">

        {/* Tren Keuangan */}
        <div className="card anim-fadeup card-p24">
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
                  background: chartMode === m ? '#eef3fb' : '#fff',
                  border: `1px solid ${chartMode === m ? '#4373b8' : 'var(--border)'}`,
                  color: chartMode === m ? '#4373b8' : 'var(--text-3)',
                  transition: 'all 160ms ease',
                }}>
                  {m === 'area' ? '∿ Area' : '▌ Bar'}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container-main">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              {chartMode === 'area' ? (
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4373b8" stopOpacity={.18} />
                      <stop offset="95%" stopColor="#4373b8" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#4373b8" strokeWidth={2.5} fill="url(#gPend)"  dot={{ r: 5, fill: '#4373b8' }} activeDot={{ r: 7 }} />
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
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#4373b8" radius={[5,5,0,0]} />
                  <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5,5,0,0]} />
                  <Bar dataKey="laba"       name="Surplus"    fill="#10B981" radius={[5,5,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Beban */}
        <div className="card anim-fadeup card-p24" style={{ animationDelay: '0.1s' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Distribusi Beban</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Klik segmen untuk detail</div>

          <div className="chart-container-pie">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
              <PieChart>
                <Pie data={expDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {expDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]}
                      opacity={activePie === null || activePie === i ? 1 : 0.3}
                      stroke={activePie === i ? '#fff' : 'none'} strokeWidth={2}
                      onClick={() => setActivePie((prev) => (prev === i ? null : i))} />
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
      <div className="card anim-fadeup card-p24" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Ringkasan Keuangan YTD</div>
        <div className="ytd-grid">
          {([
            ['Total Pendapatan', totalPend,  '#10B981', '#f0fdf6'],
            ['Total Beban',      totalBeban, '#EF4444', '#fff5f5'],
            ['Surplus Bersih',   totalLaba,  '#4373b8', '#eef3fb'],
            ['Margin Bersih',    ((totalLaba / totalPend) * 100).toFixed(1) + '%', '#6B4FA0', '#f3effa'],
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
        /* ── Spin keyframe (RefreshCw) ── */
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ═══════════════════════════════════════
           DASHBOARD HEADER
        ═══════════════════════════════════════ */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dashboard-title {
          font-size: clamp(20px, 5vw, 28px);
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
          transition: box-shadow 180ms ease, border-color 180ms ease;
          flex-shrink: 0;
        }
        .refresh-btn:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
          border-color: rgba(67, 115, 184, 0.3);
        }
        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ═══════════════════════════════════════
           EXECUTIVE BANNER
        ═══════════════════════════════════════ */
        .executive-banner {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.95fr);
          gap: 20px;
          padding: 28px 30px;
          margin-bottom: 20px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(238, 243, 251,0.98) 100%);
        }
        .executive-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(67, 115, 184, 0.12);
          color: #3461a8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .32px;
          text-transform: uppercase;
        }
        .executive-title {
          margin-top: 16px;
          font-size: clamp(20px, 3vw, 32px);
          font-weight: 800;
          letter-spacing: -0.7px;
          line-height: 1.15;
          color: var(--text);
        }
        .executive-copy {
          margin-top: 12px;
          max-width: 720px;
          color: var(--text-3);
          font-size: 14px;
          line-height: 1.8;
        }
        .executive-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          align-self: end;
        }
        .executive-metric {
          min-height: 88px;
          border-radius: 16px;
          border: 1px solid rgba(67, 115, 184, 0.14);
          background: rgba(255,255,255,0.80);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: box-shadow 200ms ease, border-color 200ms ease;
        }
        .executive-metric:hover {
          border-color: rgba(67, 115, 184, 0.28);
          box-shadow: 0 4px 16px rgba(67, 115, 184, 0.08);
        }
        .executive-metric span {
          color: var(--text-4);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .executive-metric strong {
          color: var(--text);
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }

        /* ═══════════════════════════════════════
           KPI GRID  — auto-fill responsive
        ═══════════════════════════════════════ */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .kpi-card {
          width: 100%;
          text-align: left;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
          background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%);
          min-height: 160px;
        }
        .kpi-card-inner {
          padding: 20px;
        }
        .kpi-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 8px;
        }
        .kpi-card-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
          letter-spacing: -0.5px;
          line-height: 1.1;
          word-break: break-word;
        }

        /* ═══════════════════════════════════════
           INFO STRIP GRID
        ═══════════════════════════════════════ */
        .info-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        /* ═══════════════════════════════════════
           CHARTS ROW  — 60/40 desktop split
        ═══════════════════════════════════════ */
        .charts-row {
          display: grid;
          grid-template-columns: 3fr 2fr;
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
          height: 300px;
        }
        .chart-container-pie {
          width: 100%;
          height: 200px;
        }

        /* ═══════════════════════════════════════
           YTD GRID
        ═══════════════════════════════════════ */
        .ytd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
        }

        /* ── Card padding utility ── */
        .card-p24 { padding: 24px; }

        /* ═══════════════════════════════════════
           TABLET: 641px – 1023px
        ═══════════════════════════════════════ */
        @media (min-width: 641px) and (max-width: 1023px) {
          .executive-banner {
            grid-template-columns: 1fr;
            padding: 22px 22px;
          }
          .executive-metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-top: 4px;
          }
          .charts-row {
            grid-template-columns: 1fr;
          }
          .chart-container-main {
            height: 280px;
          }
          .chart-container-pie {
            height: 200px;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .info-strip-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .ytd-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* ═══════════════════════════════════════
           MOBILE: ≤ 640px
        ═══════════════════════════════════════ */
        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            margin-bottom: 20px;
          }
          .dashboard-subtitle {
            font-size: 12px;
          }
          .refresh-btn {
            align-self: flex-start;
          }

          .executive-banner {
            grid-template-columns: 1fr;
            padding: 18px 16px;
            margin-bottom: 14px;
          }
          .executive-copy {
            font-size: 13px;
          }
          .executive-metrics {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-top: 4px;
          }
          .executive-metric {
            min-height: 72px;
            padding: 10px 12px;
            border-radius: 12px;
          }
          .executive-metric span {
            font-size: 10px;
          }
          .executive-metric strong {
            font-size: 15px;
          }

          /* 2-column KPI on mobile */
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .kpi-card {
            min-height: 130px;
          }
          .kpi-card-inner {
            padding: 14px;
          }
          .kpi-card-top {
            margin-bottom: 10px;
          }
          .kpi-card-value {
            font-size: 18px;
          }

          /* 2x2 info strip on mobile */
          .info-strip-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 16px;
          }

          .charts-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .chart-container-main {
            height: 260px;
          }
          .chart-container-pie {
            height: 170px;
          }
          .card-p24 {
            padding: 16px;
          }

          .ytd-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .ytd-card {
            padding: 12px 14px !important;
            min-height: 64px !important;
          }
          .ytd-card > div:last-child {
            font-size: 17px !important;
          }
        }

        /* ═══════════════════════════════════════
           EXTRA SMALL: ≤ 400px  (375px phones)
        ═══════════════════════════════════════ */
        @media (max-width: 400px) {
          .executive-metrics {
            grid-template-columns: 1fr;
          }
          .executive-metric {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            min-height: 48px;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .kpi-card {
            min-height: 120px;
          }
          .info-strip-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
          }
          .ytd-grid {
            grid-template-columns: 1fr;
          }
          .chart-container-main {
            height: 220px;
          }
        }

        /* ═══════════════════════════════════════
           LARGE DESKTOP: ≥ 1280px
        ═══════════════════════════════════════ */
        @media (min-width: 1280px) {
          .kpi-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .chart-container-main {
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
}

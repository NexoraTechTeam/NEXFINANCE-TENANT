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
import { useTenant } from '@/components/tenant/TenantProvider';
import { toExpenseDistribution, toMonthlyRows, type LedgerMonth, type MonthlyRow } from '@/lib/financials';

const IDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n: number) =>
  n >= 1e9 ? `Rp ${(n / 1e9).toFixed(1)}M`
  : n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt`
  : `Rp ${(n / 1e3).toFixed(0)}K`;



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
  payload?: Array<{ name?: string; value?: number; payload?: { share?: number } }>;
}

const EMPTY_KPI: DashboardKpi = {
  monthRevenue: 0,
  collectionRate: '0%',
  cashBalance: 0,
  pendingItems: 0,
  totalStudents: 0,
  totalEmployees: 0,
  totalInvoices: 0,
  paidInvoices: 0,
  pendingExpenses: 0,
  pendingPR: 0,
};

interface MonthlyReport {
  series?: LedgerMonth[];
  expenseDistribution?: Array<{ account: string; name: string; value: number }>;
  ytd?: { revenue: number; expenses: number; netIncome: number };
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

const PieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value = 0 } = payload[0];
  const share = (payload[0] as { payload?: { share?: number } }).payload?.share ?? 0;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{name}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Jumlah</span>
        <span className="chart-tooltip-value">{short(value)}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Proporsi</span>
        <span className="chart-tooltip-value">{(share * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

const Skeleton = ({ h = 20, w = '100%' }: { h?: number; w?: string }) => (
  <div className="skeleton" style={{ height: h, width: w }} />
);

export default function DashboardPage() {
  const router = useRouter();
  const tenant = useTenant();
  const { palette } = tenant;
  // Chart colors are real hex values (SVG attributes cannot use CSS variables).
  const COLORS = [palette.brand['500'], '#10B981', palette.secondary, palette.accent, palette.brand['300']];
  const [kpi, setKpi]           = useState<DashboardKpi | null>(null);
  const [report, setReport]     = useState<MonthlyReport | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode]   = useState<'area' | 'bar'>('area');
  const [activePie, setActivePie]   = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const [kpiRes, reportRes] = await Promise.allSettled([
      dashboardService.getKPI(),
      dashboardService.getMonthlyReport(),
    ]);
    try {
      setKpi(kpiRes.status === 'fulfilled' ? kpiRes.value.data : EMPTY_KPI);
      setReport(reportRes.status === 'fulfilled' ? reportRes.value.data : null);
      setLoadError(kpiRes.status === 'rejected' || reportRes.status === 'rejected'
        ? 'Sebagian data belum dapat dimuat. Coba Refresh beberapa saat lagi.'
        : '');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const monthly: MonthlyRow[] = toMonthlyRows(report?.series);
  const totalExpDist = (report?.expenseDistribution ?? []).reduce((s, e) => s + e.value, 0);
  const expDist = toExpenseDistribution(report?.expenseDistribution)
    .map((e) => ({ ...e, share: totalExpDist ? e.value / totalExpDist : 0 }));
  const [prevMonth, thisMonth] = monthly.slice(-2);
  const revenueTrend = prevMonth && prevMonth.pendapatan > 0
    ? ((thisMonth.pendapatan - prevMonth.pendapatan) / prevMonth.pendapatan) * 100
    : null;
  const fmtTrend = (n: number | null) => (n === null ? null : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`);

  const kpiCards = kpi ? [
    { label: 'Pendapatan Bulan Ini', value: IDR(kpi.monthRevenue), icon: DollarSign, color: 'var(--brand-500)', bg: 'var(--brand-50)', trend: fmtTrend(revenueTrend), up: (revenueTrend ?? 0) >= 0, sub: 'vs bulan lalu',                              to: '/dashboard/reports'    },
    { label: 'Collection SPP',       value: kpi.collectionRate,    icon: TrendingUp,  color: '#10B981', bg: '#f0fdf6', trend: null as string | null, up: true,  sub: `${kpi.paidInvoices}/${kpi.totalInvoices} invoice lunas`, to: '/dashboard/spp' },
    { label: 'Saldo Kas & Bank',     value: IDR(kpi.cashBalance),  icon: Wallet,      color: 'var(--nx-purple)', bg: 'var(--nx-purple-50)', trend: null as string | null, up: true,  sub: 'Total aset likuid',                           to: '/dashboard/accounting' },
    { label: 'Item Perlu Aksi',      value: kpi.pendingItems,      icon: AlertCircle, color: '#F59E0B', bg: '#fffbeb', trend: kpi.pendingItems ? `${kpi.pendingItems}` : null, up: false, sub: `${kpi.pendingExpenses} pengeluaran pending`, to: '/dashboard/reports' },
  ] : [];

  const infoCards = kpi ? [
    { label: 'Total Siswa',          value: kpi.totalStudents ?? 0, icon: Users,        color: 'var(--brand-700)' },
    { label: 'Total Karyawan',       value: kpi.totalEmployees,     icon: Users,        color: 'var(--brand-500)' },
    { label: 'Total Invoice SPP',    value: kpi.totalInvoices,      icon: ClipboardList,color: '#10B981' },
    { label: 'Pengeluaran Pending',  value: kpi.pendingExpenses,    icon: Activity,     color: '#F59E0B' },
  ] : [];

  const totalPend    = report?.ytd?.revenue ?? 0;
  const totalBeban   = report?.ytd?.expenses ?? 0;
  const totalLaba    = report?.ytd?.netIncome ?? 0;

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
            {tenant.name} &nbsp;·&nbsp; {now}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="refresh-btn"
        >
          <RefreshCw size={16} strokeWidth={1.8}
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: 'var(--brand-500)' }} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      {loadError && (
        <div role="alert" style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
          {loadError}
        </div>
      )}

      <section className="card executive-banner anim-fadeup">
        <div>
          <div className="executive-kicker">
            <Sparkles size={14} strokeWidth={2} />
            Executive snapshot
          </div>
          <div className="executive-title">Pusat kendali keuangan {tenant.shortName}</div>
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
                {c.trend && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    background: c.up ? '#f0fdf4' : '#fffbeb',
                    color: c.up ? '#059669' : '#d97706',
                    padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    <Arrow size={12} />{c.trend}
                  </span>
                )}
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
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `color-mix(in srgb, ${c.color} 9%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                  background: chartMode === m ? 'var(--brand-50)' : '#fff',
                  border: `1px solid ${chartMode === m ? 'var(--brand-500)' : 'var(--border)'}`,
                  color: chartMode === m ? 'var(--brand-500)' : 'var(--text-3)',
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
                      <stop offset="5%"  stopColor={palette.brand['500']} stopOpacity={.18} />
                      <stop offset="95%" stopColor={palette.brand['500']} stopOpacity={0} />
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
                  <Area type="monotone" dataKey="pendapatan" name="Pendapatan" stroke={palette.brand['500']} strokeWidth={2.5} fill="url(#gPend)"  dot={{ r: 5, fill: palette.brand['500'] }} activeDot={{ r: 7 }} />
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
                  <Bar dataKey="pendapatan" name="Pendapatan" fill={palette.brand['500']} radius={[5,5,0,0]} />
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

          {expDist.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: 'var(--text-4)', padding: '24px 0', textAlign: 'center' }}>
              Belum ada beban tercatat. Distribusi akan muncul setelah transaksi pertama.
            </p>
          )}
          <div className="chart-container-pie" hidden={expDist.length === 0}>
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
            ['Surplus Bersih',   totalLaba,  'var(--brand-500)', 'var(--brand-50)'],
            ['Margin Bersih',    totalPend ? ((totalLaba / totalPend) * 100).toFixed(1) + '%' : '–', 'var(--nx-purple)', 'var(--nx-purple-50)'],
          ] as [string, number | string, string, string][]).map(([label, val, color, bg]) => (
            <div key={label} className="card-hover ytd-card" style={{
              background: bg, border: `1px solid color-mix(in srgb, ${color} 13%, transparent)`,
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
          border-color: rgb(var(--brand-500-rgb) / 0.3);
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
            linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgb(var(--brand-50-rgb) / 0.98) 100%);
        }
        .executive-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgb(var(--brand-500-rgb) / 0.12);
          color: var(--brand-600);
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
          border: 1px solid rgb(var(--brand-500-rgb) / 0.14);
          background: rgba(255,255,255,0.80);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: box-shadow 200ms ease, border-color 200ms ease;
        }
        .executive-metric:hover {
          border-color: rgb(var(--brand-500-rgb) / 0.28);
          box-shadow: 0 4px 16px rgb(var(--brand-500-rgb) / 0.08);
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

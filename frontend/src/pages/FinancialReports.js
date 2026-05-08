import React, { useState, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, FileText, Download, BarChart2, DollarSign, RefreshCw, ArrowUpRight } from 'lucide-react';
import { exportFinancialReport } from '../utils/exportPDF';
import { sppService, expenseService, payrollService } from '../services/api';

const IDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const short = (n) => n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1)}Jt` : `Rp ${(n / 1e3).toFixed(0)}K`;
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%';

const COLORS = ['#41A9A9', '#2C3E50', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
const TABS = [
  { key: 'overview',  icon: TrendingUp, label: 'Overview' },
  { key: 'spp',       icon: DollarSign, label: 'Koleksi SPP' },
  { key: 'expense',   icon: BarChart2,  label: 'Distribusi Beban' },
  { key: 'cashflow',  icon: FileText,   label: 'Arus Kas' },
];

const monthly = [
  { bulan: 'Jan', pendapatan: 65_000_000, beban: 42_000_000, laba: 23_000_000 },
  { bulan: 'Feb', pendapatan: 68_000_000, beban: 44_000_000, laba: 24_000_000 },
  { bulan: 'Mar', pendapatan: 72_000_000, beban: 43_000_000, laba: 29_000_000 },
  { bulan: 'Apr', pendapatan: 75_000_000, beban: 45_500_000, laba: 29_500_000 },
  { bulan: 'Mei', pendapatan: 78_000_000, beban: 46_000_000, laba: 32_000_000 },
];
const sppData = [
  { bulan: 'Jan', terkumpul: 87, target: 100 },
  { bulan: 'Feb', terkumpul: 91, target: 100 },
  { bulan: 'Mar', terkumpul: 89, target: 100 },
  { bulan: 'Apr', terkumpul: 94, target: 100 },
  { bulan: 'Mei', terkumpul: 88, target: 100 },
];
const expenseData = [
  { name: 'Gaji & Honor', value: 185_000_000 },
  { name: 'Operasional',  value: 57_000_000 },
  { name: 'Pemeliharaan', value: 28_500_000 },
  { name: 'ATK & Supplies', value: 9_250_000 },
  { name: 'Utilitas',     value: 14_250_000 },
];
const cashflow = [
  { bulan: 'Jan', operasional: 18_000_000, investasi: -5_000_000, pendanaan: 3_000_000 },
  { bulan: 'Feb', operasional: 21_000_000, investasi: 0,           pendanaan: 2_000_000 },
  { bulan: 'Mar', operasional: 25_000_000, investasi: -8_000_000, pendanaan: 4_000_000 },
  { bulan: 'Apr', operasional: 26_500_000, investasi: -2_000_000, pendanaan: 2_000_000 },
  { bulan: 'Mei', operasional: 28_000_000, investasi: 0,           pendanaan: 3_000_000 },
];

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-label" style={{ color: p.color }}>{p.name}</span>
          <span className="chart-tooltip-value">{typeof p.value === 'number' && Math.abs(p.value) > 999 ? short(p.value) : p.value + (p.name === 'Terkumpul' || p.name === 'Target' ? '%' : '')}</span>
        </div>
      ))}
    </div>
  );
};

export default function FinancialReports() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('2026-05');
  const [activeBar, setActiveBar] = useState(null);
  const [activePie, setActivePie] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      exportFinancialReport({ monthly, sppData, expenseData, kpi: {} });
      showToast('Laporan keuangan berhasil diekspor!');
    } catch (e) {
      showToast('Gagal mengekspor laporan.', false);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  }, []);

  const totalPend = monthly.reduce((s, m) => s + m.pendapatan, 0);
  const totalBeban = monthly.reduce((s, m) => s + m.beban, 0);
  const totalLaba = totalPend - totalBeban;
  const avgSPP = (sppData.reduce((s, m) => s + m.terkumpul, 0) / sppData.length).toFixed(1);
  const totalExp = expenseData.reduce((s, e) => s + e.value, 0);

  const summaryKPIs = [
    { label: 'Total Pendapatan YTD', value: short(totalPend), color: '#10B981', bg: '#D1FAE5', trend: '+12%' },
    { label: 'Total Beban YTD',      value: short(totalBeban), color: '#EF4444', bg: '#FEE2E2', trend: '+8%' },
    { label: 'Surplus Dana',          value: short(totalLaba),  color: '#41A9A9', bg: '#EFF6F6', trend: '+18%' },
    { label: 'Avg SPP Collection',    value: avgSPP + '%',      color: '#3B82F6', bg: '#DBEAFE', trend: 'Target 100%' },
  ];

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      {toast && <div className={`toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>{toast.ok ? '✅' : '❌'} {toast.msg}</div>}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Header ───────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Laporan Keuangan</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Dashboard laporan interaktif — Standar ISAK 35 · Klik chart untuk drill-down</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="input" style={{ width: 160, fontSize: 13, padding: '8px 12px' }} />
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? <RefreshCw size={14} className="anim-spin" /> : <Download size={14} />}
              {exporting ? 'Mengekspor...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* ── KPI Strip ────────────────────────────── */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
          {summaryKPIs.map((k, i) => (
            <div key={i} className="card anim-fadeup" style={{ padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpRight size={11} color={k.color} /> {k.trend}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', overflowX: 'auto' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--teal)' : 'var(--text-2)', borderBottom: `2.5px solid ${active ? 'var(--teal)' : 'transparent'}`, marginBottom: -1.5, whiteSpace: 'nowrap', transition: 'all .15s' }}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: 24 }}>

            {/* TAB: Overview */}
            {tab === 'overview' && (
              <div className="anim-fadein">
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Pendapatan vs Beban vs Surplus</div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Klik bar untuk melihat detail bulan</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthly} onClick={d => d?.activePayload && setActiveBar(d.activePayload[0].payload)} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tooltip_ />} cursor={{ fill: '#F8FAFC' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pendapatan" name="Pendapatan" fill="#41A9A9" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="beban"      name="Beban"      fill="#EF4444" radius={[5, 5, 0, 0]} opacity={.85} />
                    <Bar dataKey="laba"       name="Surplus"    fill="#10B981" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {activeBar && (
                  <div className="anim-scalein" style={{ marginTop: 16, background: 'var(--bg)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>📅 Detail Bulan {activeBar.bulan}</span>
                      <button className="btn btn-sm" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)', padding: '3px 9px', fontSize: 11 }} onClick={() => setActiveBar(null)}>✕ Tutup</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {[['Pendapatan', activeBar.pendapatan, '#10B981', '#D1FAE5'], ['Beban', activeBar.beban, '#EF4444', '#FEE2E2'], ['Surplus', activeBar.laba, '#41A9A9', '#EFF6F6'], ['Margin', pct(activeBar.laba, activeBar.pendapatan), '#3B82F6', '#DBEAFE']].map(([l, v, c, bg]) => (
                        <div key={l} style={{ background: bg, borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{typeof v === 'string' ? v : short(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SPP */}
            {tab === 'spp' && (
              <div className="anim-fadein">
                <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Tingkat Koleksi SPP Bulanan (%)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={sppData}>
                    <defs>
                      <linearGradient id="gSPP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#41A9A9" stopOpacity={.2} />
                        <stop offset="95%" stopColor="#41A9A9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tooltip_ />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={90} stroke="#10B981" strokeDasharray="6 3" label={{ value: 'Target Baik 90%', position: 'right', fontSize: 10, fill: '#10B981' }} />
                    <Area type="monotone" dataKey="terkumpul" name="Terkumpul" stroke="#41A9A9" strokeWidth={2.5} fill="url(#gSPP)" dot={{ r: 5, fill: '#41A9A9', cursor: 'pointer' }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="target" name="Target" stroke="#E2E8F0" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                  {sppData.map((s, i) => (
                    <div key={i} style={{ background: s.terkumpul >= 90 ? '#D1FAE5' : s.terkumpul >= 80 ? '#FEF3C7' : '#FEE2E2', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 3 }}>{s.bulan}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.terkumpul >= 90 ? '#10B981' : s.terkumpul >= 80 ? '#F59E0B' : '#EF4444' }}>{s.terkumpul}%</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{s.terkumpul >= 90 ? '✓ Baik' : s.terkumpul >= 80 ? '△ Cukup' : '⚠ Perhatian'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Expense */}
            {tab === 'expense' && (
              <div className="anim-fadein">
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Distribusi Beban Operasional</div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Klik segmen atau baris untuk highlight</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" onClick={(_, i) => setActivePie(i === activePie ? null : i)}>
                        {expenseData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={activePie === null || activePie === i ? 1 : 0.35} stroke={activePie === i ? '#fff' : 'none'} strokeWidth={3} style={{ cursor: 'pointer' }} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const { name, value } = payload[0];
                        return <div className="chart-tooltip"><div className="chart-tooltip-title">{name}</div><div className="chart-tooltip-row"><span className="chart-tooltip-label">Jumlah</span><span className="chart-tooltip-value">{short(value)}</span></div><div className="chart-tooltip-row"><span className="chart-tooltip-label">Porsi</span><span className="chart-tooltip-value">{pct(value, totalExp)}</span></div></div>;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expenseData.map((e, i) => (
                      <div key={i} onClick={() => setActivePie(i === activePie ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: activePie === i ? COLORS[i % COLORS.length] + '18' : 'var(--bg)', border: `1.5px solid ${activePie === i ? COLORS[i % COLORS.length] : 'transparent'}`, transition: 'all .15s' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{e.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{short(e.value)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{pct(e.value, totalExp)}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--teal-light)', border: '1.5px solid var(--teal)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Total Beban</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>{short(totalExp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Cashflow */}
            {tab === 'cashflow' && (
              <div className="anim-fadein">
                <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Laporan Arus Kas — 3 Aktivitas</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cashflow} onClick={d => d?.activePayload && setActiveBar(d.activePayload[0].payload)} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => `${v / 1e6}Jt`} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tooltip_ />} cursor={{ fill: '#F8FAFC' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="#E2E8F0" />
                    <Bar dataKey="operasional" name="Operasional" fill="#41A9A9" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="investasi"   name="Investasi"   fill="#EF4444" radius={[5, 5, 0, 0]} opacity={.85} />
                    <Bar dataKey="pendanaan"   name="Pendanaan"   fill="#3B82F6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {activeBar && (
                  <div className="anim-scalein" style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 10, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div style={{ gridColumn: '1/-1', fontWeight: 700, color: 'var(--navy)', fontSize: 13, marginBottom: 4 }}>📅 {activeBar.bulan}</div>
                    {[['Operasional', activeBar.operasional, '#41A9A9', '#EFF6F6'], ['Investasi', activeBar.investasi, '#EF4444', '#FEE2E2'], ['Pendanaan', activeBar.pendanaan, '#3B82F6', '#DBEAFE'], ['Net Cash', (activeBar.operasional || 0) + (activeBar.investasi || 0) + (activeBar.pendanaan || 0), '#10B981', '#D1FAE5']].map(([l, v, c, bg]) => (
                      <div key={l} style={{ background: bg, borderRadius: 8, padding: '9px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{short(v)}</div>
                      </div>
                    ))}
                    <button className="btn btn-sm" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, marginTop: 4 }} onClick={() => setActiveBar(null)}>✕ Tutup</button>
                  </div>
                )}

                {/* Cashflow Summary Table */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Ringkasan Arus Kas YTD</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Aktivitas</th>
                          {cashflow.map(m => <th key={m.bulan} style={{ textAlign: 'right' }}>{m.bulan}</th>)}
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[['Operasional', 'operasional', '#41A9A9'], ['Investasi', 'investasi', '#EF4444'], ['Pendanaan', 'pendanaan', '#3B82F6']].map(([label, key, color]) => {
                          const total = cashflow.reduce((s, m) => s + (m[key] || 0), 0);
                          return (
                            <tr key={key}>
                              <td style={{ fontWeight: 600, color }}>{label}</td>
                              {cashflow.map(m => <td key={m.bulan} style={{ textAlign: 'right', fontWeight: 600, color: (m[key] || 0) < 0 ? '#EF4444' : 'var(--text)' }}>{short(m[key] || 0)}</td>)}
                              <td style={{ textAlign: 'right', fontWeight: 800, color }}>{short(total)}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ borderTop: '2px solid var(--teal)' }}>
                          <td style={{ fontWeight: 800, color: 'var(--navy)' }}>Net Arus Kas</td>
                          {cashflow.map(m => {
                            const net = (m.operasional || 0) + (m.investasi || 0) + (m.pendanaan || 0);
                            return <td key={m.bulan} style={{ textAlign: 'right', fontWeight: 800, color: net >= 0 ? '#10B981' : '#EF4444' }}>{short(net)}</td>;
                          })}
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{short(cashflow.reduce((s, m) => s + (m.operasional || 0) + (m.investasi || 0) + (m.pendanaan || 0), 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

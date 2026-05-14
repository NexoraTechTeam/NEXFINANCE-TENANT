'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Search, RotateCcw, ShieldAlert } from 'lucide-react';
import { activityService } from '@/lib/api';

type ActivityLog = {
  id: string;
  userId?: string;
  userEmail?: string;
  level?: string;
  module?: string;
  action?: string;
  description?: string;
  timestamp?: string;
};

type ActivityStats = {
  total: number;
  byModule: Record<string, number>;
  byLevel: Record<string, number>;
  dailyLast7Days: Array<{ date: string; count: number }>;
};

function fmtDateTime(v?: string) {
  if (!v) return '-';
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return v;
  return dt.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getErrMsg(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return fallback;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [clearing, setClearing] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 120 };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;

      const [logsRes, statsRes] = await Promise.all([
        activityService.getLogs(params),
        activityService.getStats(),
      ]);

      setLogs(logsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
      setError('');
    } catch (err: unknown) {
      setLogs([]);
      setStats(null);
      setError(getErrMsg(err, 'Gagal memuat activity logs.'));
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const modules = useMemo(() => {
    const source = stats?.byModule ? Object.keys(stats.byModule) : logs.map((l) => l.module).filter(Boolean) as string[];
    return Array.from(new Set(source));
  }, [logs, stats]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action).filter(Boolean) as string[]));
  }, [logs]);

  const clearOldLogs = async () => {
    setClearing(true);
    try {
      const res = await activityService.clearOldLogs();
      showToast(res.data?.message || 'Log lama berhasil dibersihkan.');
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal membersihkan log lama.'), false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Log Historis</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Audit trail aktivitas user untuk monitoring dan investigasi.</p>
        </div>
        <button className="btn-secondary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }} disabled={clearing} onClick={clearOldLogs}>
          <RotateCcw size={15} /> {clearing ? 'Membersihkan...' : 'Bersihkan Log Lama'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Total Aktivitas</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{loading ? '—' : (stats?.total || logs.length)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Info</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{loading ? '—' : (stats?.byLevel?.info || 0)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Warning</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{loading ? '—' : (stats?.byLevel?.warning || 0)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Modul Tercatat</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{loading ? '—' : modules.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ position: 'relative', flex: '1 1 250px', minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', left: 11, transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari user, aksi, deskripsi..." />
          </div>
          <select className="form-select" style={{ width: 190 }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">Semua Modul</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 220 }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">Semua Aksi</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-secondary" style={{ width: 'auto' }} onClick={load}>Terapkan</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-3)' }}>Memuat activity logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-3)' }}>
            <Activity size={38} style={{ marginBottom: 8 }} />
            Tidak ada data log sesuai filter.
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Waktu', 'User', 'Level', 'Modul', 'Aksi', 'Deskripsi'].map((head) => (
                    <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id || `${log.timestamp}-${idx}`} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>{fmtDateTime(log.timestamp)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontWeight: 700 }}>{log.userEmail || '-'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{log.userId || '-'}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className={`badge ${(log.level || 'info') === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                        {log.level || 'info'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>{log.module || '-'}</td>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-neutral">{log.action || '-'}</span></td>
                    <td style={{ padding: '11px 14px' }}>{log.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, color: 'var(--text-4)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ShieldAlert size={14} />
        Aksi bersihkan log hanya diizinkan untuk role admin sesuai kebijakan backend.
      </div>
    </div>
  );
}

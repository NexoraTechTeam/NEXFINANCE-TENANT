import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { activityService } from '../services/api';
import { Activity, Search } from 'lucide-react';

const fmtDateTime = (v) => {
  if (!v) return '-';
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return v;
  return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;

      const [logsRes, statsRes] = await Promise.all([
        activityService.getLogs(params),
        activityService.getStats(),
      ]);

      setLogs(logsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
      setError('');
    } catch (e) {
      setLogs([]);
      setStats(null);
      setError(e.response?.data?.error || 'Gagal memuat activity logs.');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const modules = useMemo(() => {
    const source = stats?.byModule ? Object.keys(stats.byModule) : logs.map((l) => l.module).filter(Boolean);
    return Array.from(new Set(source));
  }, [logs, stats]);

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Activity Logs</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Audit jejak aktivitas pengguna sistem</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 13, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div className="card anim-fadeup" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Aktivitas</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? '—' : stats?.total || logs.length}</div>
          </div>
          <div className="card anim-fadeup" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Info</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? '—' : stats?.byLevel?.info || 0}</div>
          </div>
          <div className="card anim-fadeup" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Warning</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? '—' : stats?.byLevel?.warning || 0}</div>
          </div>
          <div className="card anim-fadeup" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Modul Tercatat</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{loading ? '—' : modules.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input className="input" style={{ paddingLeft: 34 }} placeholder="Cari user, aksi, deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input" style={{ flex: '0 0 220px' }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="">Semua Modul</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn btn-primary" onClick={load}>Terapkan Filter</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-3)' }}>Memuat activity logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-2)' }}>
              <Activity size={38} style={{ marginBottom: 8 }} />
              Tidak ada data log sesuai filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>User</th>
                    <th>Role/Level</th>
                    <th>Modul</th>
                    <th>Aksi</th>
                    <th>Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{fmtDateTime(log.timestamp)}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{log.userEmail || '-'}</div>
                        <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{log.userId || '-'}</div>
                      </td>
                      <td><span className={log.level === 'warning' ? 'badge badge-amber' : 'badge badge-blue'}>{log.level || 'info'}</span></td>
                      <td>{log.module || '-'}</td>
                      <td><span className="badge badge-teal">{log.action || '-'}</span></td>
                      <td>{log.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

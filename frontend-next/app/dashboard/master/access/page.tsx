'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, Save } from 'lucide-react';
import { masterService } from '@/lib/api';

type AppUser = {
  id: string;
  name?: string;
  email: string;
  role: string;
  status?: string;
};

type PermissionMatrix = Record<string, string[]>;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  bendahara: 'Bendahara',
  kabag: 'Kepala Bagian',
  staff: 'Staf',
  auditor: 'Auditor',
};

const ALL_MODULES = ['dashboard', 'spp', 'payroll', 'expenses', 'procurement', 'accounting', 'reports', 'master', 'activity', 'notifications'];

function getErrMsg(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return fallback;
}

export default function RoleAccessPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingRole, setSubmittingRole] = useState('');
  const [submittingPermissionRole, setSubmittingPermissionRole] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const currentUserRole = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { role?: string };
      return parsed.role || '';
    } catch {
      return '';
    }
  }, []);

  const currentUserId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { id?: string };
      return parsed.id || '';
    } catch {
      return '';
    }
  }, []);

  const isSuperAdmin = currentUserRole === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, permissionsRes] = await Promise.all([
        masterService.getUsers(),
        masterService.getRolePermissions(),
      ]);
      setUsers(usersRes.data?.data || usersRes.data?.users || []);
      setMatrix(permissionsRes.data?.data || {});
      setError('');
    } catch (err: unknown) {
      setUsers([]);
      setMatrix({});
      setError(getErrMsg(err, 'Gagal memuat data user dan permissions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasAccess = (role: string, module: string) => {
    const rolePermissions = matrix?.[role] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(module);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setSubmittingRole(userId);
    try {
      await masterService.updateUserRole(userId, role);
      showToast('Role user diperbarui.');
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal memperbarui role user.'), false);
    } finally {
      setSubmittingRole('');
    }
  };

  const togglePermission = async (role: string, module: string) => {
    if (!isSuperAdmin) return;
    const current = matrix?.[role] || [];
    const expanded = current.includes('*') ? [...ALL_MODULES] : [...current];
    const next = expanded.includes(module)
      ? expanded.filter((item) => item !== module)
      : [...expanded, module];
    const normalized = Array.from(new Set(next));
    const payload = normalized.length === ALL_MODULES.length ? ['*'] : normalized;

    setSubmittingPermissionRole(role);
    try {
      await masterService.updateRolePermissions(role, payload);
      setMatrix((prev) => ({ ...prev, [role]: payload }));
      showToast(`Akses role ${ROLE_LABELS[role] || role} diperbarui.`);
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal memperbarui matriks akses role.'), false);
    } finally {
      setSubmittingPermissionRole('');
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Role & Permission Management</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Kontrol role user dan akses modul. {isSuperAdmin ? 'Mode edit aktif (Super Admin).' : 'Mode read-only (khusus Super Admin untuk edit).'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Users size={17} color="var(--teal-500)" />
          <h3 style={{ margin: 0, fontSize: 17 }}>Daftar User</h3>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-3)' }}>Memuat user...</div>
        ) : users.length === 0 ? (
          <div style={{ color: 'var(--text-3)' }}>Belum ada data user.</div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Nama', 'Email', 'Role', 'Edit Role', 'Status'].map((head) => (
                    <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px' }}>{u.id}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{u.name || '-'}</td>
                    <td style={{ padding: '11px 14px' }}>{u.email}</td>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td style={{ padding: '11px 14px' }}>
                      <select
                        className="form-select"
                        style={{ minWidth: 160 }}
                        value={u.role}
                        disabled={!isSuperAdmin || submittingRole === u.id || u.id === currentUserId}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <option key={role} value={role}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className={`badge ${(u.status || 'active') === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {(u.status || 'active') === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={17} color="var(--teal-500)" />
          <h3 style={{ margin: 0, fontSize: 17 }}>Matriks Akses Role → Modul</h3>
        </div>

        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Role</th>
                {ALL_MODULES.map((module) => (
                  <th key={module} style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12, textTransform: 'capitalize' }}>
                    {module}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_LABELS).map(([role, label], idx) => (
                <tr key={role} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 700 }}>{label}</td>
                  {ALL_MODULES.map((module) => {
                    const canAccess = hasAccess(role, module);
                    return (
                      <td key={module} style={{ padding: '11px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`badge ${canAccess ? 'badge-success' : 'badge-danger'}`}
                          style={{ border: 'none', cursor: isSuperAdmin ? 'pointer' : 'default', opacity: submittingPermissionRole === role ? 0.7 : 1 }}
                          disabled={!isSuperAdmin || submittingPermissionRole === role}
                          onClick={() => togglePermission(role, module)}
                        >
                          {canAccess ? 'Bisa' : 'Tidak'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSuperAdmin && (
          <div style={{ marginTop: 12, color: 'var(--text-4)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            Klik badge pada matriks untuk toggle akses role ke modul.
          </div>
        )}
      </div>
    </div>
  );
}

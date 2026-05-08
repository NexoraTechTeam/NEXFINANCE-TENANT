import React, { useCallback, useEffect, useState } from 'react';
import { masterService } from '../services/api';
import { ROLE_PERMISSIONS } from '../config/permissions';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Users } from 'lucide-react';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  bendahara: 'Bendahara',
  kabag: 'Kepala Bagian',
  staff: 'Staff',
  auditor: 'Auditor',
};

const ALL_MODULES = ['dashboard', 'spp', 'payroll', 'expenses', 'procurement', 'accounting', 'reports', 'master', 'activity', 'notifications'];

export default function MasterAccessControl() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingRole, setSubmittingRole] = useState('');
  const [permissionMatrix, setPermissionMatrix] = useState(ROLE_PERMISSIONS);
  const [submittingPermissionRole, setSubmittingPermissionRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, permissionsRes] = await Promise.all([
        masterService.getUsers(),
        masterService.getRolePermissions(),
      ]);
      setUsers(usersRes.data?.data || []);
      setPermissionMatrix(permissionsRes.data?.data || ROLE_PERMISSIONS);
      setError('');
    } catch (e) {
      setUsers([]);
      setPermissionMatrix(ROLE_PERMISSIONS);
      setError(e.response?.data?.error || 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId, role) => {
    setSubmittingRole(userId);
    try {
      await masterService.updateUserRole(userId, role);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal memperbarui role user.');
    } finally {
      setSubmittingRole('');
    }
  };

  const hasAccess = (role, module) => {
    const rolePermissions = permissionMatrix?.[role] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(module);
  };

  const handlePermissionToggle = async (role, module) => {
    if (!isSuperAdmin) return;
    const current = permissionMatrix?.[role] || [];
    const expanded = current.includes('*') ? [...ALL_MODULES] : [...current];
    const next = expanded.includes(module)
      ? expanded.filter((item) => item !== module)
      : [...expanded, module];
    const normalized = [...new Set(next)];
    const payload = normalized.length === ALL_MODULES.length ? ['*'] : normalized;

    setSubmittingPermissionRole(role);
    try {
      await masterService.updateRolePermissions(role, payload);
      setPermissionMatrix((prev) => ({ ...prev, [role]: payload }));
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal memperbarui matriks akses role.');
    } finally {
      setSubmittingPermissionRole('');
    }
  };

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Manajemen User & Hak Akses</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Visibilitas role ke modul-menu untuk administrator</p>
          {!isSuperAdmin && (
            <p style={{ color: '#92400E', fontSize: 12, marginTop: 6 }}>
              Mode saat ini: <strong>read-only</strong>. Edit role hanya untuk Super Admin.
            </p>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 13, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Users size={18} color="var(--teal)" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Daftar User</h3>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-3)' }}>Memuat user...</div>
          ) : users.length === 0 ? (
            <div style={{ color: 'var(--text-2)' }}>Belum ada data user.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    {isSuperAdmin && <th>Edit Role</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td style={{ fontWeight: 700 }}>{u.name || '-'}</td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-teal">{ROLE_LABELS[u.role] || u.role}</span></td>
                      {isSuperAdmin && (
                        <td>
                          <select
                            className="input"
                            style={{ minWidth: 160, padding: '6px 10px', fontSize: 12 }}
                            value={u.role}
                            disabled={submittingRole === u.id || u.id === user?.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            {Object.keys(ROLE_LABELS).map((role) => (
                              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td><span className={u.status === 'active' ? 'badge badge-green' : 'badge badge-red'}>{u.status || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={18} color="var(--teal)" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Matriks Akses Role → Menu</h3>
          </div>
          {!isSuperAdmin && (
            <p style={{ color: '#92400E', fontSize: 12, marginBottom: 10 }}>
              Mode saat ini: <strong>read-only</strong>. Edit matriks akses hanya untuk Super Admin.
            </p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  {ALL_MODULES.map((m) => <th key={m}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(ROLE_LABELS).map((role) => {
                  return (
                    <tr key={role}>
                      <td style={{ fontWeight: 700 }}>{ROLE_LABELS[role] || role}</td>
                      {ALL_MODULES.map((module) => (
                        <td key={module}>
                          <button
                            type="button"
                            className={`badge ${hasAccess(role, module) ? 'badge-green' : 'badge-red'}`}
                            style={{ border: 'none', cursor: isSuperAdmin ? 'pointer' : 'default', opacity: submittingPermissionRole === role ? 0.7 : 1 }}
                            disabled={!isSuperAdmin || submittingPermissionRole === role}
                            onClick={() => handlePermissionToggle(role, module)}
                          >
                            {hasAccess(role, module) ? 'Bisa' : 'Tidak'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

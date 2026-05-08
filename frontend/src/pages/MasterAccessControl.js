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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getUsers();
      setUsers(res.data?.data || []);
      setError('');
    } catch (e) {
      setUsers([]);
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
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  {ALL_MODULES.map((m) => <th key={m}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(ROLE_PERMISSIONS).map((role) => {
                  const perms = ROLE_PERMISSIONS[role];
                  return (
                    <tr key={role}>
                      <td style={{ fontWeight: 700 }}>{ROLE_LABELS[role] || role}</td>
                      {ALL_MODULES.map((module) => (
                        <td key={module}>
                          {perms.includes('*') || perms.includes(module) ? (
                            <span className="badge badge-green">Bisa</span>
                          ) : (
                            <span className="badge badge-red">Tidak</span>
                          )}
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

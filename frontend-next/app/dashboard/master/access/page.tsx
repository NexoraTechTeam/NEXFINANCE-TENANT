'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, Save, Plus, Pencil, Trash2, X } from 'lucide-react';
import { masterService } from '@/lib/api';

type AppUser = {
  id: string;
  name?: string;
  email: string;
  role: string;
  status?: string;
};

type PermissionMatrix = Record<string, string[]>;
type UserForm = { name: string; email: string; password: string; role: string; status: string };

const EMPTY_USER_FORM: UserForm = { name: '', email: '', password: '', role: 'staff', status: 'active' };

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
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);

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
      const usersRes = await masterService.getUsers();
      const permissionsRes = isSuperAdmin ? await masterService.getRolePermissions() : null;
      setUsers(usersRes.data?.data || usersRes.data?.users || []);
      setMatrix(permissionsRes?.data?.data || {});
      setError('');
    } catch (err: unknown) {
      setUsers([]);
      setMatrix({});
      setError(getErrMsg(err, 'Gagal memuat data user dan permissions.'));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

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

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ ...EMPTY_USER_FORM });
    setUserFormOpen(true);
  };

  const openEditUser = (user: AppUser) => {
    setEditingUser(user);
    setUserForm({ name: user.name || '', email: user.email, password: '', role: user.role, status: user.status || 'active' });
    setUserFormOpen(true);
  };

  const closeUserForm = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserFormOpen(false);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingUser(true);
    try {
      if (editingUser) {
        const payload = { name: userForm.name, email: userForm.email, status: userForm.status, ...(isSuperAdmin ? { role: userForm.role } : {}) };
        await masterService.updateUser(editingUser.id, payload);
        showToast('Data user diperbarui.');
      } else {
        await masterService.createUser({ name: userForm.name, email: userForm.email, password: userForm.password, ...(isSuperAdmin ? { role: userForm.role } : {}) });
        showToast('User baru ditambahkan.');
      }
      closeUserForm();
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menyimpan user.'), false);
    } finally {
      setSavingUser(false);
    }
  };

  const deactivateUser = async (user: AppUser) => {
    if (user.id === currentUserId || !window.confirm(`Nonaktifkan ${user.name || user.email}?`)) return;
    try {
      await masterService.deleteUser(user.id);
      showToast('User dinonaktifkan.');
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menonaktifkan user.'), false);
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

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Role & Permission Management</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Kontrol role user dan akses modul.{' '}
            {isSuperAdmin ? 'Mode edit aktif (Super Admin).' : 'Mode read-only (khusus Super Admin untuk edit).'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* User list — responsive table with overflow scroll */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={17} color="var(--teal-500)" />
          <h3 style={{ margin: 0, fontSize: 17 }}>Daftar User</h3>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreateUser}><Plus size={16} /> Tambah user</button>
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
                  {/* ID hidden on mobile */}
                  <th className="col-hide-mobile" style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Nama</th>
                  <th className="col-hide-tablet" style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Email</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Role</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Edit Role</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                    <td className="col-hide-mobile" style={{ padding: '11px 14px' }}>{u.id}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{u.name || '-'}</td>
                    <td className="col-hide-tablet" style={{ padding: '11px 14px' }}>{u.email}</td>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td style={{ padding: '11px 14px' }}>
                      <select
                        className="form-select access-role-select"
                        style={{ minWidth: 140 }}
                        value={u.role}
                        disabled={!isSuperAdmin || submittingRole === u.id || u.id === currentUserId}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <option key={role} value={role}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => openEditUser(u)} style={{ marginRight: 6 }}><Pencil size={14} /> Edit</button>
                      <button type="button" className="btn btn-danger" disabled={u.id === currentUserId || (u.status || 'active') === 'inactive'} onClick={() => deactivateUser(u)}><Trash2 size={14} /> Nonaktifkan</button>
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

      {/* Permission matrix — always horizontal scroll, compact module headers */}
      {isSuperAdmin && <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={17} color="var(--teal-500)" />
          <h3 style={{ margin: 0, fontSize: 17 }}>Matriks Akses Role → Modul</h3>
        </div>

        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-3)',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  background: '#f8fafc',
                  zIndex: 1,
                }}>
                  Role
                </th>
                {ALL_MODULES.map((module) => (
                  <th key={module} style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-3)',
                    fontSize: 11,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {module}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_LABELS).map(([role, label], idx) => (
                <tr key={role} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                  <td style={{
                    padding: '11px 14px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    left: 0,
                    background: idx % 2 ? '#fbfcfd' : '#fff',
                    zIndex: 1,
                  }}>
                    {label}
                  </td>
                  {ALL_MODULES.map((module) => {
                    const canAccess = hasAccess(role, module);
                    return (
                      <td key={module} style={{ padding: '11px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`badge ${canAccess ? 'badge-success' : 'badge-danger'}`}
                          style={{
                            border: 'none',
                            cursor: isSuperAdmin ? 'pointer' : 'default',
                            opacity: submittingPermissionRole === role ? 0.7 : 1,
                            transition: 'opacity 160ms ease, transform 120ms ease',
                          }}
                          disabled={!isSuperAdmin || submittingPermissionRole === role}
                          onClick={() => togglePermission(role, module)}
                          aria-label={`${canAccess ? 'Cabut' : 'Beri'} akses ${label} ke modul ${module}`}
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
      </div>}

      {userFormOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }}>
          <form onSubmit={saveUser} className="card" style={{ width: 'min(520px, 100%)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 20 }}>{editingUser ? 'Edit user' : 'Tambah user'}</h2><button type="button" className="btn btn-secondary" onClick={closeUserForm}><X size={16} /></button></div>
            <label className="form-label">Nama<input required className="form-input" value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
            <label className="form-label">Email<input required type="email" className="form-input" value={userForm.email} onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))} /></label>
            {!editingUser && <label className="form-label">Password awal<input required minLength={8} type="password" className="form-input" value={userForm.password} onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))} /></label>}
            {isSuperAdmin && <label className="form-label">Role<select className="form-select" value={userForm.role} onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}>{Object.entries(ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select></label>}
            {editingUser && <label className="form-label">Status<select className="form-select" value={userForm.status} onChange={(event) => setUserForm((prev) => ({ ...prev, status: event.target.value }))}><option value="active">Aktif</option><option value="inactive">Tidak aktif</option></select></label>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}><button type="button" className="btn btn-secondary" onClick={closeUserForm}>Batal</button><button disabled={savingUser} className="btn btn-primary" type="submit">{savingUser ? 'Menyimpan…' : 'Simpan'}</button></div>
          </form>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 640px) {
          .access-role-select {
            min-width: 120px !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { masterService } from '../services/api';
import { Users, UserCheck, UserX, Plus, Edit2, Trash2, Search, X, Briefcase } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  position: 'Guru',
  baseSalary: '',
  certificationAllowance: '',
  familyAllowance: '',
  status: 'active',
};

const IDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function MasterEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getEmployees();
      setEmployees(res.data?.data || []);
      setError('');
    } catch (e) {
      setEmployees([]);
      setError(e.response?.data?.error || 'Gagal memuat data karyawan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const openEdit = (employee) => {
    setEditTarget(employee);
    setForm({
      name: employee.name || '',
      position: employee.position || 'Guru',
      baseSalary: employee.baseSalary || '',
      certificationAllowance: employee.certificationAllowance || '',
      familyAllowance: employee.familyAllowance || '',
      status: employee.status || 'active',
    });
    setModal('edit');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.position || !form.baseSalary) {
      return showToast('Nama, jabatan, dan gaji pokok wajib diisi.', false);
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        baseSalary: Number(form.baseSalary),
        certificationAllowance: Number(form.certificationAllowance || 0),
        familyAllowance: Number(form.familyAllowance || 0),
      };
      if (modal === 'create') {
        await masterService.createEmployee(payload);
        showToast('Karyawan berhasil ditambahkan.');
      } else {
        await masterService.updateEmployee(editTarget.id, payload);
        showToast('Data karyawan berhasil diperbarui.');
      }
      setModal(null);
      await load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal menyimpan data karyawan.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await masterService.deleteEmployee(deleteTarget.id);
      showToast(`Karyawan "${deleteTarget.name}" dinonaktifkan.`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal menghapus data karyawan.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return e.name?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q);
  });

  const activeCount = employees.filter((e) => e.status === 'active').length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      {toast && (
        <div className={`toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Master Data Karyawan</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Kelola guru, TU, dan staf sekolah</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Karyawan</button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 13, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Karyawan', value: employees.length, icon: Users, color: 'var(--teal)', bg: '#EFF6F6' },
            { label: 'Aktif', value: activeCount, icon: UserCheck, color: 'var(--green)', bg: '#D1FAE5' },
            { label: 'Tidak Aktif', value: inactiveCount, icon: UserX, color: 'var(--red)', bg: '#FEE2E2' },
            { label: 'Total Payroll Dasar', value: IDR(employees.reduce((s, e) => s + Number(e.baseSalary || 0), 0)), icon: Briefcase, color: 'var(--blue)', bg: '#DBEAFE' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card anim-fadeup" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{loading ? '—' : c.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 34 }} placeholder="Cari nama/jabatan/ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-3)' }}>Memuat data karyawan...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text-2)' }}>Tidak ada data karyawan.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    {['ID', 'Nama', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Status', 'Aksi'].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td><span style={{ background: '#EFF6F6', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{e.id}</span></td>
                      <td style={{ fontWeight: 700 }}>{e.name}</td>
                      <td>{e.position}</td>
                      <td style={{ fontWeight: 700, color: 'var(--teal)' }}>{IDR(e.baseSalary)}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                        Sertif: {IDR(e.certificationAllowance)}<br />
                        Keluarga: {IDR(e.familyAllowance)}
                      </td>
                      <td><span className={e.status === 'active' ? 'badge-teal' : 'badge-red'}>{e.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => openEdit(e)} style={{ padding: '5px 9px' }}><Edit2 size={13} /></button>
                          <button className="btn btn-sm" onClick={() => setDeleteTarget(e)} style={{ padding: '5px 9px', background: '#FEE2E2', color: 'var(--red)', border: 'none' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{modal === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Nama <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Jabatan <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Gaji Pokok <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="input" type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Tunjangan Sertifikasi</label>
                <input className="input" type="number" value={form.certificationAllowance} onChange={(e) => setForm({ ...form, certificationAllowance: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Tunjangan Keluarga</label>
                <input className="input" type="number" value={form.familyAllowance} onChange={(e) => setForm({ ...form, familyAllowance: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Menyimpan...' : modal === 'create' ? 'Tambah Karyawan' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: 8 }}>Nonaktifkan karyawan?</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>{deleteTarget.name} ({deleteTarget.id}) akan ditandai tidak aktif.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Briefcase } from 'lucide-react';
import { masterService } from '@/lib/api';

type Employee = {
  id: string;
  nip: string;
  name: string;
  position: string;
  department?: string;
  baseSalary?: number;
  certificationAllowance?: number;
  familyAllowance?: number;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
};

const POSITIONS = ['Guru', 'Staf Tata Usaha', 'Kepala Sekolah', 'Operator', 'Bendahara'];
const EMPTY_FORM = {
  nip: '',
  name: '',
  position: 'Guru',
  department: 'Akademik',
  baseSalary: '',
  certificationAllowance: '',
  familyAllowance: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
};

function getErrMsg(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return fallback;
}

export default function MasterEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterService.getEmployees();
      setEmployees(res.data?.data || res.data?.employees || []);
      setError('');
    } catch (err: unknown) {
      setEmployees([]);
      setError(getErrMsg(err, 'Gagal memuat data karyawan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return employees.filter((item) => {
      const q = search.toLowerCase();
      const matchQ = !q || item.name?.toLowerCase().includes(q) || item.nip?.toLowerCase().includes(q);
      const matchPos = positionFilter === 'all' || item.position === positionFilter;
      const matchStatus = statusFilter === 'all' || (item.status || 'active') === statusFilter;
      return matchQ && matchPos && matchStatus;
    });
  }, [employees, search, statusFilter, positionFilter]);

  const activeCount = employees.filter((s) => (s.status || 'active') === 'active').length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModal('create');
  };

  const openEdit = (target: Employee) => {
    setEditTarget(target);
    setForm({
      nip: target.nip || '',
      name: target.name || '',
      position: target.position || 'Guru',
      department: target.department || 'Akademik',
      baseSalary: String(target.baseSalary ?? ''),
      certificationAllowance: String(target.certificationAllowance ?? ''),
      familyAllowance: String(target.familyAllowance ?? ''),
      phone: target.phone || '',
      email: target.email || '',
      address: target.address || '',
      status: target.status || 'active',
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.nip || !form.name || !form.position || !form.baseSalary) {
      showToast('NIP, nama, jabatan, dan gaji pokok wajib diisi.', false);
      return;
    }
    const payload = {
      ...form,
      baseSalary: Number(form.baseSalary),
      certificationAllowance: Number(form.certificationAllowance || 0),
      familyAllowance: Number(form.familyAllowance || 0),
    };
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await masterService.createEmployee(payload);
        showToast('Karyawan berhasil ditambahkan.');
      } else if (editTarget) {
        await masterService.updateEmployee(editTarget.id, payload);
        showToast('Data karyawan diperbarui.');
      }
      setModal(null);
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menyimpan data karyawan.'), false);
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await masterService.deleteEmployee(deleteTarget.id);
      showToast(`Karyawan ${deleteTarget.name} dinonaktifkan.`);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menonaktifkan karyawan.'), false);
    } finally {
      setSubmitting(false);
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Master Data Karyawan</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Kelola staf, jabatan, departemen, dan status aktif.</p>
        </div>
        <button className="btn-teal" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, paddingInline: 18 }} onClick={openCreate}>
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Total Karyawan</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{employees.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Karyawan Aktif</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{activeCount}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ position: 'relative', flex: '1 1 230px', minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', left: 11, transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Cari nama/NIP..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <select className="form-select" style={{ width: 200 }} value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="all">Semua Jabatan</option>
            {POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-3)' }}>Memuat data karyawan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-3)' }}>
            <Briefcase size={36} style={{ marginBottom: 8 }} />
            Tidak ada data sesuai filter.
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['NIP', 'Nama', 'Jabatan', 'Gaji Pokok', 'No. HP', 'Status', 'Aksi'].map((head) => (
                    <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{item.nip}</span></td>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{item.name}</td>
                    <td style={{ padding: '11px 14px' }}>{item.position}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(item.baseSalary || 0))}
                    </td>
                    <td style={{ padding: '11px 14px' }}>{item.phone || '-'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className={`badge ${(item.status || 'active') === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {(item.status || 'active') === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '7px 10px', minHeight: 36 }} onClick={() => openEdit(item)}><Edit2 size={13} /></button>
                        <button className="btn-secondary" style={{ padding: '7px 10px', minHeight: 36, color: '#dc2626' }} onClick={() => setDeleteTarget(item)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>{modal === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan'}</h3>
              <button className="btn-secondary" style={{ minHeight: 34, padding: 8 }} onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">NIP</label>
                <input className="form-input" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Jabatan</label>
                <select className="form-select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  {POSITIONS.map((position) => <option key={position}>{position}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nama Karyawan</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Departemen</label>
                <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Gaji Pokok</label>
                <input className="form-input" type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Tunjangan Sertifikasi</label>
                <input className="form-input" type="number" value={form.certificationAllowance} onChange={(e) => setForm({ ...form, certificationAllowance: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Tunjangan Keluarga</label>
                <input className="form-input" type="number" value={form.familyAllowance} onChange={(e) => setForm({ ...form, familyAllowance: e.target.value })} />
              </div>
              <div>
                <label className="form-label">No. HP</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Alamat</label>
                <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setModal(null)}>Batal</button>
              <button className="btn-teal" style={{ width: 'auto', paddingInline: 18 }} disabled={submitting} onClick={save}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Nonaktifkan karyawan?</h3>
            <p style={{ color: 'var(--text-3)' }}>{deleteTarget.name} ({deleteTarget.nip}) akan ditandai tidak aktif.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-secondary" style={{ color: '#dc2626' }} disabled={submitting} onClick={deactivate}>
                {submitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

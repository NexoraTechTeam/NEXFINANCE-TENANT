'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users } from 'lucide-react';
import { masterService } from '@/lib/api';

type Student = {
  id: string;
  nis: string;
  name: string;
  class: string;
  parentName?: string;
  guardianName?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
};

const CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B'];
const EMPTY_FORM = {
  nis: '',
  name: '',
  class: '7A',
  parentName: '',
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

export default function MasterStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
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
      const res = await masterService.getStudents();
      setStudents(res.data?.data || res.data?.students || []);
      setError('');
    } catch (err: unknown) {
      setStudents([]);
      setError(getErrMsg(err, 'Gagal memuat data siswa.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return students.filter((item) => {
      const q = search.toLowerCase();
      const matchQ = !q || item.name?.toLowerCase().includes(q) || item.nis?.toLowerCase().includes(q);
      const matchClass = classFilter === 'all' || item.class === classFilter;
      const matchStatus = statusFilter === 'all' || (item.status || 'active') === statusFilter;
      return matchQ && matchClass && matchStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  const activeCount = students.filter((s) => (s.status || 'active') === 'active').length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModal('create');
  };

  const openEdit = (target: Student) => {
    setEditTarget(target);
    setForm({
      nis: target.nis || '',
      name: target.name || '',
      class: target.class || '7A',
      parentName: target.parentName || target.guardianName || '',
      phone: target.phone || '',
      email: target.email || '',
      address: target.address || '',
      status: target.status || 'active',
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.nis || !form.name || !form.class) {
      showToast('NIS, nama, dan kelas wajib diisi.', false);
      return;
    }
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await masterService.createStudent(form);
        showToast('Siswa berhasil ditambahkan.');
      } else if (editTarget) {
        await masterService.updateStudent(editTarget.id, form);
        showToast('Data siswa diperbarui.');
      }
      setModal(null);
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menyimpan data siswa.'), false);
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await masterService.deleteStudent(deleteTarget.id);
      showToast(`Siswa ${deleteTarget.name} dinonaktifkan.`);
      setDeleteTarget(null);
      await load();
    } catch (err: unknown) {
      showToast(getErrMsg(err, 'Gagal menonaktifkan siswa.'), false);
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Master Data Siswa</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Kelola murid aktif/non-aktif, profil, dan pencarian cepat.</p>
        </div>
        <button className="btn-teal" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, paddingInline: 18 }} onClick={openCreate}>
          <Plus size={16} /> Tambah Siswa
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Total Siswa</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{students.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Siswa Aktif</div>
          <div style={{ marginTop: 5, fontSize: 24, fontWeight: 800 }}>{activeCount}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ position: 'relative', flex: '1 1 230px', minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', top: '50%', left: 11, transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Cari nama/NIS..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <select className="form-select" style={{ width: 170 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">Semua Kelas</option>
            {CLASSES.map((cls) => <option key={cls} value={cls}>Kelas {cls}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-3)' }}>Memuat data siswa...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-3)' }}>
            <Users size={36} style={{ marginBottom: 8 }} />
            Tidak ada data sesuai filter.
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['NIS', 'Nama', 'Kelas', 'Wali', 'No. HP', 'Status', 'Aksi'].map((head) => (
                    <th key={head} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 ? '#fbfcfd' : '#fff', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px' }}><span className="badge badge-info">{item.nis}</span></td>
                    <td style={{ padding: '11px 14px', fontWeight: 700 }}>{item.name}</td>
                    <td style={{ padding: '11px 14px' }}>{item.class}</td>
                    <td style={{ padding: '11px 14px' }}>{item.parentName || item.guardianName || '-'}</td>
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
              <h3 style={{ margin: 0, fontSize: 20 }}>{modal === 'create' ? 'Tambah Siswa' : 'Edit Siswa'}</h3>
              <button className="btn-secondary" style={{ minHeight: 34, padding: 8 }} onClick={() => setModal(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">NIS</label>
                <input className="form-input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Kelas</label>
                <select className="form-select" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  {CLASSES.map((cls) => <option key={cls}>{cls}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Nama Siswa</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Nama Wali</label>
                <input className="form-input" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
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
            <h3 style={{ marginTop: 0 }}>Nonaktifkan siswa?</h3>
            <p style={{ color: 'var(--text-3)' }}>{deleteTarget.name} ({deleteTarget.nis}) akan ditandai tidak aktif.</p>
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

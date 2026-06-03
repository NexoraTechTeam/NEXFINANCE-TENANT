import React, { useState, useEffect, useCallback } from 'react';
import { masterService } from '../services/api';
import { Users, Plus, Edit2, Trash2, Search, X, BookOpen, UserCheck, UserX, LayoutGrid } from 'lucide-react';

const CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B'];

const EMPTY_FORM = {
  nis: '', name: '', class: '7A', parentName: '', phone: '', email: '', address: '', status: 'active',
};

export default function MasterStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
      const res = await masterService.getStudents();
      setStudents(res.data?.data || []);
      setError('');
    } catch (e) {
      setStudents([]);
      setError(e.response?.data?.error || 'Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModal('create');
  };

  const openEdit = (student) => {
    setForm({
      nis: student.nis || '',
      name: student.name || '',
      class: student.class || '7A',
      parentName: student.parentName || student.guardianName || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      status: student.status || 'active',
    });
    setEditTarget(student);
    setModal('edit');
  };

  const handleSubmit = async () => {
    if (!form.nis || !form.name || !form.class) {
      return showToast('NIS, Nama Siswa, dan Kelas wajib diisi.', false);
    }
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await masterService.createStudent(form);
        showToast('Siswa berhasil ditambahkan!');
      } else {
        await masterService.updateStudent(editTarget.id, form);
        showToast('Data siswa berhasil diperbarui!');
      }
      await load();
      setModal(null);
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal menyimpan data.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await masterService.deleteStudent(deleteTarget.id);
      showToast(`Siswa "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      showToast(e.response?.data?.error || 'Gagal menghapus data.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = students.filter(s => s.status === 'active').length;
  const inactiveCount = students.filter(s => s.status !== 'active').length;

  const filtered = students.filter(s => {
    const matchClass = filterClass === 'all' || s.class === filterClass;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.nis?.includes(search);
    return matchClass && matchStatus && matchSearch;
  });

  const classCounts = CLASSES.reduce((acc, cls) => {
    acc[cls] = students.filter(s => s.class === cls).length;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total Siswa', value: students.length, icon: Users, color: 'var(--teal)', bg: '#EFF6F6', filter: 'all' },
    { label: 'Aktif', value: activeCount, icon: UserCheck, color: 'var(--green)', bg: '#D1FAE5', filter: 'active' },
    { label: 'Tidak Aktif', value: inactiveCount, icon: UserX, color: 'var(--red)', bg: '#FEE2E2', filter: 'inactive' },
    { label: 'Jumlah Kelas', value: CLASSES.length, icon: LayoutGrid, color: 'var(--blue)', bg: '#DBEAFE', filter: 'all' },
  ];

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 20px' }}>
      {toast && (
        <div className="toast" style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1100,
          background: toast.ok ? 'var(--green)' : 'var(--red)',
          color: '#fff', padding: '13px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="grad-text" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Master Data Siswa</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Kelola data siswa Yayasan ISAk 35</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>

        {/* Stats */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 13, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        {/* Stats */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {statCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="card anim-fadeup card-hover" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setStatusFilter(c.filter)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{loading ? '—' : c.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{c.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-class strip */}
        {!loading && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {CLASSES.map(cls => (
              <div key={cls} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--teal)' }}>Kelas {cls}</span>
                <span style={{ background: 'var(--bg)', color: 'var(--text-2)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{classCounts[cls] || 0}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter + Search */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 34 }}
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all', 'Semua Status'], ['active', 'Aktif'], ['inactive', 'Tidak Aktif']].map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-sm ${statusFilter === val ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setStatusFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all', 'Semua Kelas'], ...CLASSES.map(c => [c, `Kelas ${c}`])].map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-sm ${filterClass === val ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilterClass(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Memuat data siswa...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <BookOpen size={44} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
              <div style={{ color: 'var(--text-2)', fontWeight: 600, marginBottom: 4 }}>
                {search || filterClass !== 'all' ? 'Tidak ada siswa yang sesuai filter.' : 'Belum ada data siswa.'}
              </div>
              {!search && filterClass === 'all' && (
                <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Klik "Tambah Siswa" untuk menambahkan data pertama.</div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {['NIS', 'Nama Siswa', 'Kelas', 'Nama Wali', 'No. HP', 'Status', 'Aksi'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span style={{ background: '#EFF6F6', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                          {s.nis}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</td>
                      <td>
                        <span style={{ background: 'var(--bg)', color: 'var(--text-2)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                          {s.class}
                        </span>
                      </td>
                       <td style={{ color: 'var(--text-2)' }}>{s.parentName || s.guardianName || '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{s.phone || '—'}</td>
                      <td>
                        <span className={s.status === 'active' ? 'badge-teal' : 'badge-red'}>
                          {s.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => openEdit(s)}
                            title="Edit"
                            style={{ padding: '5px 9px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => setDeleteTarget(s)}
                            title="Hapus"
                            style={{ padding: '5px 9px', background: '#FEE2E2', color: 'var(--red)', border: 'none' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
                Menampilkan {filtered.length} dari {students.length} siswa
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah / Edit */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {modal === 'create' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)} style={{ padding: '4px 8px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
                  NIS <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input className="input" placeholder="2024001" value={form.nis} onChange={e => setForm({ ...form, nis: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
                  Kelas <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <select className="input" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
                  Nama Siswa <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input className="input" placeholder="Ahmad Fauzi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Nama Wali</label>
                <input className="input" placeholder="Bapak/Ibu..." value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>No. Telepon</label>
                <input className="input" placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Email</label>
                <input className="input" type="email" placeholder="siswa@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Alamat</label>
                <textarea className="input" rows={2} placeholder="Jl. ..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {submitting ? 'Menyimpan...' : modal === 'create' ? <><Plus size={15} /> Tambah Siswa</> : <><Edit2 size={15} /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={24} color="var(--red)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Hapus Data Siswa?</h3>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 4 }}>
                Anda akan menghapus data siswa:
              </p>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{deleteTarget.name} — {deleteTarget.nis}</p>
              <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 8 }}>Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button
                className="btn"
                onClick={handleDelete}
                disabled={submitting}
                style={{ background: 'var(--red)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

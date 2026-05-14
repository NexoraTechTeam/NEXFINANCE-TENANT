'use client';

import { useState, useEffect, useCallback } from 'react';
import { accountingService } from '@/lib/api';
import { BookOpen, Plus, List, X } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const normalBalanceByType: Record<string, 'Debit' | 'Kredit'> = {
  Asset: 'Debit',
  Expense: 'Debit',
  Liability: 'Kredit',
  Equity: 'Kredit',
  Revenue: 'Kredit',
};

type AccountItem = { code: string; name: string; type: string; normalBalance: 'Debit' | 'Kredit' };
type JournalItem = {
  id: string;
  date?: string;
  description?: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
};

export default function AccountingPage() {
  const [accounts, setAccounts]   = useState<AccountItem[]>([]);
  const [journals, setJournals]   = useState<JournalItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'coa'|'journal'>('journal');
  const [modal, setModal]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null);
  const [form, setForm]           = useState({ description:'', debitAccount:'', creditAccount:'', amount:'' });

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try {
      const [coaRes, jRes] = await Promise.all([accountingService.getChartOfAccounts(), accountingService.getJournals()]);

      const rawAccounts = coaRes.data?.accounts || {};
      const normalizedAccounts: AccountItem[] = Array.isArray(rawAccounts)
        ? rawAccounts.map((acc: any) => ({
            code: String(acc.code || ''),
            name: String(acc.name || '-'),
            type: String(acc.type || '-'),
            normalBalance: acc.normalBalance === 'Debit' ? 'Debit' : 'Kredit',
          }))
        : Object.entries(rawAccounts).map(([code, acc]: [string, any]) => ({
            code,
            name: String(acc?.name || '-'),
            type: String(acc?.type || '-'),
            normalBalance: acc?.normalBalance === 'Debit'
              ? 'Debit'
              : (normalBalanceByType[String(acc?.type || '')] || 'Kredit'),
          }));

      const rawJournals = jRes.data?.journals || [];
      const normalizedJournals: JournalItem[] = (Array.isArray(rawJournals) ? rawJournals : []).map((j: any) => ({
        id: String(j.id || '-'),
        date: j.date,
        description: j.description || '-',
        debitAccount: j.debitAccount || `${j.debit?.account || ''}${j.debit?.name ? ` — ${j.debit?.name}` : ''}` || '-',
        creditAccount: j.creditAccount || `${j.credit?.account || ''}${j.credit?.name ? ` — ${j.credit?.name}` : ''}` || '-',
        amount: Number(j.amount ?? j.debit?.amount ?? j.credit?.amount ?? 0),
      }));

      setAccounts(normalizedAccounts);
      setJournals(normalizedJournals);
    } catch { setAccounts([]); setJournals([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.debitAccount || !form.creditAccount) return showToast('Lengkapi semua field.', false);
    setSubmitting(true);
    try {
      const debit = accounts.find((acc) => acc.code === form.debitAccount);
      const credit = accounts.find((acc) => acc.code === form.creditAccount);

      await accountingService.createJournal({
        date: new Date().toISOString().split('T')[0],
        description: form.description,
        debit: { account: form.debitAccount, name: debit?.name || form.debitAccount, amount: Number(form.amount) },
        credit: { account: form.creditAccount, name: credit?.name || form.creditAccount, amount: Number(form.amount) },
      });

      await load();
      setModal(false);
      setForm({ description:'', debitAccount:'', creditAccount:'', amount:'' });
      showToast('Jurnal berhasil dibuat!');
    }
    catch (e: any) { showToast(e.response?.data?.error || 'Gagal membuat jurnal.', false); }
    finally { setSubmitting(false); }
  };

  const totalDebit  = journals.reduce((s, j) => s + (j.amount || 0), 0);
  const totalCredit = journals.reduce((s, j) => s + (j.amount || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>Akuntansi</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Jurnal umum &amp; chart of accounts</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, #319ea9, #278a94)',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', minHeight: 44,
            boxShadow: '0 4px 14px rgba(49,158,169,0.30)',
          }}
        >
          <Plus size={17} strokeWidth={2} /> Tambah Jurnal
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Akun',   value: accounts.length,  color: '#319ea9', icon: BookOpen },
          { label: 'Total Jurnal', value: journals.length,  color: '#3B82F6', icon: List },
          { label: 'Total Debit',  value: fmt(totalDebit),  color: '#10B981', icon: Plus },
          { label: 'Total Kredit', value: fmt(totalCredit), color: '#F59E0B', icon: Plus },
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card anim-fadeup" style={{ padding: '18px 20px', borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity: 0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar">
        {([['journal','Jurnal Umum'],['coa','Chart of Accounts']] as [string,string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val as 'coa'|'journal')}
            className={`tab-btn${tab === val ? ' tab-btn-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card anim-fadeup" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-4)', fontSize: 15 }}>
            Memuat data...
          </div>
        ) : tab === 'journal' ? (
          journals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.35, display: 'block', margin: '0 auto 12px' }} strokeWidth={1.4} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Belum ada jurnal</div>
              <div style={{ fontSize: 14 }}>Tambah jurnal pertama untuk memulai pencatatan.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['ID','Tanggal','Deskripsi','Akun Debit','Akun Kredit','Jumlah'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {journals.map((j, i) => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 120ms' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: '#f0fafb', color: '#319ea9', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{j.id}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{j.date ? new Date(j.date).toLocaleDateString('id-ID') : '-'}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{j.description}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: '#f0fdf4', color: '#059669', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{j.debitAccount || '-'}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: '#fff5f5', color: '#dc2626', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{j.creditAccount || '-'}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(j.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.35, display: 'block', margin: '0 auto 12px' }} strokeWidth={1.4} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Belum ada akun</div>
              <div style={{ fontSize: 14 }}>Chart of accounts masih kosong.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Kode Akun','Nama Akun','Tipe','Saldo Normal'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, i) => (
                    <tr key={acc.code} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 120ms' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: '#f0fafb', color: '#319ea9', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{acc.code}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{acc.name}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-2)', fontSize: 14 }}>{acc.type}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span className={`badge ${acc.normalBalance === 'Debit' ? 'badge-success' : 'badge-danger'}`}>
                          {acc.normalBalance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box anim-fadeup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>Tambah Jurnal</div>
                <div style={{ fontSize: 13, color: 'var(--text-4)' }}>Isi detail entri jurnal baru</div>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{ background: '#f4f6f8', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 160ms' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {([
                ['Deskripsi',    'description',   'text',   'Pembayaran gaji bulan Mei'],
                ['Akun Debit',   'debitAccount',  'select', ''],
                ['Akun Kredit',  'creditAccount', 'select', ''],
                ['Jumlah (Rp)',  'amount',        'number', ''],
              ] as [string,string,'text'|'select'|'number',string][]).map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="form-label">
                    {label} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  {type === 'select' ? (
                    <select
                      value={(form as any)[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Pilih akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      placeholder={ph}
                      value={(form as any)[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className="form-input"
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(false)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '11px 24px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #319ea9, #278a94)',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', minHeight: 44,
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(49,158,169,0.28)',
                  transition: 'opacity 160ms',
                }}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Jurnal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

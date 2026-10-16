'use client';

import { useState, useEffect, useCallback } from 'react';
import OpeningBalanceForm from '@/components/accounting/OpeningBalanceForm';
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
  const [openingOpen, setOpeningOpen] = useState(false);
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
      {/* Responsive overrides */}
      <style jsx global>{`
        /* ── Accounting page responsive ── */
        @media (max-width: 768px) {
          .acct-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .acct-page-header .acct-header-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .acct-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .acct-tab-bar {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            white-space: nowrap !important;
            padding-bottom: 2px !important;
            scrollbar-width: none;
          }
          .acct-tab-bar::-webkit-scrollbar { display: none; }
          .acct-modal-btn-row {
            flex-direction: column !important;
          }
          .acct-modal-btn-row button,
          .acct-modal-btn-row a {
            width: 100% !important;
            justify-content: center !important;
          }
          .acct-journal-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .acct-stat-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── ISAK35 section header accent ── */
        .isak35-section-header {
          border-left: 3px solid var(--brand-500);
          padding-left: 12px;
        }

        /* ── Table min-width ensures scrollability ── */
        .acct-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }
        .acct-table-wrapper table {
          min-width: 560px;
        }

        /* ── Action buttons hover ── */
        .acct-action-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .acct-action-btn {
          transition: opacity 160ms, transform 160ms;
          cursor: pointer;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.ok ? 'toast-success' : 'toast-error'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header acct-page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>
            Akuntansi
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Jurnal umum &amp; chart of accounts — ISAK 35</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="acct-action-btn acct-header-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', minHeight: 44,
            boxShadow: '0 4px 14px rgb(var(--brand-500-rgb) / 0.30)',
          }}
        >
          <Plus size={17} strokeWidth={2} /> Tambah Jurnal
        </button>
        <button type="button" className="btn-secondary acct-header-btn" onClick={() => setOpeningOpen(true)}>
          Saldo Awal
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div
        className="acct-stat-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 14, marginBottom: 24 }}
      >
        {[
          { label: 'Total Akun',   value: accounts.length,  color: 'var(--brand-500)', icon: BookOpen },
          { label: 'Total Jurnal', value: journals.length,  color: 'var(--nx-purple)', icon: List },
          { label: 'Total Debit',  value: fmt(totalDebit),  color: '#10B981', icon: Plus },
          { label: 'Total Kredit', value: fmt(totalCredit), color: '#F59E0B', icon: Plus },
        ].map((s, i) => { const Icon = s.icon; return (
          <div key={i} className="card anim-fadeup" style={{ padding: '18px 20px', borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>{s.value}</div>
            <Icon size={18} color={s.color} style={{ opacity: 0.5 }} strokeWidth={1.8} />
          </div>
        ); })}
      </div>

      {/* ISAK35 info banner */}
      <div
        className="card anim-fadeup"
        style={{
          padding: '14px 18px',
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgb(var(--brand-500-rgb) / 0.06), rgb(var(--brand-500-rgb) / 0.02))',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            className="isak35-section-header"
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4 }}
          >
            ISAK 35 — Entitas Nirlaba
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Pencatatan akun mengikuti standar ISAK 35 dengan klasifikasi Aset, Kewajiban, Ekuitas, Pendapatan, dan Beban sesuai pelaporan keuangan entitas nirlaba.
          </p>
        </div>
        <span className="badge badge-success" style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>ISAK 35 Ready</span>
      </div>

      {/* Tab Navigation — horizontally scrollable on mobile */}
      <div
        className="tab-bar acct-tab-bar"
        style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 20 }}
      >
        {([['journal','Jurnal Umum'],['coa','Chart of Accounts']] as [string,string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val as 'coa'|'journal')}
            className={`tab-btn${tab === val ? ' tab-btn-active' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card anim-fadeup" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-4)', fontSize: 15 }}>
            Memuat data...
          </div>
        ) : tab === 'journal' ? (
          journals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <BookOpen
                size={40}
                strokeWidth={1.4}
                style={{ opacity: 0.35, display: 'block', margin: '0 auto 12px' }}
              />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text-3)' }}>Belum ada jurnal</div>
              <div style={{ fontSize: 14 }}>Tambah jurnal pertama untuk memulai pencatatan.</div>
              <button
                onClick={() => setModal(true)}
                style={{
                  marginTop: 18,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Tambah Jurnal
              </button>
            </div>
          ) : (
            <>
              <div
                className="isak35-section-header"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}
              >
                Jurnal Umum — Entri Debit &amp; Kredit
              </div>
              <div className="acct-table-wrapper">
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
                          <span style={{ background: 'var(--brand-50)', color: 'var(--brand-500)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{j.id}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-3)', fontSize: 13, whiteSpace: 'nowrap' }}>{j.date ? new Date(j.date).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{j.description}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: '#f0fdf4', color: '#059669', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{j.debitAccount || '-'}</span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: '#fff5f5', color: '#dc2626', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{j.creditAccount || '-'}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmt(j.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-4)' }}>
              <BookOpen
                size={40}
                strokeWidth={1.4}
                style={{ opacity: 0.35, display: 'block', margin: '0 auto 12px' }}
              />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text-3)' }}>Belum ada akun</div>
              <div style={{ fontSize: 14 }}>Chart of accounts masih kosong.</div>
            </div>
          ) : (
            <>
              <div
                className="isak35-section-header"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}
              >
                Chart of Accounts — Klasifikasi ISAK 35
              </div>
              <div className="acct-table-wrapper">
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
                          <span style={{ background: 'var(--brand-50)', color: 'var(--brand-500)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{acc.code}</span>
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
            </>
          )
        )}
      </div>

      {openingOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setOpeningOpen(false)}>
          <div className="modal-box anim-fadeup" role="dialog" aria-modal="true" aria-labelledby="ob-title" style={{ maxWidth: 620 }}>
            <h3 id="ob-title" style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Saldo Awal</h3>
            <OpeningBalanceForm
              accounts={Object.fromEntries(accounts.map((a) => [a.code, { name: a.name, type: a.type }]))}
              onCancel={() => setOpeningOpen(false)}
              onDone={async () => { setOpeningOpen(false); await load(); showToast('Saldo awal tersimpan'); }}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box anim-fadeup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div
                  className="isak35-section-header"
                  style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}
                >
                  Tambah Jurnal
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>Isi detail entri jurnal baru (ISAK 35)</div>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{ background: '#f4f6f8', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 160ms' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Journal form — stacked on mobile, 2-col grid for debit/credit on wider screens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {/* Description — full width */}
              <div>
                <label className="form-label">Deskripsi <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Pembayaran gaji bulan Mei"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Debit / Credit — side by side ≥480px, stacked below */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label">Akun Debit <span style={{ color: '#EF4444' }}>*</span></label>
                  <select
                    value={form.debitAccount}
                    onChange={(e) => setForm({ ...form, debitAccount: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Pilih akun debit</option>
                    {accounts.map((acc) => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} — {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Akun Kredit <span style={{ color: '#EF4444' }}>*</span></label>
                  <select
                    value={form.creditAccount}
                    onChange={(e) => setForm({ ...form, creditAccount: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Pilih akun kredit</option>
                    {accounts.map((acc) => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} — {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount — full width */}
              <div>
                <label className="form-label">Jumlah (Rp) <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="acct-modal-btn-row" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(false)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="acct-action-btn"
                style={{
                  padding: '11px 24px', borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', minHeight: 44,
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgb(var(--brand-500-rgb) / 0.28)',
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

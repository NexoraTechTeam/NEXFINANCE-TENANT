'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { accountingService } from '@/lib/api';

interface Fund { key: string; label: string; equity: string; revenue: string; releasable: boolean; balance: number }
interface FundJournal {
  id: string; date: string; description: string;
  debit: { account: string; amount: number }; source?: { type: string; fund?: string };
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);
const digits = (v: string) => v.replace(/\D/g, '');
const errorOf = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

/**
 * Net assets with restrictions (ISAK 335): record contributions with a donor restriction and release them
 * once the purpose or time restriction is met. Expenses themselves are always recorded as usual.
 */
export default function RestrictedFunds() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<FundJournal[]>([]);
  const [receipt, setReceipt] = useState({ fund: 'temporer', date: today(), amount: '', method: 'transfer', description: '' });
  const [release, setRelease] = useState({ fund: 'temporer', date: today(), amount: '', description: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await accountingService.getRestrictedFunds();
    setFunds(res.data?.funds || []);
    setTransactions(res.data?.transactions || []);
  }, []);
  useEffect(() => { load().catch(() => setError('Data dana terikat gagal dimuat.')); }, [load]);

  const submit = (fn: () => Promise<unknown>, ok: string, reset: () => void) => async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await fn();
      reset();
      setMessage(ok);
      await load();
    } catch (err) {
      setError(errorOf(err, 'Transaksi gagal disimpan.'));
    }
  };

  const releasable = funds.filter((f) => f.releasable);
  const label = (key?: string) => funds.find((f) => f.key === key)?.label || key || '-';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
        Sumbangan yang dibatasi pemberinya (mis. donasi pembangunan, wakaf) dicatat sebagai <strong>aset neto dengan pembatasan</strong>.
        Saat tujuan atau waktunya terpenuhi, lepaskan pembatasannya agar dananya menjadi aset neto tanpa pembatasan. Bebannya tetap dicatat
        lewat pengeluaran seperti biasa.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {funds.map((f) => (
          <div key={f.key} data-testid={`fund-${f.key}`} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{f.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmt(f.balance)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>
              Akun {f.revenue} / {f.equity}{f.releasable ? '' : ' · tidak dapat dilepaskan'}
            </div>
          </div>
        ))}
      </div>

      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>{error}</div>}
      {message && <div role="status" style={{ padding: '10px 12px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontSize: 13 }}>{message}</div>}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <form aria-label="Terima dana terikat" className="card" style={{ padding: 16, display: 'grid', gap: 8 }}
          onSubmit={submit(() => accountingService.postRestrictedReceipt({ ...receipt, amount: Number(receipt.amount) }), 'Penerimaan dana terikat tersimpan.',
            () => setReceipt((v) => ({ ...v, amount: '', description: '' })))}>
          <strong style={{ fontSize: 15 }}>Terima dana terikat</strong>
          <label className="form-label" htmlFor="rf-r-fund">Jenis dana</label>
          <select id="rf-r-fund" className="form-input" value={receipt.fund} onChange={(e) => setReceipt((v) => ({ ...v, fund: e.target.value }))}>
            {funds.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <label className="form-label" htmlFor="rf-r-date">Tanggal</label>
          <input id="rf-r-date" type="date" className="form-input" required value={receipt.date} onChange={(e) => setReceipt((v) => ({ ...v, date: e.target.value }))} />
          <label className="form-label" htmlFor="rf-r-amount">Jumlah (Rp)</label>
          <input id="rf-r-amount" inputMode="numeric" className="form-input" required value={receipt.amount} onChange={(e) => setReceipt((v) => ({ ...v, amount: digits(e.target.value) }))} />
          <label className="form-label" htmlFor="rf-r-method">Diterima ke</label>
          <select id="rf-r-method" className="form-input" value={receipt.method} onChange={(e) => setReceipt((v) => ({ ...v, method: e.target.value }))}>
            <option value="transfer">Rekening bank</option>
            <option value="tunai">Kas tunai</option>
          </select>
          <label className="form-label" htmlFor="rf-r-desc">Keterangan</label>
          <input id="rf-r-desc" className="form-input" required placeholder="Mis. Donasi renovasi musala dari wali murid" value={receipt.description} onChange={(e) => setReceipt((v) => ({ ...v, description: e.target.value }))} />
          <button type="submit" className="btn-primary" style={{ justifySelf: 'start', marginTop: 4 }}>Simpan penerimaan</button>
        </form>

        <form aria-label="Lepaskan pembatasan" className="card" style={{ padding: 16, display: 'grid', gap: 8 }}
          onSubmit={submit(() => accountingService.postRestrictionRelease({ ...release, amount: Number(release.amount) }), 'Pembatasan dilepaskan.',
            () => setRelease((v) => ({ ...v, amount: '', description: '' })))}>
          <strong style={{ fontSize: 15 }}>Lepaskan pembatasan</strong>
          <label className="form-label" htmlFor="rf-l-fund">Jenis dana</label>
          <select id="rf-l-fund" className="form-input" value={release.fund} onChange={(e) => setRelease((v) => ({ ...v, fund: e.target.value }))}>
            {releasable.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <label className="form-label" htmlFor="rf-l-date">Tanggal</label>
          <input id="rf-l-date" type="date" className="form-input" required value={release.date} onChange={(e) => setRelease((v) => ({ ...v, date: e.target.value }))} />
          <label className="form-label" htmlFor="rf-l-amount">Jumlah (Rp)</label>
          <input id="rf-l-amount" inputMode="numeric" className="form-input" required value={release.amount} onChange={(e) => setRelease((v) => ({ ...v, amount: digits(e.target.value) }))} />
          <label className="form-label" htmlFor="rf-l-desc">Keterangan</label>
          <input id="rf-l-desc" className="form-input" required placeholder="Mis. Renovasi musala selesai" value={release.description} onChange={(e) => setRelease((v) => ({ ...v, description: e.target.value }))} />
          <button type="submit" className="btn-primary" style={{ justifySelf: 'start', marginTop: 4 }}>Lepaskan pembatasan</button>
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <strong style={{ fontSize: 15 }}>Riwayat dana terikat</strong>
        {transactions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 0 }}>Belum ada transaksi dana terikat.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 13 }}>
              <thead>
                <tr>{['Tanggal', 'Jenis', 'Dana', 'Keterangan', 'Jumlah'].map((h) => <th key={h} style={{ textAlign: h === 'Jumlah' ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: '8px 10px' }}>{t.date}</td>
                    <td style={{ padding: '8px 10px' }}>{t.source?.type === 'restriction_release' ? 'Pelepasan' : 'Penerimaan'}</td>
                    <td style={{ padding: '8px 10px' }}>{label(t.source?.fund)}</td>
                    <td style={{ padding: '8px 10px' }}>{t.description}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(t.debit.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

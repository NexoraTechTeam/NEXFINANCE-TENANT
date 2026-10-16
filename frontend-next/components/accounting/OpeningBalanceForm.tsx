'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { accountingService } from '@/lib/api';

interface Account { name: string; type: string }

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const TYPES: Record<string, string> = { Asset: 'Aset', Liability: 'Kewajiban', Equity: 'Aset bersih (terikat)' };

/** Opening position of a school (posted against unrestricted net assets, account 3000). */
export default function OpeningBalanceForm({ accounts, onDone, onCancel }: {
  accounts: Record<string, Account>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const rows = useMemo(() => Object.entries(accounts)
    .filter(([code, a]) => ['Asset', 'Liability', 'Equity'].includes(a.type) && code !== '3000'), [accounts]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const value = (code: string) => Number((amounts[code] || '').replace(/\D/g, '')) || 0;
  const assets = rows.filter(([, a]) => a.type === 'Asset').reduce((s, [c]) => s + value(c), 0);
  const claims = rows.filter(([, a]) => a.type !== 'Asset').reduce((s, [c]) => s + value(c), 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const entries = rows.map(([account]) => ({ account, amount: value(account) })).filter((x) => x.amount > 0);
    if (entries.length === 0) { setError('Isi minimal satu saldo akun.'); return; }
    setBusy(true);
    try {
      await accountingService.postOpeningBalance({ date, entries });
      onDone();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Saldo awal gagal disimpan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.55 }}>
        Masukkan posisi keuangan saat mulai memakai NexFinance. Selisih aset dan kewajiban dicatat sebagai
        <strong> Dana Tidak Terikat (3000)</strong>.
      </p>
      <label className="form-label" htmlFor="ob-date">Tanggal saldo awal</label>
      <input id="ob-date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {rows.map(([code, a]) => (
          <div key={code} style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'center' }}>
            <label htmlFor={`ob-${code}`} style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              {code} · {a.name} <span style={{ color: 'var(--text-4)', fontSize: 12 }}>({TYPES[a.type]})</span>
            </label>
            <input id={`ob-${code}`} inputMode="numeric" className="form-input" placeholder="0"
              value={amounts[code] || ''} onChange={(e) => setAmounts((v) => ({ ...v, [code]: e.target.value.replace(/\D/g, '') }))} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
        <span>Total aset: <strong>{fmt(assets)}</strong></span>
        <span>Dana tidak terikat: <strong>{fmt(assets - claims)}</strong></span>
      </div>
      {error && <div role="alert" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan saldo awal'}</button>
      </div>
    </form>
  );
}

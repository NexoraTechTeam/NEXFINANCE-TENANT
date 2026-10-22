'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { accountingService } from '@/lib/api';

interface Category { key: string; label: string; depreciable: boolean; suggestedLifeMonths: number | null; account: string }
interface Asset {
  id: string; name: string; category: string; cost: number; usefulLifeMonths: number | null; depreciable: boolean;
  monthly: number; accumulated: number; bookValue: number; dueMonths: number; fullyDepreciated: boolean; mode: string;
}
interface Recon { account: string; name: string; ledger: number; register: number; difference: number }
interface Register {
  assets: Asset[]; totals: { cost: number; accumulated: number; bookValue: number };
  reconciliation: Recon[]; categories: Category[]; currentMonth: string;
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);
const digits = (v: string) => v.replace(/\D/g, '');
const errorOf = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;

const emptyForm = (life = '240') => ({
  name: '', category: 'bangunan', mode: 'acquisition', cost: '', residual: '0', life, acquisitionDate: today(),
  method: 'transfer', depreciationFrom: today().slice(0, 7), accumulated: '0',
});

const th = (align: 'left' | 'right') => ({ textAlign: align, padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' } as const);
const td = (align: 'left' | 'right' = 'left') => ({ padding: '8px 10px', textAlign: align } as const);

/**
 * Fixed assets (ISAK 335 / SAK): assets are carried at cost less accumulated depreciation. Register the assets,
 * then record the straight-line depreciation up to the current month; land is never depreciated.
 */
export default function FixedAssets({ readOnly = false }: { readOnly?: boolean }) {
  const [data, setData] = useState<Register | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await accountingService.getFixedAssets();
    setData(res.data);
  }, []);
  useEffect(() => { load().catch(() => setError('Data aset tetap gagal dimuat.')); }, [load]);

  const categories = data?.categories || [];
  const category = categories.find((c) => c.key === form.category);
  const depreciable = category ? category.depreciable : true;
  const existing = form.mode === 'existing';
  const setField = (patch: Partial<typeof form>) => setForm((v) => ({ ...v, ...patch }));

  const changeCategory = (key: string) => {
    const next = categories.find((c) => c.key === key);
    setField({ category: key, life: next?.suggestedLifeMonths ? String(next.suggestedLifeMonths) : '' });
  };

  const payload = () => {
    const base: Record<string, unknown> = {
      name: form.name, category: form.category, mode: form.mode, cost: Number(form.cost), acquisitionDate: form.acquisitionDate,
    };
    if (depreciable) {
      base.usefulLifeMonths = Number(form.life);
      base.residualValue = Number(form.residual || 0);
      if (existing) {
        base.depreciationFrom = form.depreciationFrom;
        base.accumulatedDepreciation = Number(form.accumulated || 0);
      }
    }
    if (!existing) base.method = form.method;
    return base;
  };

  const saveAsset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await accountingService.postFixedAsset(payload());
      // Keep the category (and its matching life) so several assets of one kind can be entered in a row.
      setForm({ ...emptyForm(category?.suggestedLifeMonths ? String(category.suggestedLifeMonths) : ''), category: form.category });
      setMessage('Aset tetap tersimpan.');
      await load();
    } catch (err) {
      setError(errorOf(err, 'Aset gagal disimpan.'));
    }
  };

  const due = (data?.assets || []).reduce((s, a) => s + a.dueMonths, 0);
  const runDepreciation = async () => {
    if (!data) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await accountingService.runDepreciation(data.currentMonth);
      const { posted, total } = res.data;
      setMessage(posted > 0 ? `${posted} jurnal penyusutan dicatat (${fmt(total)}).` : 'Semua penyusutan sudah tercatat.');
      await load();
    } catch (err) {
      setError(errorOf(err, 'Penyusutan gagal dicatat.'));
    } finally {
      setBusy(false);
    }
  };

  const labelOf = (key: string) => categories.find((c) => c.key === key)?.label || key;
  const statusOf = (a: Asset) => (!a.depreciable ? 'Tidak disusutkan' : a.fullyDepreciated ? 'Habis disusutkan' : a.dueMonths > 0 ? `${a.dueMonths} bln tertunda` : 'Terkini');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
        Aset tetap dicatat sebesar harga perolehan dikurangi <strong>akumulasi penyusutan</strong>. Daftarkan setiap aset, lalu catat
        penyusutan bulanan (metode garis lurus) hingga bulan berjalan. Tanah tidak disusutkan. Penyusutan masuk ke beban dan mengurangi
        nilai aset di laporan.
      </p>

      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>{error}</div>}
      {message && <div role="status" style={{ padding: '10px 12px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontSize: 13 }}>{message}</div>}

      {data && (
        <div data-testid="asset-totals" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {([['Harga perolehan', data.totals.cost], ['Akumulasi penyusutan', data.totals.accumulated], ['Nilai buku', data.totals.bookValue]] as [string, number][]).map(([label, value]) => (
            <div key={label} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{fmt(value)}</div>
            </div>
          ))}
        </div>
      )}

      {data && data.reconciliation.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ fontSize: 15 }}>Kesesuaian daftar aset dengan buku besar</strong>
          <div style={{ display: 'grid', gap: 6, marginTop: 8, fontSize: 13 }}>
            {data.reconciliation.map((r) => (
              <div key={r.account} data-testid={`recon-${r.account}`} style={{ color: r.difference === 0 ? 'var(--text-3)' : '#991b1b' }}>
                {r.account} {r.name}: buku besar {fmt(r.ledger)} · daftar aset {fmt(r.register)} ·{' '}
                {r.difference === 0 ? 'sesuai' : `selisih ${fmt(r.difference)} — periksa saldo awal atau daftar aset`}
              </div>
            ))}
          </div>
        </div>
      )}

      {!readOnly && data && data.assets.some((a) => a.depreciable) && (
        <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)', flex: '1 1 240px' }}>
            {due > 0 ? `${due} bulan belum disusutkan (semua aset, sampai ${data.currentMonth}).` : 'Penyusutan sudah tercatat sampai bulan berjalan.'}
          </span>
          <button type="button" className="btn-primary" disabled={busy} onClick={runDepreciation}>
            Catat penyusutan s.d. {data.currentMonth}
          </button>
        </div>
      )}

      {!readOnly && data && (
        <form aria-label="Tambah aset tetap" className="card" style={{ padding: 16, display: 'grid', gap: 8 }} onSubmit={saveAsset}>
          <strong style={{ fontSize: 15 }}>Tambah aset tetap</strong>
          <label className="form-label" htmlFor="fa-name">Nama aset</label>
          <input id="fa-name" className="form-input" required maxLength={120} placeholder="Mis. Gedung kelas lantai 2" value={form.name} onChange={(e) => setField({ name: e.target.value })} />
          <label className="form-label" htmlFor="fa-cat">Kategori</label>
          <select id="fa-cat" className="form-input" value={form.category} onChange={(e) => changeCategory(e.target.value)}>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <label className="form-label" htmlFor="fa-mode">Status aset</label>
          <select id="fa-mode" className="form-input" value={form.mode} onChange={(e) => setField({ mode: e.target.value })}>
            <option value="acquisition">Baru dibeli (catat pembelian)</option>
            <option value="existing">Sudah dimiliki (sudah ada di saldo awal)</option>
          </select>
          <label className="form-label" htmlFor="fa-date">Tanggal perolehan</label>
          <input id="fa-date" type="date" className="form-input" required value={form.acquisitionDate} onChange={(e) => setField({ acquisitionDate: e.target.value })} />
          <label className="form-label" htmlFor="fa-cost">Harga perolehan (Rp)</label>
          <input id="fa-cost" inputMode="numeric" className="form-input" required value={form.cost} onChange={(e) => setField({ cost: digits(e.target.value) })} />
          {depreciable && (
            <>
              <label className="form-label" htmlFor="fa-life">Masa manfaat (bulan)</label>
              <input id="fa-life" inputMode="numeric" className="form-input" required value={form.life} onChange={(e) => setField({ life: digits(e.target.value) })} />
              <label className="form-label" htmlFor="fa-residual">Nilai residu (Rp)</label>
              <input id="fa-residual" inputMode="numeric" className="form-input" value={form.residual} onChange={(e) => setField({ residual: digits(e.target.value) })} />
            </>
          )}
          {existing && depreciable && (
            <>
              <label className="form-label" htmlFor="fa-from">Mulai disusutkan (bulan)</label>
              <input id="fa-from" type="month" className="form-input" required value={form.depreciationFrom} onChange={(e) => setField({ depreciationFrom: e.target.value })} />
              <label className="form-label" htmlFor="fa-acc">Akumulasi penyusutan saat ini (Rp)</label>
              <input id="fa-acc" inputMode="numeric" className="form-input" value={form.accumulated} onChange={(e) => setField({ accumulated: digits(e.target.value) })} />
            </>
          )}
          {!existing && (
            <>
              <label className="form-label" htmlFor="fa-method">Dibayar dari</label>
              <select id="fa-method" className="form-input" value={form.method} onChange={(e) => setField({ method: e.target.value })}>
                <option value="transfer">Rekening bank</option>
                <option value="tunai">Kas tunai</option>
              </select>
            </>
          )}
          <button type="submit" className="btn-primary" style={{ justifySelf: 'start', marginTop: 4 }}>Simpan aset</button>
        </form>
      )}

      <div className="card" style={{ padding: 16 }}>
        <strong style={{ fontSize: 15 }}>Daftar aset tetap</strong>
        {data && data.assets.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 0 }}>
            Belum ada aset tetap. Daftarkan tanah, bangunan, peralatan, atau kendaraan agar penyusutannya tercatat.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th('left')}>Aset</th>
                  <th style={th('right')}>Perolehan</th>
                  <th style={th('right')}>Akumulasi</th>
                  <th style={th('right')}>Nilai buku</th>
                  <th style={th('right')}>Per bulan</th>
                  <th style={th('left')}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.assets || []).map((a) => (
                  <tr key={a.id}>
                    <td style={td()}>{a.name}<div style={{ fontSize: 11, color: 'var(--text-4)' }}>{labelOf(a.category)} · {a.id}</div></td>
                    <td style={td('right')}>{fmt(a.cost)}</td>
                    <td style={td('right')}>{fmt(a.accumulated)}</td>
                    <td style={{ ...td('right'), fontWeight: 700 }}>{fmt(a.bookValue)}</td>
                    <td style={td('right')}>{a.depreciable ? fmt(a.monthly) : '-'}</td>
                    <td style={td()}>{statusOf(a)}</td>
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

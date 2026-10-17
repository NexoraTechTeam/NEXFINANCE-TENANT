'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Globe, ImageUp, KeyRound, Palette as PaletteIcon, Power, Save, Trash2 } from 'lucide-react';
import PalettePreview from '@/components/console/PalettePreview';
import { statusBadge } from '@/components/console/TenantList';
import { consoleApi, consoleError, type ConsoleTenant } from '@/lib/console-api';
import { DEFAULT_PALETTE, type Palette } from '@/lib/theme';

const INFO_FIELDS: Array<[string, string]> = [
  ['shortName', 'Nama singkat'], ['city', 'Kota'], ['address', 'Alamat sekolah'], ['npsn', 'NPSN'],
  ['headmaster', 'Kepala sekolah'], ['treasurer', 'Bendahara'],
];

const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: typeof Save; children: React.ReactNode }) => (
  <section className="card" style={{ padding: 20 }} aria-labelledby={id}>
    <h2 id={id} className="help-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={17} style={{ color: 'var(--brand-600)' }} /> {title}
    </h2>
    {children}
  </section>
);

export default function TenantDetail({ id }: { id: string }) {
  const [tenant, setTenant] = useState<ConsoleTenant | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [info, setInfo] = useState<Record<string, string>>({});
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [domain, setDomain] = useState('');
  const [resetUser, setResetUser] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const apply = useCallback((t: ConsoleTenant) => {
    setTenant(t);
    setName(t.name);
    setInfo(t.schoolInfo || {});
    setPalette(t.branding.palette || DEFAULT_PALETTE);
  }, []);

  useEffect(() => {
    consoleApi.getTenant(id).then(apply).catch((err) => setError(consoleError(err)));
  }, [id, apply]);

  const run = async (fn: () => Promise<ConsoleTenant | void>, ok: string) => {
    setError('');
    setMessage('');
    try {
      const result = await fn();
      if (result) apply(result);
      setMessage(ok);
    } catch (err) {
      setError(consoleError(err));
    }
  };

  if (!tenant) {
    return error ? <div role="alert" className="card" style={{ padding: 16, color: '#991b1b' }}>{error}</div>
      : <div className="skeleton" style={{ height: 160 }} />;
  }

  const saveIdentity = (e: FormEvent) => {
    e.preventDefault();
    run(() => consoleApi.updateTenant(id, { name, schoolInfo: info }), 'Identitas tersimpan.');
  };

  const toggleStatus = () => {
    const next = tenant.status === 'active' ? 'suspended' : 'active';
    const verb = next === 'suspended' ? 'Nonaktifkan' : 'Aktifkan';
    if (!window.confirm(`${verb} ${tenant.name}? ${next === 'suspended' ? 'Pengguna sekolah tidak akan bisa masuk.' : ''}`)) return;
    run(() => consoleApi.updateTenant(id, { status: next }), `Tenant di${next === 'suspended' ? 'nonaktifkan' : 'aktifkan'}.`);
  };

  const onColor = async (key: 'primary' | 'secondary' | 'accent', value: string) => {
    try {
      setPalette(await consoleApi.paletteFromColors({ primary: palette.primary, secondary: palette.secondary, accent: palette.accent, [key]: value }));
    } catch (err) {
      setError(consoleError(err));
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{tenant.name} {statusBadge(tenant.status)}</h1>
          <p className="page-subtitle">
            <a href={`https://${tenant.domains[0]}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-600)' }}>
              {tenant.domains[0]} <ExternalLink size={13} />
            </a>
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={toggleStatus} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Power size={15} /> {tenant.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>

      {message && <div role="status" style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontSize: 13 }}>{message}</div>}
      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>{error}</div>}

      <div className="help-columns">
        <div style={{ display: 'grid', gap: 16 }}>
          <Section id="sec-identity" title="Identitas sekolah" icon={Save}>
            <form onSubmit={saveIdentity} className="grid-2">
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="td-name">Nama sekolah</label>
                <input id="td-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {INFO_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="form-label" htmlFor={`td-${key}`}>{label}</label>
                  <input id={`td-${key}`} className="form-input" value={info[key] || ''} onChange={(e) => setInfo((v) => ({ ...v, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="tour-btn tour-btn-primary">Simpan identitas</button>
              </div>
            </form>
          </Section>

          <Section id="sec-brand" title="Logo & tema" icon={PaletteIcon}>
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="form-label" htmlFor="td-logo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageUp size={14} /> Ganti logo (warna dibuat ulang otomatis)</label>
                <input id="td-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="form-input"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) run(async () => (await consoleApi.uploadLogo(id, f)).tenant, 'Logo & tema diperbarui.'); }} />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {(['primary', 'secondary', 'accent'] as const).map((key) => (
                    <label key={key} style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700 }}>
                      {key === 'primary' ? 'Primer' : key === 'secondary' ? 'Sekunder' : 'Aksen'}
                      <input type="color" value={palette[key]} onChange={(e) => onColor(key, e.target.value)} style={{ width: 56, height: 36, border: 0, background: 'none' }} />
                    </label>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={tenant.branding.showPoweredBy !== false}
                    onChange={(e) => run(() => consoleApi.updateTenant(id, { branding: { showPoweredBy: e.target.checked } }), 'Atribusi diperbarui.')} />
                  Tampilkan “NexFinance — produk dari Nexora”
                </label>
                <button type="button" className="tour-btn tour-btn-primary" style={{ justifySelf: 'start' }}
                  onClick={() => run(() => consoleApi.updateTenant(id, { branding: { palette: { primary: palette.primary, secondary: palette.secondary, accent: palette.accent } } }), 'Tema tersimpan.')}>
                  Simpan warna
                </button>
              </div>
              <PalettePreview palette={palette} schoolName={info.shortName || name}
                logoSrc={tenant.branding.logoUpdatedAt ? `https://${tenant.domains[0]}/api/v1/tenant/logo?v=${encodeURIComponent(tenant.branding.logoUpdatedAt)}` : null} />
            </div>
          </Section>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Section id="sec-domains" title="Domain" icon={Globe}>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginBottom: 12 }}>
              {tenant.domains.map((d) => (
                <li key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                  <code>{d}</code>
                  <button type="button" className="tour-btn tour-btn-link" aria-label={`Hapus ${d}`} disabled={tenant.domains.length === 1}
                    onClick={() => window.confirm(`Hapus domain ${d}?`) && run(() => consoleApi.removeDomain(id, d), 'Domain dihapus.')}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); if (domain.trim()) run(async () => { const t = await consoleApi.addDomain(id, domain.trim()); setDomain(''); return t; }, 'Domain ditambahkan. Pastikan DNS & host deployment sudah diatur.'); }}
              style={{ display: 'flex', gap: 8 }}>
              <label htmlFor="td-domain" className="sr-only" style={{ position: 'absolute', left: -9999 }}>Domain baru</label>
              <input id="td-domain" className="form-input" placeholder="sekolah.sch.id" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <button type="submit" className="tour-btn">Tambah</button>
            </form>
          </Section>

          <Section id="sec-access" title="Akses admin" icon={KeyRound}>
            <form onSubmit={(e) => { e.preventDefault(); if (resetUser.trim()) { setTempPassword(''); run(async () => { const r = await consoleApi.resetPassword(id, resetUser.trim()); setTempPassword(r.temporaryPassword); }, 'Password direset.'); } }}
              style={{ display: 'grid', gap: 8 }}>
              <label className="form-label" htmlFor="td-reset">Username atau email</label>
              <input id="td-reset" className="form-input" value={resetUser} onChange={(e) => setResetUser(e.target.value)} placeholder="admin-… atau nama@sekolah.sch.id" />
              <button type="submit" className="tour-btn" style={{ justifySelf: 'start' }}>Reset password</button>
            </form>
            {tempPassword && (
              <p role="note" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#fffbeb', color: '#92400e', fontSize: 13 }}>
                Password sementara (sekali tampil): <code style={{ fontWeight: 800 }}>{tempPassword}</code>
              </p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

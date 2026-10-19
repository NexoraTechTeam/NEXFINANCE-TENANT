'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, ImageUp, School, UserCog } from 'lucide-react';
import PalettePreview from '@/components/console/PalettePreview';
import { consoleApi, consoleError, slugify, SLUG_RE } from '@/lib/console-api';
import { DEFAULT_PALETTE, type Palette } from '@/lib/theme';
import { tenantDomain } from '@/lib/tenant-domain';

const STEPS = [
  { title: 'Identitas sekolah', icon: School },
  { title: 'Logo & warna', icon: ImageUp },
  { title: 'Admin & domain', icon: UserCog },
];

type Created = { id: string; domains: string[]; username: string; temporaryPassword: string };

export default function TenantWizard({ baseDomain }: { baseDomain: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [info, setInfo] = useState({ shortName: '', city: '', address: '', npsn: '' });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [manualPalette, setManualPalette] = useState(false);

  const [admin, setAdmin] = useState({ username: '', name: '', email: '' });
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);
  useEffect(() => {
    if (!usernameTouched) setAdmin((a) => ({ ...a, username: slug ? `admin-${slug.replace(/-/g, '')}`.slice(0, 40) : '' }));
  }, [slug, usernameTouched]);
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const defaultDomain = useMemo(() => tenantDomain(slug, baseDomain), [baseDomain, slug]);
  const displayName = info.shortName || name;

  const next = () => {
    setError('');
    if (step === 0) {
      if (!name.trim()) return setError('Nama sekolah wajib diisi.');
      if (!SLUG_RE.test(slug)) return setError('Slug hanya boleh huruf kecil, angka, dan tanda minus (maks. 40 karakter).');
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    return undefined;
  };

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (file.size > 2 * 1024 * 1024) { setError('Ukuran logo maksimal 2 MB.'); return; }
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
    setManualPalette(false);
    try {
      setPalette(await consoleApi.previewPalette(file));
    } catch (err) {
      setError(consoleError(err, 'Warna tidak dapat dibaca dari logo. Atur warna secara manual.'));
    }
  };

  const onColor = async (key: 'primary' | 'secondary' | 'accent', value: string) => {
    const colors = { primary: palette.primary, secondary: palette.secondary, accent: palette.accent, [key]: value };
    try {
      setPalette(await consoleApi.paletteFromColors(colors));
      setManualPalette(true);
    } catch (err) {
      setError(consoleError(err));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!admin.username.trim()) { setError('Username admin wajib diisi.'); return; }
    setBusy(true);
    try {
      const res = await consoleApi.createTenant({
        slug,
        name: name.trim(),
        schoolInfo: Object.fromEntries(Object.entries(info).filter(([, v]) => v.trim())),
        domains: customDomain.trim() ? [customDomain.trim().toLowerCase()] : [],
        admin: { username: admin.username.trim(), name: admin.name.trim() || `Administrator ${displayName}`, email: admin.email.trim() || undefined, role: 'super_admin' },
      });
      const id = res.tenant.id;
      if (logo) await consoleApi.uploadLogo(id, logo, { keepPalette: manualPalette });
      if (manualPalette || !logo) {
        await consoleApi.updateTenant(id, { branding: { palette: { primary: palette.primary, secondary: palette.secondary, accent: palette.accent } } });
      }
      setCreated({ id, domains: res.domains, username: res.admin?.username || admin.username, temporaryPassword: res.admin?.temporaryPassword || '' });
    } catch (err) {
      setError(consoleError(err, 'Tenant gagal dibuat.'));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <section className="card" style={{ padding: 24, maxWidth: 640 }} aria-labelledby="created-title">
        <span className="nx-eyebrow"><Check size={13} /> Tenant aktif</span>
        <h2 id="created-title" style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 12px' }}>{displayName} siap digunakan</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px 12px', fontSize: 14 }}>
          <dt style={{ color: 'var(--text-3)' }}>Alamat</dt>
          <dd>{created.domains.map((d) => <div key={d}><code>https://{d}</code></div>)}</dd>
          <dt style={{ color: 'var(--text-3)' }}>Username admin</dt>
          <dd><code>{created.username}</code></dd>
          <dt style={{ color: 'var(--text-3)' }}>Password sementara</dt>
          <dd style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ fontSize: 15, fontWeight: 800 }}>{created.temporaryPassword}</code>
            <button
              type="button"
              className="tour-btn"
              onClick={async () => { await navigator.clipboard?.writeText(created.temporaryPassword); setCopied(true); }}
            >
              <Copy size={13} /> {copied ? 'Tersalin' : 'Salin'}
            </button>
          </dd>
        </dl>
        <p role="note" style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: '#fffbeb', color: '#92400e', fontSize: 13 }}>
          Password ini hanya ditampilkan sekali. Kirimkan ke admin sekolah lewat kanal aman — admin wajib menggantinya saat login pertama.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" className="tour-btn tour-btn-primary" onClick={() => router.push(`/console/tenants/${created.id}`)}>Kelola tenant</button>
          <button type="button" className="tour-btn" onClick={() => router.push('/console')}>Kembali ke daftar</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24 }} noValidate>
      <ol style={{ display: 'flex', gap: 8, listStyle: 'none', marginBottom: 20, flexWrap: 'wrap' }} aria-label="Langkah">
        {STEPS.map(({ title, icon: Icon }, i) => (
          <li key={title} aria-current={i === step ? 'step' : undefined} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            background: i === step ? 'var(--brand-500)' : i < step ? 'var(--brand-50)' : 'var(--surface-soft)',
            color: i === step ? '#fff' : 'var(--text-2)',
          }}>
            <Icon size={14} /> {i + 1}. {title}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="tw-name">Nama sekolah</label>
            <input id="tw-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sekolah Islam Terpadu …" />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-short">Nama singkat</label>
            <input id="tw-short" className="form-input" value={info.shortName} onChange={(e) => setInfo((v) => ({ ...v, shortName: e.target.value }))} placeholder="SIT …" />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-slug">Slug</label>
            <input id="tw-slug" className="form-input" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 6 }}>
              Alamat default: {defaultDomain ? <code>{defaultDomain}</code> : '—'}
            </p>
          </div>
          <div>
            <label className="form-label" htmlFor="tw-city">Kota</label>
            <input id="tw-city" className="form-input" value={info.city} onChange={(e) => setInfo((v) => ({ ...v, city: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-address">Alamat sekolah</label>
            <input id="tw-address" className="form-input" value={info.address} onChange={(e) => setInfo((v) => ({ ...v, address: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-npsn">NPSN (opsional)</label>
            <input id="tw-npsn" className="form-input" value={info.npsn} onChange={(e) => setInfo((v) => ({ ...v, npsn: e.target.value }))} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div>
            <label className="form-label" htmlFor="tw-logo">Logo sekolah (PNG/JPG/SVG, maks. 2 MB)</label>
            <input id="tw-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="form-input" onChange={(e) => onLogo(e.target.files?.[0])} />
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '8px 0 14px' }}>
              Warna tema dibuat otomatis dari logo dan sudah dicek kontrasnya (WCAG AA). Anda tetap bisa menyesuaikannya.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {(['primary', 'secondary', 'accent'] as const).map((key) => (
                <label key={key} style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
                  {key === 'primary' ? 'Primer' : key === 'secondary' ? 'Sekunder' : 'Aksen'}
                  <input type="color" value={palette[key]} onChange={(e) => onColor(key, e.target.value)} style={{ width: 56, height: 36, border: 0, background: 'none' }} />
                </label>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 8 }}>
              Sumber warna: {manualPalette ? 'diatur manual' : palette.source === 'logo' ? 'dari logo' : 'default Nexora'}
            </p>
          </div>
          <PalettePreview palette={palette} schoolName={displayName} logoSrc={logoUrl} />
        </div>
      )}

      {step === 2 && (
        <div className="grid-2">
          <div>
            <label className="form-label" htmlFor="tw-admin">Username admin</label>
            <input id="tw-admin" className="form-input" value={admin.username} onChange={(e) => { setUsernameTouched(true); setAdmin((a) => ({ ...a, username: e.target.value })); }} />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-admin-name">Nama admin</label>
            <input id="tw-admin-name" className="form-input" value={admin.name} onChange={(e) => setAdmin((a) => ({ ...a, name: e.target.value }))} placeholder={`Administrator ${displayName}`} />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-admin-email">Email admin (opsional)</label>
            <input id="tw-admin-email" type="email" className="form-input" value={admin.email} onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="tw-domain">Domain kustom (opsional)</label>
            <input id="tw-domain" className="form-input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="sekolah.sch.id" />
            <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 6 }}>Butuh A record ke server dan penambahan host di deployment.</p>
          </div>
          <p style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--text-3)' }}>
            Admin dibuat dengan role <strong>super_admin</strong> dan password sementara yang wajib diganti saat login pertama.
          </p>
        </div>
      )}

      {error && (
        <div role="alert" style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button type="button" className="tour-btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Kembali</button>
        {step < STEPS.length - 1
          // Distinct keys: React must not morph the "next" button into the submit button mid-click,
          // or the browser submits the form as soon as the last step appears.
          ? <button key="next" type="button" className="tour-btn tour-btn-primary" onClick={next}>Lanjut</button>
          : <button key="submit" type="submit" className="tour-btn tour-btn-primary" disabled={busy}>{busy ? 'Membuat…' : 'Buat tenant'}</button>}
      </div>
    </form>
  );
}

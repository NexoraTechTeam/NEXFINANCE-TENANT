'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Users } from 'lucide-react';
import { consoleApi, consoleError, type ConsoleTenant } from '@/lib/console-api';

export const statusBadge = (status: ConsoleTenant['status']) => (
  <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-danger'}`}>{status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
);

export default function TenantList() {
  const router = useRouter();
  const [tenants, setTenants] = useState<ConsoleTenant[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    consoleApi.listTenants().then(setTenants).catch((err) => setError(consoleError(err)));
  }, []);

  return (
    <section aria-labelledby="tenants-title">
      <div className="page-header">
        <div>
          <h1 id="tenants-title" className="page-title">Sekolah (tenant)</h1>
          <p className="page-subtitle">Kelola semua klien NexFinance: identitas, tema, domain, dan akses admin.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => router.push('/console/tenants/new')}>
          <Plus size={16} /> Tenant baru
        </button>
      </div>
      {error && <div role="alert" className="card" style={{ padding: 14, color: '#991b1b' }}>{error}</div>}
      {!tenants && !error && <div className="skeleton" style={{ height: 120 }} />}
      {tenants?.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
          Belum ada tenant. Mulai dengan menambahkan sekolah pertama.
        </div>
      )}
      <div className="help-guide-grid">
        {tenants?.map((t) => (
          <button key={t.id} type="button" className="card card-hover help-guide-card" style={{ textAlign: 'left' }}
            onClick={() => router.push(`/console/tenants/${t.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="help-guide-icon" style={{ background: t.branding.palette?.brand['50'], color: t.branding.palette?.brand['600'] }}>
                <Building2 size={18} />
              </span>
              <h3 style={{ flex: 1 }}>{t.name}</h3>
              {statusBadge(t.status)}
            </div>
            <p><code>{t.domains[0]}</code></p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> {t.userCount ?? 0} pengguna · slug <code>{t.slug}</code></p>
          </button>
        ))}
      </div>
    </section>
  );
}

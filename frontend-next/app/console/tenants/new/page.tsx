'use client';

import { useEffect, useState } from 'react';
import TenantWizard from '@/components/console/TenantWizard';
import { consoleApi } from '@/lib/console-api';

export default function NewTenantPage() {
  const [baseDomain, setBaseDomain] = useState<string | null>(null);
  useEffect(() => { consoleApi.me().then((me) => setBaseDomain(me.tenantBaseDomain)).catch(() => {}); }, []);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 className="page-title">Tenant baru</h1>
        <p className="page-subtitle">Siapkan sekolah baru: identitas, logo & tema, lalu akun admin pertama.</p>
      </div>
      <TenantWizard baseDomain={baseDomain} />
    </div>
  );
}

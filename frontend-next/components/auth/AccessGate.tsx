'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { canAccess, useAccess } from '@/lib/permissions';

const mustChangePassword = () => {
  try { return Boolean((JSON.parse(window.localStorage.getItem('user') || 'null') as { mustChangePassword?: boolean } | null)?.mustChangePassword); } catch { return false; }
};

/**
 * Mounts a dashboard page only when the role may open it, so pages never fire requests the API refuses.
 * While a temporary password is pending only the change-password dialog is shown.
 */
export default function AccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const access = useAccess();
  const [pending, setPending] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setPending(mustChangePassword());
    sync();
    window.addEventListener('nexfin:password-changed', sync);
    return () => window.removeEventListener('nexfin:password-changed', sync);
  }, []);

  if (pending !== false || !access) return null;
  if (!canAccess(pathname, access)) {
    return (
      <section className="card" style={{ padding: 32, maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
        <ShieldAlert size={36} style={{ color: 'var(--brand-600)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px' }}>Akses tidak tersedia</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
          Peran Anda tidak memiliki akses ke halaman ini. Hubungi Super Admin sekolah bila Anda memerlukannya.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', marginTop: 12 }}>Kembali ke Dashboard</Link>
      </section>
    );
  }
  return <>{children}</>;
}

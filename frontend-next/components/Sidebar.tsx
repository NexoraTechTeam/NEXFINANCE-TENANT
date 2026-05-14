'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, DollarSign,
  ShoppingCart, BookOpen, FileText, LogOut,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/dashboard' },
  { label: 'SPP',        icon: CreditCard,       href: '/dashboard/spp' },
  { label: 'Penggajian', icon: Users,            href: '/dashboard/payroll' },
  { label: 'Pengeluaran',icon: DollarSign,       href: '/dashboard/expenses' },
  { label: 'Pengadaan',  icon: ShoppingCart,     href: '/dashboard/procurement' },
  { label: 'Akuntansi',  icon: BookOpen,         href: '/dashboard/accounting' },
  { label: 'Laporan',    icon: FileText,         href: '/dashboard/reports' },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <aside style={{
      width: 230,
      minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 12px',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 8px 22px', borderBottom: '1px solid rgba(255,255,255,0.10)', marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
          NexFinance
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          Al-Musabbihin · SIT
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} />   {/* naik dari 16 */}
              {label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 8 }}>
        <button
          onClick={handleLogout}
          className="nav-link"
          style={{ color: 'rgba(255,110,110,0.80)' }}
        >
          <LogOut size={18} strokeWidth={1.8} />
          Keluar
        </button>
      </div>
    </aside>
  );
}

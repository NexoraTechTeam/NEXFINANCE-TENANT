'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, DollarSign,
  ShoppingCart, BookOpen, FileText, LogOut, X,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { label: 'SPP',         icon: CreditCard,      href: '/dashboard/spp' },
  { label: 'Penggajian',  icon: Users,           href: '/dashboard/payroll' },
  { label: 'Pengeluaran', icon: DollarSign,      href: '/dashboard/expenses' },
  { label: 'Pengadaan',   icon: ShoppingCart,    href: '/dashboard/procurement' },
  { label: 'Akuntansi',   icon: BookOpen,        href: '/dashboard/accounting' },
  { label: 'Laporan',     icon: FileText,        href: '/dashboard/reports' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <aside
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 12px',
      }}
    >
      {/* Logo area */}
      <div style={{
        padding: '4px 8px 20px',
        marginBottom: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* NF badge */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--teal-500) 0%, #278a94 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.5px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(49,158,169,0.35)',
          }}>
            NF
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              NexFinance
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
              Al-Musabbihin · SIT
            </div>
          </div>
        </div>

        {/* Close button — visible only on mobile via CSS */}
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          aria-label="Close navigation"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className={`nav-link ${active ? 'nav-link-active' : ''}`}
              style={{ position: 'relative' }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {/* Active dot indicator */}
              {active && (
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--teal-500)',
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(49,158,169,0.70)',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 14,
        marginTop: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px 12px',
        }}>
          {/* Avatar */}
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(49,158,169,0.55) 0%, rgba(39,138,148,0.55) 100%)',
            border: '1.5px solid rgba(49,158,169,0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            AD
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Administrator
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.40)',
              marginTop: 1,
            }}>
              Super Admin
            </div>
          </div>
        </div>

        {/* Logout */}
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Users, DollarSign,
  ShoppingCart, BookOpen, FileText, LogOut, Sparkles, X, UserCog, UserRound, ClipboardList, History,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { label: 'SPP',         icon: CreditCard,      href: '/dashboard/spp' },
  { label: 'Penggajian',  icon: Users,           href: '/dashboard/payroll' },
  { label: 'Pengeluaran', icon: DollarSign,      href: '/dashboard/expenses' },
  { label: 'Pengadaan',   icon: ShoppingCart,    href: '/dashboard/procurement' },
  { label: 'Akuntansi',   icon: BookOpen,        href: '/dashboard/accounting' },
  { label: 'Laporan',     icon: FileText,        href: '/dashboard/reports' },
  { label: 'Log Historis', icon: History,        href: '/dashboard/activity-logs' },
  { label: 'Master Siswa', icon: UserRound,      href: '/dashboard/master/students' },
  { label: 'Master Karyawan', icon: ClipboardList, href: '/dashboard/master/employees' },
  { label: 'Role & Akses', icon: UserCog,        href: '/dashboard/master/access' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState({ name: 'Administrator', role: 'Super Admin' });

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;

    try {
      const parsed = JSON.parse(rawUser) as { name?: string; email?: string; role?: string };
      setCurrentUser({
        name: parsed.name || parsed.email || 'Administrator',
        role: parsed.role || 'Super Admin',
      });
    } catch {
      setCurrentUser({ name: 'Administrator', role: 'Super Admin' });
    }
  }, []);

  const activeSection = useMemo(
    () => NAV.find(({ href }) => pathname === href)?.label || 'Dashboard',
    [pathname]
  );
  const initials = useMemo(() => {
    const source = currentUser.name.trim();
    if (!source) return 'NF';
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'NF';
  }, [currentUser.name]);

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
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px 16px',
      }}
    >
      {/* Logo area */}
      <div style={{
        padding: '6px 8px 18px',
        marginBottom: 14,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* NF badge */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--teal-500) 0%, #278a94 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.5px',
              flexShrink: 0,
              boxShadow: '0 10px 22px rgba(49,158,169,0.26)',
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

        <div style={{
          marginTop: 16,
          padding: '12px 12px 14px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(49,158,169,0.16) 0%, rgba(49,158,169,0.04) 100%)',
          border: '1px solid rgba(91,200,211,0.18)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            color: '#8fe5ec',
            letterSpacing: '.35px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <Sparkles size={12} strokeWidth={2} />
            Active workspace
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            {activeSection}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.52)', fontSize: 12, marginTop: 4 }}>
            Ringkas, cepat, dan siap dipakai di desktop maupun mobile.
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
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
          padding: '10px 12px 14px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          marginBottom: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(49,158,169,0.55) 0%, rgba(39,138,148,0.55) 100%)',
            border: '1.5px solid rgba(49,158,169,0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
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
              {currentUser.name}
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.40)',
              marginTop: 1,
            }}>
              {currentUser.role}
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

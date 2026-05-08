import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Menu, X, LayoutDashboard, DollarSign, Users, FileText, ShoppingCart, BookOpen, BarChart2 } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'SPP', path: '/spp', icon: DollarSign },
  { name: 'Penggajian', path: '/payroll', icon: Users },
  { name: 'Pengeluaran', path: '/expenses', icon: FileText },
  { name: 'Pengadaan', path: '/procurement', icon: ShoppingCart },
  { name: 'Akuntansi', path: '/accounting', icon: BookOpen },
  { name: 'Laporan', path: '/reports', icon: BarChart2 },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? 'white' : 'rgba(255, 255, 255, 0.75)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: isActive(path) ? '700' : '500',
    padding: '7px 12px',
    borderRadius: '6px',
    background: isActive(path) ? 'rgba(255,255,255,0.2)' : 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <nav style={{
        background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
        boxShadow: '0 4px 20px rgba(65, 169, 169, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, overflow: 'hidden' }}>
            <Link to="/dashboard" style={{ color: 'white', fontSize: '20px', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '22px' }}>💼</span>
              <span>NexFinance</span>
            </Link>
            <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={navLinkStyle(item.path)}
                    onMouseEnter={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={14} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.95)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.85)'}
            >
              <LogOut size={14} /> Keluar
            </button>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, background: 'rgba(44,62,80,0.97)', backdropFilter: 'blur(10px)', padding: '16px 20px', zIndex: 99, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', fontWeight: isActive(item.path) ? '700' : '500', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setMenuOpen(false)}>
                <Icon size={16} /> {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Navbar;

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut, Menu, X, LayoutDashboard, DollarSign, Users, FileText,
  ShoppingCart, BookOpen, BarChart2, ClipboardList, Bell, ShieldCheck, ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'SPP', path: '/spp', icon: DollarSign, module: 'spp' },
  { name: 'Penggajian', path: '/payroll', icon: Users, module: 'payroll' },
  { name: 'Pengeluaran', path: '/expenses', icon: FileText, module: 'expenses' },
  { name: 'Pengadaan', path: '/procurement', icon: ShoppingCart, module: 'procurement' },
  { name: 'Akuntansi', path: '/accounting', icon: BookOpen, module: 'accounting' },
  { name: 'Laporan', path: '/reports', icon: BarChart2, module: 'reports' },
  {
    name: 'Master',
    icon: Users,
    module: 'master',
    children: [
      { name: 'Siswa', path: '/master/students', icon: Users, module: 'master' },
      { name: 'Karyawan', path: '/master/employees', icon: Users, module: 'master' },
      { name: 'Hak Akses Role', path: '/master/access', icon: ShieldCheck, module: 'master' },
    ],
  },
  { name: 'Activity Logs', path: '/activity-logs', icon: ClipboardList, module: 'activity' },
  { name: 'Notifikasi', path: '/notifications', icon: Bell, module: 'notifications' },
];

const Navbar = () => {
  const { user, logout, canAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const [masterOpen, setMasterOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const masterRef = React.useRef(null);
  const userRef = React.useRef(null);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  React.useEffect(() => {
    const closeOnOutside = (e) => {
      if (!masterRef.current?.contains(e.target)) setMasterOpen(false);
      if (!userRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);
  React.useEffect(() => {
    setMasterOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const canShowItem = (item) => {
    if (item.superAdminOnly && user?.role !== 'super_admin') return false;
    if (item.adminOnly && !['admin', 'super_admin'].includes(user?.role)) return false;
    if (item.children?.length) {
      return canAccess(item.module) && item.children.some(canShowItem);
    }
    return canAccess(item.module);
  };

  const filteredNavItems = NAV_ITEMS.filter(canShowItem);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, minWidth: 0 }}>
            <Link to="/dashboard" style={{ color: 'white', fontSize: '20px', fontWeight: '800', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '22px' }}>💼</span>
              <span>NexFinance</span>
            </Link>
            {!isMobile && (
              <div style={{ display: 'flex', gap: '2px', position: 'relative' }}>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                if (item.children?.length) {
                  const subItems = item.children.filter(canShowItem);
                  const isMasterActive = subItems.some((sub) => isActive(sub.path));
                  return (
                    <div key={item.name} ref={masterRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setMasterOpen((v) => !v)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: isMasterActive ? 'white' : 'rgba(255, 255, 255, 0.75)',
                          fontSize: '13px',
                          fontWeight: isMasterActive ? '700' : '500',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          background: isMasterActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Icon size={14} />
                        {item.name}
                        <ChevronDown size={12} style={{ transform: masterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
                      </button>
                      {masterOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: 190, marginTop: 6, background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', zIndex: 120, overflow: 'hidden' }}>
                          {subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', textDecoration: 'none', color: isActive(sub.path) ? '#2C3E50' : '#334155', fontSize: 13, fontWeight: isActive(sub.path) ? 700 : 500, background: isActive(sub.path) ? '#EFF6F6' : '#fff' }}
                              >
                                <SubIcon size={14} />
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
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
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
            {!isMobile && (
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '5px 12px', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '500', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'Admin'}</span>
                  <ChevronDown size={12} style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, minWidth: 180, background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 130 }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{ width: '100%', border: 'none', background: '#fff', color: '#DC2626', padding: '10px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                    >
                      <LogOut size={14} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            )}
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: isMobile ? 'block' : 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && isMobile && (
        <div style={{ position: 'fixed', top: '64px', left: 0, right: 0, background: 'rgba(44,62,80,0.97)', backdropFilter: 'blur(10px)', padding: '16px 20px', zIndex: 99, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{user?.email}</span>
            <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              Keluar
            </button>
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            if (item.children?.length) {
              const subItems = item.children.filter(canShowItem);
              return (
                <div key={item.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '14px', fontWeight: 700, padding: '8px 0' }}>
                    <Icon size={16} /> {item.name}
                  </div>
                  {subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isActive(sub.path) ? 'white' : 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '13px', fontWeight: isActive(sub.path) ? '700' : '500', padding: '10px 0 10px 24px' }}
                        onClick={() => setMenuOpen(false)}
                      >
                        <SubIcon size={14} /> {sub.name}
                      </Link>
                    );
                  })}
                </div>
              );
            }
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

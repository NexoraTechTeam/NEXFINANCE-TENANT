import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Menu, X, LayoutDashboard, DollarSign, Users, FileText } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'SPP', path: '/spp', icon: DollarSign },
    { name: 'Payroll', path: '#', icon: Users },
    { name: 'Expenses', path: '#', icon: FileText },
  ];

  const styles = {
    nav: {
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      boxShadow: '0 10px 25px rgba(65, 169, 169, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '70px',
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '40px',
      flex: 1,
    },
    logo: {
      color: 'white',
      fontSize: '24px',
      fontWeight: '800',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    navLinks: {
      display: 'none',
      gap: '8px',
      '@media (min-width: 768px)': {
        display: 'flex',
      }
    },
    navLink: {
      color: 'rgba(255, 255, 255, 0.85)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    email: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: '13px',
      fontWeight: '500',
    },
    logoutBtn: {
      background: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease',
    },
    menuBtn: {
      display: 'flex',
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      '@media (min-width: 768px)': {
        display: 'none',
      }
    },
    mobileMenu: {
      position: 'absolute',
      top: '70px',
      left: 0,
      right: 0,
      background: 'rgba(65, 169, 169, 0.98)',
      backdropFilter: 'blur(10px)',
      padding: '20px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    mobileMenuLink: {
      display: 'block',
      color: 'rgba(255, 255, 255, 0.85)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
    }
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.container}>
          <div style={styles.logoSection}>
            <Link to="/dashboard" style={styles.logo}>
              <span>💼</span> NexFinance
            </Link>
            <div style={styles.navLinks}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    style={styles.navLink}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'rgba(255, 255, 255, 0.85)';
                    }}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={styles.userSection}>
            <span style={styles.email}>{user?.email}</span>
            <button 
              onClick={handleLogout}
              style={styles.logoutBtn}
              onMouseEnter={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.9)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.9)'}
            >
              <LogOut size={16} />
              <span style={{display: 'none', '@media (min-width: 768px)': {display: 'inline'}}}>Logout</span>
            </button>
            <button 
              style={styles.menuBtn}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path}
                style={styles.mobileMenuLink}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <Icon size={16} style={{marginRight: '8px'}} />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Navbar;

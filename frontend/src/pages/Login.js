import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('admin@nexfinance.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    },
    wrapper: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '48px 32px',
      position: 'relative',
      overflow: 'hidden'
    },
    cardBefore: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #41A9A9 0%, #2C3E50 100%)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    logo: {
      fontSize: '32px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6B7280',
      margin: '8px 0 0 0',
      fontWeight: '500'
    },
    institution: {
      fontSize: '12px',
      color: '#41A9A9',
      marginTop: '4px',
      fontWeight: '600',
      letterSpacing: '0.5px'
    },
    errorBox: {
      background: '#FEE2E2',
      color: '#991B1B',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '13px',
      lineHeight: '1.5',
      border: '1px solid #FECACA'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#2C3E50',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.3s ease',
      outline: 'none',
    },
    inputFocus: {
      borderColor: '#41A9A9',
      boxShadow: '0 0 0 3px rgba(65, 169, 169, 0.1)',
    },
    button: {
      padding: '13px 20px',
      background: 'linear-gradient(135deg, #41A9A9 0%, #2C3E50 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '8px',
      boxShadow: '0 4px 12px rgba(65, 169, 169, 0.3)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(65, 169, 169, 0.4)',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    },
    footer: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '12px',
      color: '#6B7280',
      lineHeight: '1.6'
    },
    demoBox: {
      background: '#F0FDFA',
      border: '1px solid #CCFBF1',
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '16px',
      fontSize: '12px',
      color: '#0F766E',
    }
  };

  const [inputFocus, setInputFocus] = useState({ email: false, password: false });

  const getInputStyle = (field) => ({
    ...styles.input,
    ...(inputFocus[field] ? styles.inputFocus : {})
  });

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={{...styles.card, ...styles.cardBefore, padding: 0, boxShadow: 'none', background: 'linear-gradient(90deg, #41A9A9 0%, #2C3E50 100%)', height: '4px'}}></div>
          
          <div style={styles.header}>
            <div style={styles.logo}>NexFinance</div>
            <div style={styles.subtitle}>Yayasan ISAk 35 Finance System</div>
            <div style={styles.institution}>Yayasan ISAk 35</div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setInputFocus({ ...inputFocus, email: true })}
                onBlur={() => setInputFocus({ ...inputFocus, email: false })}
                style={getInputStyle('email')}
                placeholder="admin@nexfinance.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>🔐 Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setInputFocus({ ...inputFocus, password: true })}
                onBlur={() => setInputFocus({ ...inputFocus, password: false })}
                style={getInputStyle('password')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={(e) => !loading && Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => !loading && Object.assign(e.target.style, {transform: 'none'})}
              style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
            >
              {loading ? '⏳ Signing in...' : '✓ Sign In'}
            </button>
          </form>

          <div style={styles.footer}>
            <div style={styles.demoBox}>
              <strong>Demo Account:</strong><br/>
              Email: admin@nexfinance.com<br/>
              Password: admin123
            </div>
            <div style={{marginTop: '16px', fontSize: '11px', color: '#9CA3AF'}}>
              © 2026 NexFinance. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

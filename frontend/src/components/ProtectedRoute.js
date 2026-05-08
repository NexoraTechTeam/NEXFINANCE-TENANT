import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredModule, adminOnly = false, superAdminOnly = false }) => {
  const { user, loading, canAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (superAdminOnly && user?.role !== 'super_admin') {
    return (
      <div className="page" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 28, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, color: 'var(--text)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Halaman ini hanya dapat diakses oleh Super Admin.</p>
        </div>
      </div>
    );
  }

  if (!superAdminOnly && adminOnly && !['admin', 'super_admin'].includes(user?.role)) {
    return (
      <div className="page" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 28, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, color: 'var(--text)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Halaman ini hanya dapat diakses oleh administrator.</p>
        </div>
      </div>
    );
  }

  if (!superAdminOnly && !adminOnly && requiredModule && !canAccess(requiredModule)) {
    return (
      <div className="page" style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 20px' }}>
        <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 28, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, color: 'var(--text)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Anda tidak memiliki izin untuk membuka modul <strong>{requiredModule}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

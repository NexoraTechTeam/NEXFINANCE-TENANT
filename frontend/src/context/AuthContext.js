import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { hasModulePermission, resolvePermissionsByRole } from '../config/permissions';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authService.verify();
      if (response.data.valid) {
        const baseUser = response.data.user;
        const resolved = await loadUserProfileAndPermissions(baseUser);
        setUser(resolved.user);
        setPermissions(resolved.permissions);
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      setUser(null);
      setPermissions([]);
      setAuthError(error.response?.data?.error || 'Sesi login tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfileAndPermissions = async (baseUser) => {
    let userData = baseUser;
    let userPermissions = resolvePermissionsByRole(baseUser?.role);

    try {
      const profileRes = await authService.getProfile();
      const profileData = profileRes.data?.data || profileRes.data?.user || profileRes.data;
      if (profileData && typeof profileData === 'object') {
        userData = { ...baseUser, ...profileData };
      }
    } catch {
      // fallback to token user data
    }

    try {
      const permissionRes = await authService.getPermissions();
      const apiPermissions =
        permissionRes.data?.data?.permissions ||
        permissionRes.data?.permissions ||
        permissionRes.data?.data ||
        permissionRes.data;

      if (Array.isArray(apiPermissions) && apiPermissions.length) {
        userPermissions = apiPermissions;
      } else if (Array.isArray(userData?.permissions) && userData.permissions.length) {
        userPermissions = userData.permissions;
      }
    } catch {
      // fallback to role-based map
    }

    return { user: userData, permissions: userPermissions };
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('authToken', response.data.token);
    const resolved = await loadUserProfileAndPermissions(response.data.user);
    setUser(resolved.user);
    setPermissions(resolved.permissions);
    setAuthError('');
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setPermissions([]);
    setAuthError('');
  };

  const canAccess = (module) => hasModulePermission(permissions, module);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, authError, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

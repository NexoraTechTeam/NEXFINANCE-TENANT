'use client';

import { useEffect, useState } from 'react';

export interface StoredUser {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
  username?: string;
}

/**
 * The signed-in user saved by the login page. Returns null on the first render — exactly what the
 * server renders — and the stored value after mount, so pages never hydrate with different markup.
 */
export function useStoredUser(): StoredUser | null {
  const [user, setUser] = useState<StoredUser | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('user');
      setUser(raw ? (JSON.parse(raw) as StoredUser) : null);
    } catch {
      setUser(null);
    }
  }, []);
  return user;
}

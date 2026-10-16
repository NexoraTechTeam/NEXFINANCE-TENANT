'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_TENANT, type TenantConfig } from '@/lib/tenant';

const TenantContext = createContext<TenantConfig>(DEFAULT_TENANT);

export const useTenant = () => useContext(TenantContext);

export function TenantProvider({ value, children }: { value: TenantConfig; children: ReactNode }) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

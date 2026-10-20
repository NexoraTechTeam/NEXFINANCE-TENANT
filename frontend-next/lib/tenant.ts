import { DEFAULT_PALETTE, type Palette } from '@/lib/theme';

export interface TenantConfig {
  slug: string;
  name: string;
  shortName: string;
  schoolInfo: Record<string, string>;
  palette: Palette;
  logoUrl: string | null;
  /** Photo for the login page, uploaded in the Console (null = classic layout). */
  loginImageUrl: string | null;
  showPoweredBy: boolean;
}

/** Used for the console, unknown hosts and local development without a backend. */
export const DEFAULT_TENANT: TenantConfig = {
  slug: 'nexfinance',
  name: 'NexFinance',
  shortName: 'NexFinance',
  schoolInfo: {},
  palette: DEFAULT_PALETTE,
  logoUrl: null,
  loginImageUrl: null,
  showPoweredBy: true,
};

/** Merge an API payload over the defaults, tolerating partial/missing fields. */
export function normalizeTenantConfig(raw: Partial<TenantConfig> | null | undefined): TenantConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_TENANT;
  return {
    ...DEFAULT_TENANT,
    ...raw,
    schoolInfo: raw.schoolInfo ?? {},
    palette: raw.palette?.brand ? raw.palette : DEFAULT_PALETTE,
    logoUrl: raw.logoUrl ?? null,
    loginImageUrl: raw.loginImageUrl ?? null,
    showPoweredBy: raw.showPoweredBy !== false,
  };
}

export const isDefaultTenant = (t: TenantConfig) => t.slug === DEFAULT_TENANT.slug;

/** Title/subtitle pair for brand lockups: the school leads, NexFinance is the product line. */
export function brandLines(t: TenantConfig): { title: string; subtitle: string } {
  return isDefaultTenant(t)
    ? { title: 'NexFinance', subtitle: 'Sistem keuangan sekolah' }
    : { title: t.shortName, subtitle: 'NexFinance' };
}

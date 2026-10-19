/**
 * Default domain of a new tenant (mirrors backend services/tenants.js#tenantDomain).
 * `base` is a parent domain (`<slug>.<base>`) or a pattern with `{label}` (slug without hyphens) or `{slug}`.
 */
export function tenantDomain(slug: string, base: string | null | undefined): string | null {
  if (!slug || !base) return null;
  if (!/\{(label|slug)\}/.test(base)) return `${slug}.${base}`;
  return base.replace(/\{label\}/g, slug.replace(/-/g, '')).replace(/\{slug\}/g, slug);
}

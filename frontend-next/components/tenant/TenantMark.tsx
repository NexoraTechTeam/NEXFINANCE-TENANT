'use client';

import BrandMark from '@/components/brand/BrandMark';
import { useTenant } from '@/components/tenant/TenantProvider';

/** The school's logo when configured, otherwise the NexFinance product mark. */
export default function TenantMark({ size = 40, className }: { size?: number; className?: string }) {
  const tenant = useTenant();
  if (!tenant.logoUrl) return <BrandMark size={size} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tenant logo is served by the API, already optimised
    <img
      src={tenant.logoUrl}
      alt={tenant.shortName}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 10, background: '#fff', padding: Math.round(size * 0.08), flexShrink: 0 }}
    />
  );
}

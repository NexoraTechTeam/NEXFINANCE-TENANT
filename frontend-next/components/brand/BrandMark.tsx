import Image from 'next/image';

interface BrandProps {
  className?: string;
}

/** Official NexFinance product mark (as published on nexoratech.co). */
export default function BrandMark({ size = 40, className }: BrandProps & { size?: number }) {
  return (
    <Image
      src="/brand/nexfinance-mark.png"
      alt="NexFinance"
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0, borderRadius: '50%' }}
      unoptimized
      priority
    />
  );
}

/** Nexora corporate wordmark, rendered on a light chip so it stays legible on dark surfaces. */
export function NexoraLogo({ height = 18, className }: BrandProps & { height?: number }) {
  // Source asset is 382×92.
  const width = Math.round((height * 382) / 92);
  return (
    <span className={`nx-logo-chip ${className ?? ''}`.trim()}>
      <Image
        src="/brand/nexora-logo.png"
        alt="Nexora — Part of CBQA Global Group"
        width={width}
        height={height}
        unoptimized
      />
    </span>
  );
}

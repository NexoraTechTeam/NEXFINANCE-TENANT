import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TenantProvider } from "@/components/tenant/TenantProvider";
import { getTenantConfig } from "@/lib/tenant-server";
import { isDefaultTenant } from "@/lib/tenant";
import { DEFAULT_PALETTE, paletteToCss } from "@/lib/theme";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig();
  if (isDefaultTenant(tenant)) {
    return { title: "NexFinance", description: "Sistem keuangan sekolah terpadu — NexFinance by Nexora" };
  }
  return {
    title: `${tenant.shortName} — NexFinance`,
    description: `Sistem keuangan ${tenant.name}`,
    icons: tenant.logoUrl ? { icon: tenant.logoUrl, apple: tenant.logoUrl } : undefined,
  };
}

const themeCss = (palette: Parameters<typeof paletteToCss>[0]) => {
  try {
    return paletteToCss(palette);
  } catch {
    return paletteToCss(DEFAULT_PALETTE);
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantConfig();
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Tenant palette, validated hex only (see lib/theme.ts) */}
        <style id="tenant-theme" dangerouslySetInnerHTML={{ __html: themeCss(tenant.palette) }} />
      </head>
      <body style={{ margin: 0 }}>
        <TenantProvider value={tenant}>{children}</TenantProvider>
      </body>
    </html>
  );
}

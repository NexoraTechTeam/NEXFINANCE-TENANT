import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexFinance — Al-Musabbihin",
  description: "Sistem keuangan terpadu Sekolah Islam Terpadu Al-Musabbihin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

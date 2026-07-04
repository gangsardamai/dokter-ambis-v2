import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dokter Ambis",
  description: "Platform pembelajaran kedokteran Dokter Ambis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
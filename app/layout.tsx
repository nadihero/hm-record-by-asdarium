import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-albert-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekap & Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={albertSans.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${albertSans.className} antialiased`}
        style={{ background: 'var(--background)' }}
      >
        <AuthGuard>
          <div className="max-w-md mx-auto min-h-screen relative" style={{ background: 'var(--background)' }}>
            {children}
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Dawrak | Clinic Queue Management System - نظام دورك لإدارة طوابير العيادات',
  description:
    'Modern, real-time B2B SaaS clinic queue management. Zero race conditions, instant live ticket sync, and seamless doctor workflow.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#E8F5F2] text-[#123B4A]" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

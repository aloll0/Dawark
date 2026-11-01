'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ShieldCheck, Stethoscope, UserCheck } from 'lucide-react';

function NavbarContent() {
  const pathname = usePathname();

  const isSuperAdmin = pathname?.startsWith('/super-admin');
  const isClinic = pathname?.startsWith('/clinic');
  const isPatient = pathname?.startsWith('/q');

  return (
    <header className="sticky top-0 z-40 bg-[#123B4A] text-[#F7FAFC] border-b border-[#176B68]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-white rounded-md px-2 py-1 shadow-sm flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Dawrak دورك"
              className="h-8 w-auto max-w-[120px] object-contain"
            />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-[#F7FAFC] flex items-center gap-1.5 leading-none">
              <span>Dawrak</span>
              <span className="text-[#123B4A] font-semibold text-[10px] px-1.5 py-0.5 rounded bg-[#36B8A4]">
                دورك
              </span>
            </div>
            <div className="text-[10px] text-[#A0C4BF] font-normal mt-0.5">
              Clinic Queue Management
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <Link
            href="/super-admin"
            className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
              isSuperAdmin
                ? 'bg-[#176B68] text-[#F7FAFC]'
                : 'text-[#E8F5F2] hover:bg-[#176B68]/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#36B8A4]" />
            <span className="hidden md:inline">Super Admin</span>
          </Link>

          <Link
            href="/clinic"
            className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
              isClinic
                ? 'bg-[#176B68] text-[#F7FAFC]'
                : 'text-[#E8F5F2] hover:bg-[#176B68]/40 hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-[#36B8A4]" />
            <span>Clinic Portal</span>
          </Link>

          <Link
            href="/q"
            className={`flex items-center gap-1.5 px-3 py-2 rounded transition-colors ${
              isPatient
                ? 'bg-[#176B68] text-[#F7FAFC]'
                : 'text-[#E8F5F2] hover:bg-[#176B68]/40 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#36B8A4]" />
            <span className="hidden sm:inline">Patient QR App</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#123B4A]" />}>
      <NavbarContent />
    </Suspense>
  );
}

export default Navbar;

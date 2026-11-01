'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Stethoscope, ArrowRight, ShieldAlert, Building2 } from 'lucide-react';

interface ClinicItem {
  _id: string;
  name: string;
  phone: string;
  subscriptionStatus: string;
  maxDoctors: number;
}

export default function ClinicIndexPage() {
  const [clinics, setClinics] = useState<ClinicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/clinics');
        const data = await res.json();
        if (data.success && data.clinics) {
          setClinics(data.clinics);
        }
      } catch (err) {
        console.error('Failed to load clinics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="text-xs font-semibold text-[#176B68] uppercase tracking-wider mb-1">
          Clinic Staff Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#123B4A]">Select Your Clinic</h1>
        <p className="text-sm text-[#176B68]">
          Choose your medical center to access live queue management, doctor schedules, and front desk QR codes.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#176B68] bg-white rounded border border-[#D6E8E3]">
          Loading clinics...
        </div>
      ) : clinics.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-[#D6E8E3]">
          <ShieldAlert className="w-8 h-8 text-[#176B68] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#123B4A] mb-1">No clinics registered yet</p>
          <p className="text-xs text-[#176B68] mb-4">
            Register a clinic in the Super Admin dashboard or run the database seed.
          </p>
          <Link
            href="/super-admin"
            className="inline-flex items-center gap-2 bg-[#123B4A] text-white px-4 py-2 rounded text-xs font-bold"
          >
            Go to Super Admin
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((clinic) => (
            <Link
              key={clinic._id}
              href={`/clinic/${clinic._id}`}
              className="group p-5 bg-white border border-[#D6E8E3] hover:border-[#176B68] rounded-lg transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-[#E8F5F2] text-[#176B68] group-hover:bg-[#123B4A] group-hover:text-[#36B8A4] rounded flex items-center justify-center transition-colors">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#123B4A] group-hover:text-[#176B68] transition-colors">
                    {clinic.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`flat-badge ${
                        clinic.subscriptionStatus === 'active'
                          ? 'flat-badge-active'
                          : clinic.subscriptionStatus === 'pending'
                          ? 'flat-badge-pending'
                          : 'flat-badge-inactive'
                      }`}
                    >
                      {clinic.subscriptionStatus}
                    </span>
                    <span className="text-[11px] text-gray-500">Max Docs: {clinic.maxDoctors}</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#F7FAFC] group-hover:bg-[#36B8A4] group-hover:text-[#123B4A] text-[#176B68] flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

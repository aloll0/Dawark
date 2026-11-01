'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ArrowRight, Building2, Sparkles } from 'lucide-react';

interface ClinicSummary {
  _id: string;
  name: string;
  subscriptionStatus: string;
}

export default function PatientLandingPage() {
  const [clinics, setClinics] = useState<ClinicSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/clinics');
        const data = await res.json();
        if (data.success && data.clinics) {
          setClinics(data.clinics.filter((c: ClinicSummary) => c.subscriptionStatus === 'active'));
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
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#36B8A4] text-[#123B4A] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
          <QrCode className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-[#123B4A] mb-2">
          Dawrak Digital Patient Check-in
        </h1>
        <p className="text-xs sm:text-sm text-[#176B68]">
          Select your clinic below to register for a live digital queue ticket and track your turn in real time.
        </p>
      </div>

      <div className="bg-white border border-[#D6E8E3] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#176B68] mb-4">
          Select Active Clinic
        </h2>

        {loading ? (
          <div className="py-6 text-center text-sm text-[#176B68]">Loading clinics...</div>
        ) : clinics.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#176B68]">
            No active clinics found. Please activate clinics from Super Admin or run seed.
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map((clinic) => (
              <Link
                key={clinic._id}
                href={`/q/${clinic._id}`}
                className="group p-4 bg-[#F7FAFC] hover:bg-[#E8F5F2] border border-[#D6E8E3] hover:border-[#36B8A4] rounded-lg flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white text-[#176B68] flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#123B4A] group-hover:text-[#176B68]">
                      {clinic.name}
                    </div>
                    <div className="text-[11px] text-[#176B68]">Instant QR Check-in</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#176B68] group-hover:text-[#123B4A]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

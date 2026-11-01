'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Stethoscope,
  QrCode,
  Zap,
  PhoneCall,
  Clock,
  ArrowRight,
  Database,
  CheckCircle,
} from 'lucide-react';

interface ClinicSummary {
  _id: string;
  name: string;
  subscriptionStatus: string;
}

export default function HomePage() {
  const [clinics, setClinics] = useState<ClinicSummary[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const fetchClinics = async () => {
    try {
      setLoadingClinics(true);
      const res = await fetch('/api/clinics');
      const data = await res.json();
      if (data.success && data.clinics) {
        setClinics(data.clinics);
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedMessage('Demo clinics, doctors, and live tickets seeded successfully!');
        fetchClinics();
      } else {
        setSeedMessage(`Seed notice: ${data.message}`);
      }
    } catch {
      setSeedMessage('Failed to trigger seed.');
    } finally {
      setSeeding(false);
    }
  };

  const primaryClinic = clinics[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="bg-[#F7FAFC] border border-[#D6E8E3] rounded-xl p-8 mb-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#E8F5F2] border border-[#36B8A4]/30 px-3 py-1 rounded text-xs font-semibold text-[#176B68] mb-4">
              <Zap className="w-3.5 h-3.5 text-[#36B8A4]" />
              B2B SaaS Medical Queue Solution • دورك
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#123B4A] tracking-tight leading-tight mb-4">
              Dawrak Clinic Queue Management System
            </h1>
            <p className="text-base sm:text-lg text-[#176B68] leading-relaxed mb-6 font-normal">
              Eliminate waiting room chaos with real-time digital ticketing, atomic zero-race-condition queueing,
              and automated estimated wait times. Built strictly for high-throughput medical clinics.
            </p>

            {/* Quick Seed Action */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-2 bg-[#176B68] hover:bg-[#123B4A] text-[#F7FAFC] px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                <Database className="w-4 h-4 text-[#36B8A4]" />
                {seeding ? 'Seeding Database...' : 'Seed Sample Clinics & Queue'}
              </button>

              {primaryClinic && (
                <Link
                  href={`/clinic/${primaryClinic._id}`}
                  className="inline-flex items-center gap-2 bg-[#36B8A4] hover:bg-[#2fa391] text-[#123B4A] px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                  <span>Open {primaryClinic.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {seedMessage && (
              <div className="mt-4 p-3 bg-[#E8F5F2] border border-[#36B8A4] text-[#123B4A] rounded text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-[#36B8A4] shrink-0" />
                <span>{seedMessage}</span>
              </div>
            )}
          </div>

          {/* Official Logo Banner */}
          <div className="shrink-0 w-full lg:w-auto flex justify-center">
            <div className="bg-white border border-[#D6E8E3] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center max-w-xs">
              <img
                src="/logo.png"
                alt="دورك Dawrak Medical SaaS"
                className="w-56 h-auto object-contain hover:scale-105 transition-transform duration-200"
              />
              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-[#123B4A] block">نظام دورك لإدارة العيادات</span>
                <span className="text-[11px] text-[#176B68]">Smart Digital Queue Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three Isolated Flows Cards */}
      <h2 className="text-xl font-bold text-[#123B4A] mb-6 flex items-center gap-2">
        <span>Application Flows (Multi-Tenant Architecture)</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Flow 1: Super Admin */}
        <div className="bg-[#F7FAFC] border border-[#D6E8E3] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#123B4A] text-[#36B8A4] rounded flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
              Flow A • Super Admin
            </div>
            <h3 className="text-lg font-bold text-[#123B4A] mb-2">
              Subscription & Platform Admin
            </h3>
            <p className="text-sm text-[#176B68] mb-4 leading-normal">
              Review all registered medical clinics, approve/renew manual subscriptions, adjust doctor limits,
              and manage InstaPay/Vodafone Cash manual billing.
            </p>
          </div>
          <Link
            href="/super-admin"
            className="inline-flex items-center justify-center gap-2 bg-[#123B4A] hover:bg-[#176B68] text-[#F7FAFC] py-2.5 px-4 rounded text-sm font-semibold transition-colors"
          >
            <span>Access Super Admin</span>
            <ArrowRight className="w-4 h-4 text-[#36B8A4]" />
          </Link>
        </div>

        {/* Flow 2: Clinic Dashboard */}
        <div className="bg-[#F7FAFC] border border-[#D6E8E3] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#176B68] text-[#F7FAFC] rounded flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
              Flow B • Clinic Staff
            </div>
            <h3 className="text-lg font-bold text-[#123B4A] mb-2">
              Live Queue & Doctor Management
            </h3>
            <p className="text-sm text-[#176B68] mb-4 leading-normal">
              Manage doctor quotas, execute real-time Call / Complete / Next patient actions, generate printable
              desk QR codes, and reach technical support.
            </p>
          </div>
          <Link
            href="/clinic"
            className="inline-flex items-center justify-center gap-2 bg-[#176B68] hover:bg-[#123B4A] text-[#F7FAFC] py-2.5 px-4 rounded text-sm font-semibold transition-colors"
          >
            <span>Clinic Portal Index</span>
            <ArrowRight className="w-4 h-4 text-[#36B8A4]" />
          </Link>
        </div>

        {/* Flow 3: Patient Web App */}
        <div className="bg-[#F7FAFC] border border-[#D6E8E3] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#36B8A4] text-[#123B4A] rounded flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
              Flow C • Patient App
            </div>
            <h3 className="text-lg font-bold text-[#123B4A] mb-2">
              QR Code Digital Ticket
            </h3>
            <p className="text-sm text-[#176B68] mb-4 leading-normal">
              Lightweight mobile web app accessed instantly via QR scan. Dynamic wait times, sequential queue number,
              and live WebSocket turn notifications.
            </p>
          </div>
          <Link
            href="/q"
            className="inline-flex items-center justify-center gap-2 bg-[#36B8A4] hover:bg-[#2fa391] text-[#123B4A] py-2.5 px-4 rounded text-sm font-bold transition-colors"
          >
            <span>Patient Scan Portal</span>
            <ArrowRight className="w-4 h-4 text-[#123B4A]" />
          </Link>
        </div>
      </div>

      {/* Active Clinics Directory */}
      <div className="bg-[#F7FAFC] border border-[#D6E8E3] rounded-lg p-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#123B4A]">Registered Clinics in System</h3>
          <span className="text-xs font-medium text-[#176B68]">
            {clinics.length} {clinics.length === 1 ? 'Clinic' : 'Clinics'} Found
          </span>
        </div>

        {loadingClinics ? (
          <div className="py-6 text-center text-sm text-[#176B68]">Loading clinics...</div>
        ) : clinics.length === 0 ? (
          <div className="py-8 text-center bg-[#E8F5F2] rounded border border-[#D6E8E3]">
            <p className="text-sm font-medium text-[#123B4A] mb-2">No clinics found yet.</p>
            <p className="text-xs text-[#176B68] mb-4">
              Click &quot;Seed Sample Clinics &amp; Queue&quot; above to populate demo clinics and live queues.
            </p>
            <button
              onClick={handleSeed}
              className="bg-[#123B4A] text-[#F7FAFC] px-4 py-2 rounded text-xs font-semibold"
            >
              Seed Demo Clinics Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map((clinic) => (
              <div
                key={clinic._id}
                className="p-4 bg-white border border-[#D6E8E3] rounded flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
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
                    <span className="text-[10px] text-gray-400 font-mono">
                      ID: {clinic._id.slice(-6)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#123B4A] mb-3">{clinic.name}</h4>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/clinic/${clinic._id}`}
                    className="flex-1 text-center py-1.5 bg-[#176B68] text-white rounded text-xs font-medium hover:bg-[#123B4A]"
                  >
                    Clinic Dashboard
                  </Link>
                  <Link
                    href={`/q/${clinic._id}`}
                    className="flex-1 text-center py-1.5 bg-[#E8F5F2] text-[#123B4A] border border-[#36B8A4] rounded text-xs font-medium hover:bg-[#36B8A4]"
                  >
                    Patient App
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[#123B4A]">
        <div className="p-4 bg-[#F7FAFC] border border-[#D6E8E3] rounded flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#36B8A4] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Zero Race Condition</div>
            <div className="text-xs text-[#176B68] mt-0.5">
              Atomic MongoDB $inc guarantees strictly sequential queue numbering under simultaneous scans.
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F7FAFC] border border-[#D6E8E3] rounded flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#36B8A4] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Dynamic Wait Estimates</div>
            <div className="text-xs text-[#176B68] mt-0.5">
              Computed on-the-fly based on patients ahead multiplied by doctor&apos;s average session minutes.
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F7FAFC] border border-[#D6E8E3] rounded flex items-start gap-3">
          <PhoneCall className="w-5 h-5 text-[#36B8A4] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Persistent Support</div>
            <div className="text-xs text-[#176B68] mt-0.5">
              Floating direct WhatsApp technical support link configured for clinic administrators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

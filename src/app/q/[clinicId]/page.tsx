'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  User,
  Phone,
  Calendar,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RefreshCw,
  ArrowLeft,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { useQueueSocket } from '@/hooks/useSocket';

interface DoctorItem {
  _id: string;
  name: string;
  specialization: string;
  avgSessionTime: number;
}

interface ClinicSummary {
  _id: string;
  name: string;
  phone: string;
  subscriptionStatus: string;
}

interface DigitalTicket {
  _id: string;
  queueNumber: number;
  patientName: string;
  patientPhone: string;
  age: number;
  gender: 'Male' | 'Female';
  status: 'waiting' | 'in-session' | 'completed';
  estimatedWaitTime: number;
  patientsAhead: number;
  avgSessionTime: number;
  doctorId: DoctorItem;
  createdAt: string;
}

function PatientQrAppContent({
  clinicId,
}: {
  clinicId: string;
}) {
  const searchParams = useSearchParams();
  const preselectedDocId = searchParams.get('doctorId');

  const [clinic, setClinic] = useState<ClinicSummary | null>(null);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(true);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Ticket State
  const [ticket, setTicket] = useState<DigitalTicket | null>(null);

  // Socket.io for Real-Time Sync
  const { isConnected } = useQueueSocket(clinicId, ticket?._id);

  // Check LocalStorage for existing active ticket for this clinic
  useEffect(() => {
    const savedTicketId = localStorage.getItem(`dawrak_ticket_${clinicId}`);
    if (savedTicketId) {
      fetchTicketDetails(savedTicketId);
    }
  }, [clinicId]);

  // Fetch Clinic & Doctors
  useEffect(() => {
    async function init() {
      try {
        setLoadingClinic(true);
        const [clinicRes, docRes] = await Promise.all([
          fetch(`/api/clinics/${clinicId}`),
          fetch(`/api/clinics/${clinicId}/doctors`),
        ]);
        const clinicData = await clinicRes.json();
        const docData = await docRes.json();

        if (clinicData.success && clinicData.clinic) {
          setClinic(clinicData.clinic);
        }
        if (docData.success && docData.doctors) {
          setDoctors(docData.doctors);
          if (preselectedDocId && docData.doctors.some((d: DoctorItem) => d._id === preselectedDocId)) {
            setSelectedDoctorId(preselectedDocId);
          } else if (docData.doctors.length > 0) {
            setSelectedDoctorId(docData.doctors[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load clinic or doctors:', err);
      } finally {
        setLoadingClinic(false);
      }
    }
    init();
  }, [clinicId, preselectedDocId]);

  // Fetch existing ticket details
  const fetchTicketDetails = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}/queue/${ticketId}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        setTicket(data.ticket);
      } else {
        localStorage.removeItem(`dawrak_ticket_${clinicId}`);
      }
    } catch (err) {
      console.error('Failed to refresh ticket:', err);
    }
  }, [clinicId]);

  // Poll fallback to update patients ahead and status every 4 seconds
  useEffect(() => {
    if (!ticket?._id || ticket.status === 'completed') return;

    const interval = setInterval(() => {
      fetchTicketDetails(ticket._id);
    }, 4000);

    return () => clearInterval(interval);
  }, [ticket?._id, ticket?.status, fetchTicketDetails]);

  // Register Patient Ticket (Atomic Zero Race Condition)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientName.trim() || !patientPhone.trim() || !age) {
      setErrorMsg('Please complete all form fields.');
      return;
    }

    if (!selectedDoctorId) {
      setErrorMsg('Please select a doctor.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/clinics/${clinicId}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          patientName,
          patientPhone,
          age: parseInt(age, 10),
          gender,
        }),
      });

      const data = await res.json();

      if (data.success && data.ticket) {
        setTicket({
          ...data.ticket,
          patientsAhead: data.patientsAhead || 0,
        });
        localStorage.setItem(`dawrak_ticket_${clinicId}`, data.ticket._id);
      } else {
        setErrorMsg(data.message || 'Failed to create queue ticket');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetTicket = () => {
    localStorage.removeItem(`dawrak_ticket_${clinicId}`);
    setTicket(null);
    setPatientName('');
    setPatientPhone('');
    setAge('');
  };

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Dawrak Patient Branding */}
      <div className="flex items-center justify-center mb-4">
        <div className="bg-white px-3.5 py-1.5 rounded-xl border border-[#D6E8E3] shadow-sm flex items-center gap-2.5">
          <img src="/logo.png" alt="Dawrak دورك" className="h-6 w-auto object-contain" />
          <span className="text-[11px] text-[#176B68] font-semibold border-l border-[#D6E8E3] pl-2.5">
            نظام دورك الرقمي المباشر
          </span>
        </div>
      </div>

      {/* Top Clinic Identification */}
      <div className="bg-white border border-[#D6E8E3] rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F5F2] text-[#176B68] rounded-lg flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#176B68] font-semibold uppercase tracking-wider">
                Digital Check-in
              </div>
              <h1 className="text-base font-bold text-[#123B4A]">
                {loadingClinic ? 'Loading Clinic...' : clinic?.name || 'Clinic'}
              </h1>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              isConnected
                ? 'bg-[#E8F5F2] text-[#176B68] border border-[#36B8A4]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Radio className={`w-3 h-3 ${isConnected ? 'text-[#36B8A4] animate-pulse' : 'text-gray-400'}`} />
            <span>{isConnected ? 'Live' : 'Syncing'}</span>
          </div>
        </div>

        {clinic && clinic.subscriptionStatus !== 'active' && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs font-medium">
            This clinic is currently pending subscription approval. New ticket generation is paused.
          </div>
        )}
      </div>

      {/* SCREEN 1: REGISTRATION FORM */}
      {!ticket ? (
        <div className="bg-white border border-[#D6E8E3] rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#36B8A4] text-[#123B4A] rounded-full mx-auto flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-xl font-black text-[#123B4A]">Get Queue Ticket</h2>
            <p className="text-xs text-[#176B68] mt-1">
              Enter your patient details to receive an instant live digital queue position.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
                Select Doctor / Clinic Department *
              </label>
              {doctors.length === 0 ? (
                <div className="text-xs text-gray-500 p-2.5 bg-[#F7FAFC] rounded border border-[#D6E8E3]">
                  No doctors currently registered for this clinic.
                </div>
              ) : (
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-sm bg-[#F7FAFC] border border-[#D6E8E3] rounded-lg p-2.5 font-medium text-[#123B4A] focus:outline-none focus:border-[#176B68]"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.specialization} (~{d.avgSessionTime}m avg)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
                Patient Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Mahmoud Mostafa"
                  className="w-full text-sm border border-[#D6E8E3] rounded-lg p-2.5 pl-3 focus:outline-none focus:border-[#176B68]"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="e.g. 01012345678"
                className="w-full text-sm border border-[#D6E8E3] rounded-lg p-2.5 focus:outline-none focus:border-[#176B68]"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 32"
                  className="w-full text-sm border border-[#D6E8E3] rounded-lg p-2.5 focus:outline-none focus:border-[#176B68]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#176B68] mb-1">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-full text-sm border border-[#D6E8E3] rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#176B68]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (clinic?.subscriptionStatus !== 'active')}
              className="w-full mt-2 bg-[#123B4A] hover:bg-[#176B68] text-white py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
            >
              {submitting ? 'Generating Ticket...' : 'Get Queue Ticket'}
            </button>
          </form>
        </div>
      ) : (
        /* SCREEN 2: LIVE DIGITAL TICKET */
        <div className="space-y-4">
          {/* Main Ticket Card */}
          <div className="bg-[#123B4A] text-white rounded-3xl p-6 shadow-xl border-2 border-[#176B68] relative overflow-hidden text-center">
            {/* Top Ticket Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#176B68]/60 text-xs text-[#A0C4BF] mb-4">
              <span>{clinic?.name}</span>
              <span className="font-mono">TICKET #{ticket.queueNumber}</span>
            </div>

            {/* Status Announcement Banner */}
            {ticket.status === 'in-session' ? (
              <div className="mb-5 p-3.5 bg-[#36B8A4] text-[#123B4A] rounded-xl font-black text-sm flex items-center justify-center gap-2 animate-bounce">
                <Volume2 className="w-5 h-5" />
                <span>IT&apos;S YOUR TURN! PLEASE ENTER DOCTOR&apos;S ROOM</span>
              </div>
            ) : ticket.status === 'completed' ? (
              <div className="mb-5 p-3 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Session Completed. Thank you!</span>
              </div>
            ) : (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[#176B68] text-[#36B8A4] rounded-full text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>You are in line</span>
              </div>
            )}

            {/* Giant Queue Number Display */}
            <div className="py-2">
              <div className="text-xs uppercase tracking-widest text-[#A0C4BF] font-semibold">
                Your Queue Number
              </div>
              <div className="text-6xl sm:text-7xl font-black text-[#36B8A4] tracking-tight my-1">
                #{ticket.queueNumber}
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {ticket.patientName}
              </div>
            </div>

            {/* Estimated Wait Time & Patients Ahead */}
            {ticket.status === 'waiting' && (
              <div className="mt-5 grid grid-cols-2 gap-3 pt-5 border-t border-[#176B68]/60">
                <div className="bg-[#176B68]/40 p-3 rounded-xl border border-[#176B68]">
                  <div className="text-[11px] uppercase tracking-wider text-[#A0C4BF] font-medium">
                    Est. Wait Time
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    ~{ticket.estimatedWaitTime || 0} <span className="text-xs font-normal">min</span>
                  </div>
                </div>

                <div className="bg-[#176B68]/40 p-3 rounded-xl border border-[#176B68]">
                  <div className="text-[11px] uppercase tracking-wider text-[#A0C4BF] font-medium">
                    Patients Ahead
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {ticket.patientsAhead || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Info */}
            <div className="mt-5 pt-4 border-t border-[#176B68]/40 text-xs text-[#A0C4BF] flex items-center justify-between">
              <div className="text-left">
                <div className="font-bold text-white text-sm">
                  {ticket.doctorId?.name || 'Assigned Doctor'}
                </div>
                <div>{ticket.doctorId?.specialization}</div>
              </div>
              <div className="text-right font-mono text-[10px]" suppressHydrationWarning>
                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Ticket Footer Action */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => fetchTicketDetails(ticket._id)}
              className="flex-1 py-2.5 bg-white border border-[#D6E8E3] rounded-lg text-xs font-bold text-[#123B4A] hover:bg-[#F7FAFC] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={handleResetTicket}
              className="py-2.5 px-4 bg-transparent text-gray-500 hover:text-red-600 rounded-lg text-xs font-semibold"
            >
              New Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientQrApp({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = use(params);
  return (
    <React.Suspense
      fallback={
        <div className="max-w-md mx-auto p-12 text-center text-[#176B68] font-medium">
          Loading Digital Ticket Check-in...
        </div>
      }
    >
      <PatientQrAppContent clinicId={clinicId} />
    </React.Suspense>
  );
}

'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Stethoscope,
  Users,
  UserPlus,
  Play,
  CheckCircle,
  Clock,
  QrCode,
  AlertTriangle,
  RefreshCw,
  Phone,
  Copy,
  ExternalLink,
  Trash2,
  Radio,
  Check,
} from 'lucide-react';
import { useQueueSocket } from '@/hooks/useSocket';
import SupportWidget from '@/components/SupportWidget';

interface DoctorData {
  _id: string;
  name: string;
  specialization: string;
  avgSessionTime: number;
}

interface TicketData {
  _id: string;
  queueNumber: number;
  patientName: string;
  patientPhone: string;
  age: number;
  gender: 'Male' | 'Female';
  status: 'waiting' | 'in-session' | 'completed';
  estimatedWaitTime: number;
  doctorId: DoctorData;
  createdAt: string;
}

interface ClinicDetails {
  _id: string;
  name: string;
  phone: string;
  whatsappSupport: string;
  subscriptionStatus: 'active' | 'pending' | 'inactive';
  maxDoctors: number;
  basePrice: number;
  currentDoctorCount: number;
}

function ClinicDashboardContent({ clinicId }: { clinicId: string }) {

  const [clinic, setClinic] = useState<ClinicDetails | null>(null);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'doctors' | 'qr'>('queue');

  // Modals & form state
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialization: '',
    avgSessionTime: 15,
  });
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [advancingQueue, setAdvancingQueue] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time Socket.io hook
  const { isConnected } = useQueueSocket(clinicId);

  // Fetch Clinic Info
  const fetchClinicData = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}`);
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinic(data.clinic);
      }
    } catch (err) {
      console.error('Failed to fetch clinic:', err);
    }
  }, [clinicId]);

  // Fetch Doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}/doctors`);
      const data = await res.json();
      if (data.success && data.doctors) {
        setDoctors(data.doctors);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  }, [clinicId]);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    try {
      let url = `/api/clinics/${clinicId}/queue`;
      if (selectedDoctorId !== 'all') {
        url += `?doctorId=${selectedDoctorId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  }, [clinicId, selectedDoctorId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClinicData(), fetchDoctors(), fetchTickets()]);
    setLoading(false);
  }, [fetchClinicData, fetchDoctors, fetchTickets]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Poll fallback every 4 seconds to guarantee state freshness
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTickets();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchTickets]);

  // Advance to Next Patient
  const handleCallNext = async (doctorIdToCall?: string) => {
    const docId = doctorIdToCall || (selectedDoctorId !== 'all' ? selectedDoctorId : doctors[0]?._id);
    if (!docId) {
      alert('Please add or select a doctor first.');
      return;
    }

    try {
      setAdvancingQueue(true);
      const res = await fetch(`/api/clinics/${clinicId}/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: docId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
      } else {
        alert(data.message || 'Failed to call next patient');
      }
    } catch (err) {
      console.error('Next patient error:', err);
    } finally {
      setAdvancingQueue(false);
    }
  };

  // Change individual ticket status
  const handleUpdateTicketStatus = async (ticketId: string, status: 'in-session' | 'completed') => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}/queue/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  // Create Doctor with MaxDoctors constraint check
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorError(null);

    if (!clinic) return;
    if (doctors.length >= clinic.maxDoctors) {
      setDoctorError(
        `Doctor quota limit (${clinic.maxDoctors} doctors) reached. Please upgrade your clinic subscription to add more doctors.`
      );
      return;
    }

    try {
      const res = await fetch(`/api/clinics/${clinicId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor),
      });
      const data = await res.json();
      if (data.success && data.doctor) {
        setDoctors((prev) => [...prev, data.doctor]);
        setShowAddDoctorModal(false);
        setNewDoctor({ name: '', specialization: '', avgSessionTime: 15 });
        fetchClinicData();
      } else {
        setDoctorError(data.message || 'Failed to add doctor');
      }
    } catch (err) {
      console.error('Add doctor error:', err);
      setDoctorError('Server error while adding doctor');
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to remove this doctor?')) return;
    try {
      const res = await fetch(`/api/clinics/${clinicId}/doctors/${doctorId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDoctors((prev) => prev.filter((d) => d._id !== doctorId));
        fetchClinicData();
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to delete doctor:', err);
    }
  };

  // Filtered tickets
  const inSessionTickets = tickets.filter((t) => t.status === 'in-session');
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  const completedTickets = tickets.filter((t) => t.status === 'completed');

  // Next up candidate
  const nextInLineTicket = waitingTickets[0];

  // QR Code URL
  const qrTargetUrl = mounted && typeof window !== 'undefined'
    ? `${window.location.origin}/q/${clinicId}${selectedDoctorId !== 'all' ? `?doctorId=${selectedDoctorId}` : ''}`
    : `/q/${clinicId}`;

  const handleCopyQrLink = () => {
    navigator.clipboard.writeText(qrTargetUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2000);
  };

  const isSubscriptionActive = clinic?.subscriptionStatus === 'active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Clinic Header Bar */}
      <div className="bg-white border border-[#D6E8E3] rounded-lg p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#123B4A] text-[#36B8A4] rounded flex items-center justify-center font-bold shrink-0">
              <Stethoscope className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#123B4A]">
                  {clinic ? clinic.name : 'Loading Clinic...'}
                </h1>
                {clinic && (
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
                )}
              </div>
              <div className="text-xs text-[#176B68] flex items-center gap-3 mt-1">
                <span>Phone: {clinic?.phone}</span>
                <span>•</span>
                <span className="font-mono">ID: {clinicId.slice(-6)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#123B4A]">
                  <img src="/logo.png" alt="Dawrak" className="h-3.5 w-auto inline-block" />
                  دورك
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time sync status indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
                isConnected
                  ? 'bg-[#E8F5F2] text-[#176B68] border border-[#36B8A4]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-[#36B8A4] animate-pulse' : 'text-amber-500'}`} />
              <span>{isConnected ? 'Socket.io Live' : 'Auto-Sync Active'}</span>
            </div>

            <button
              onClick={refreshAll}
              className="p-2 border border-[#D6E8E3] rounded hover:bg-[#F7FAFC] text-[#123B4A]"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Inactive or Pending Warning */}
        {!isSubscriptionActive && clinic && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span>
                Clinic subscription is currently <strong>{clinic.subscriptionStatus}</strong>. Patient registrations will be blocked until approved by Super Admin.
              </span>
              <span className="ml-2 underline">
                Send renewal transfer to InstaPay/Vodafone Cash: <strong>+201010428244</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D6E8E3] mb-6">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-[#123B4A] text-[#123B4A]'
              : 'border-transparent text-[#176B68] hover:text-[#123B4A]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Queue Monitor</span>
          <span className="bg-[#E8F5F2] text-[#176B68] px-2 py-0.5 rounded-full text-xs">
            {waitingTickets.length} waiting
          </span>
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'border-[#123B4A] text-[#123B4A]'
              : 'border-transparent text-[#176B68] hover:text-[#123B4A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Doctors &amp; Quota</span>
          <span className="bg-[#E8F5F2] text-[#176B68] px-2 py-0.5 rounded-full text-xs">
            {doctors.length}/{clinic?.maxDoctors || 3}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'qr'
              ? 'border-[#123B4A] text-[#123B4A]'
              : 'border-transparent text-[#176B68] hover:text-[#123B4A]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Desk QR Code</span>
        </button>
      </div>

      {/* TAB 1: LIVE QUEUE MONITOR */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Doctor filter & Global Call Next Bar */}
          <div className="bg-white border border-[#D6E8E3] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-[#176B68] uppercase tracking-wider">
                Filter by Doctor:
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="text-xs sm:text-sm bg-[#F7FAFC] border border-[#D6E8E3] rounded px-3 py-1.5 focus:outline-none focus:border-[#176B68] font-medium"
              >
                <option value="all">All Doctors ({doctors.length})</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleCallNext()}
              disabled={advancingQueue || waitingTickets.length === 0}
              className="inline-flex items-center gap-2 bg-[#176B68] hover:bg-[#123B4A] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Play className="w-4 h-4 fill-current text-[#36B8A4]" />
              <span>{advancingQueue ? 'Calling...' : 'Call Next Patient'}</span>
            </button>
          </div>

          {/* Real-time In-Session Highlight Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Currently In Session Card */}
            <div className="lg:col-span-2 bg-[#123B4A] text-[#F7FAFC] border border-[#176B68] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#176B68] mb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#36B8A4]">
                  <Radio className="w-4 h-4 animate-pulse" />
                  Currently In Session (Doctor&apos;s Room)
                </div>
                <span className="text-xs text-[#A0C4BF]">
                  {inSessionTickets.length} Active Now
                </span>
              </div>

              {inSessionTickets.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#A0C4BF]">
                  No patient currently in session. Click &quot;Call Next Patient&quot; when the doctor is ready.
                </div>
              ) : (
                <div className="space-y-4">
                  {inSessionTickets.map((t) => (
                    <div
                      key={t._id}
                      className="bg-[#176B68]/30 border border-[#176B68] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#36B8A4] text-[#123B4A] rounded-lg flex flex-col items-center justify-center font-black">
                          <span className="text-[10px] uppercase font-bold leading-none">Ticket</span>
                          <span className="text-2xl leading-none">#{t.queueNumber}</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">{t.patientName}</div>
                          <div className="text-xs text-[#A0C4BF] flex items-center gap-3 mt-1">
                            <span>Phone: {t.patientPhone}</span>
                            <span>•</span>
                            <span>Age: {t.age} ({t.gender})</span>
                          </div>
                          <div className="text-xs text-[#36B8A4] mt-1 font-medium">
                            Doctor: {t.doctorId?.name} ({t.doctorId?.specialization})
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpdateTicketStatus(t._id, 'completed')}
                        className="inline-flex items-center justify-center gap-2 bg-[#36B8A4] hover:bg-[#2fa391] text-[#123B4A] px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete Session</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Up Card */}
            <div className="bg-white border border-[#D6E8E3] rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#D6E8E3] mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176B68]">
                    Next In Line
                  </div>
                  <span className="text-xs font-semibold text-gray-500">Position #1</span>
                </div>

                {nextInLineTicket ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-[#E8F5F2] text-[#123B4A] border border-[#36B8A4] rounded flex items-center justify-center font-black text-xl">
                        #{nextInLineTicket.queueNumber}
                      </div>
                      <div>
                        <div className="font-bold text-base text-[#123B4A]">
                          {nextInLineTicket.patientName}
                        </div>
                        <div className="text-xs text-[#176B68]">
                          {nextInLineTicket.patientPhone} • {nextInLineTicket.gender}, {nextInLineTicket.age} yrs
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-[#176B68] bg-[#F7FAFC] p-2.5 rounded border border-[#D6E8E3] mb-4">
                      Assigned Doctor: <strong>{nextInLineTicket.doctorId?.name}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No waiting patients in queue.
                  </div>
                )}
              </div>

              {nextInLineTicket && (
                <button
                  onClick={() => handleUpdateTicketStatus(nextInLineTicket._id, 'in-session')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#123B4A] hover:bg-[#176B68] text-white py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#36B8A4]" />
                  <span>Call to Room Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Waiting Queue List */}
          <div className="bg-white border border-[#D6E8E3] rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#D6E8E3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#123B4A]">Waiting Queue</h3>
                <span className="text-xs bg-[#E8F5F2] text-[#176B68] px-2 py-0.5 rounded font-bold">
                  {waitingTickets.length} Patients Waiting
                </span>
              </div>
            </div>

            {waitingTickets.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#176B68]">
                Waiting list is currently empty. Patients scanning the desk QR code will appear here in real-time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F7FAFC] text-[#176B68] border-b border-[#D6E8E3] text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Queue #</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Est. Wait</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E8E3] text-[#123B4A]">
                    {waitingTickets.map((t, idx) => (
                      <tr key={t._id} className="hover:bg-[#F7FAFC]">
                        <td className="py-3 px-4 font-black text-sm text-[#176B68]">
                          #{t.queueNumber}
                          {idx === 0 && (
                            <span className="ml-2 text-[10px] bg-[#36B8A4] text-[#123B4A] px-1.5 py-0.5 rounded font-bold">
                              NEXT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold">{t.patientName}</td>
                        <td className="py-3 px-4 font-mono text-xs">{t.patientPhone}</td>
                        <td className="py-3 px-4 text-xs">{t.doctorId?.name}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-[#176B68]">
                          ~{idx * (t.doctorId?.avgSessionTime || 15)} mins
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleUpdateTicketStatus(t._id, 'in-session')}
                            className="bg-[#123B4A] hover:bg-[#176B68] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Call Patient
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Served / Completed Patients Summary */}
          {completedTickets.length > 0 && (
            <div className="bg-white border border-[#D6E8E3] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-xs text-[#176B68] uppercase tracking-wider">
                  Completed Sessions Today ({completedTickets.length})
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {completedTickets.map((t) => (
                  <span
                    key={t._id}
                    className="inline-flex items-center gap-1.5 bg-[#E8F5F2] border border-[#D6E8E3] text-[#123B4A] px-2.5 py-1 rounded text-xs font-medium"
                  >
                    <Check className="w-3 h-3 text-[#36B8A4]" />
                    <span>#{t.queueNumber} {t.patientName}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCTOR MANAGEMENT & QUOTA ENFORCEMENT */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Quota Progress Card */}
          <div className="bg-white border border-[#D6E8E3] rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#123B4A]">Doctor Quota &amp; Capacity</h3>
                <p className="text-xs text-[#176B68]">
                  Enforced by clinic subscription. Base plan includes up to {clinic?.maxDoctors || 3} doctors.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#123B4A]">
                  {doctors.length} of {clinic?.maxDoctors || 3} Doctors Used
                </span>
                <button
                  onClick={() => setShowAddDoctorModal(true)}
                  disabled={doctors.length >= (clinic?.maxDoctors || 3)}
                  className="inline-flex items-center gap-2 bg-[#123B4A] hover:bg-[#176B68] text-white px-4 py-2 rounded text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4 text-[#36B8A4]" />
                  <span>Add Doctor</span>
                </button>
              </div>
            </div>

            {/* Quota Progress Bar */}
            <div className="w-full bg-[#E8F5F2] h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  doctors.length >= (clinic?.maxDoctors || 3) ? 'bg-amber-500' : 'bg-[#36B8A4]'
                }`}
                style={{
                  width: `${Math.min(100, (doctors.length / (clinic?.maxDoctors || 3)) * 100)}%`,
                }}
              />
            </div>

            {doctors.length >= (clinic?.maxDoctors || 3) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-center justify-between">
                <span>
                  <strong>Doctor limit reached!</strong> You have filled all {clinic?.maxDoctors} allowed doctor slots for this subscription tier.
                </span>
                <Link
                  href="/super-admin"
                  className="underline font-bold text-amber-950 hover:text-black shrink-0 ml-2"
                >
                  Upgrade via Super Admin
                </Link>
              </div>
            )}
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="bg-white border border-[#D6E8E3] rounded-lg p-5 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#E8F5F2] text-[#176B68] rounded flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <button
                      onClick={() => handleDeleteDoctor(doctor._id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove Doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-bold text-base text-[#123B4A] mb-1">{doctor.name}</h4>
                  <div className="text-xs text-[#176B68] mb-3">{doctor.specialization}</div>

                  <div className="text-xs bg-[#F7FAFC] border border-[#D6E8E3] rounded p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Session:</span>
                      <span className="font-bold text-[#123B4A]">{doctor.avgSessionTime} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-mono">ID: {doctor._id.slice(-6)}</span>
                  <button
                    onClick={() => {
                      setSelectedDoctorId(doctor._id);
                      setActiveTab('queue');
                    }}
                    className="text-xs font-bold text-[#176B68] hover:text-[#123B4A]"
                  >
                    View Queue →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FRONT DESK QR CODE GENERATOR */}
      {activeTab === 'qr' && (
        <div className="max-w-2xl mx-auto bg-white border border-[#D6E8E3] rounded-xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 bg-[#36B8A4] text-[#123B4A] rounded-full mx-auto flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>

          <h3 className="text-xl font-black text-[#123B4A] mb-2">
            Front Desk Patient QR Code
          </h3>
          <p className="text-xs sm:text-sm text-[#176B68] max-w-md mx-auto mb-6">
            Print or display this QR code at the clinic reception. Patients scan it with their phone camera to instantly reserve a queue ticket without downloading any app.
          </p>

          {/* Render QR Code */}
          <div className="inline-block p-6 bg-[#F7FAFC] border-2 border-[#176B68] rounded-2xl shadow-inner mb-6">
            <QRCodeSVG
              value={qrTargetUrl}
              size={220}
              level="H"
              fgColor="#123B4A"
              bgColor="#F7FAFC"
            />
            <div className="mt-3 text-xs font-bold text-[#123B4A] tracking-wider uppercase">
              {clinic?.name}
            </div>
            <div className="text-[11px] text-[#176B68]">Scan for Digital Ticket</div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleCopyQrLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#176B68] hover:bg-[#123B4A] text-white px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors"
            >
              {copiedQrUrl ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>URL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Patient URL</span>
                </>
              )}
            </button>

            <Link
              href={`/q/${clinicId}`}
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E8F5F2] hover:bg-[#D6E8E3] text-[#123B4A] border border-[#36B8A4] px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>Test Patient View</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#D6E8E3] shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6E8E3] mb-4">
              <h3 className="text-base font-bold text-[#123B4A]">Add Doctor to Clinic</h3>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {doctorError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{doctorError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  placeholder="e.g. Dr. Hisham Rashed"
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Specialization / Department *
                </label>
                <input
                  type="text"
                  required
                  value={newDoctor.specialization}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, specialization: e.target.value })
                  }
                  placeholder="e.g. Ophthalmology &amp; Lasik"
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Average Session Time (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={newDoctor.avgSessionTime}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      avgSessionTime: parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Used to dynamically compute live estimated wait times for patients in queue.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D6E8E3]">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 border border-[#D6E8E3] rounded text-xs font-semibold text-[#176B68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#123B4A] hover:bg-[#176B68] text-white rounded text-xs font-bold transition-colors"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent WhatsApp Support Widget (Prompt Requirement) */}
      <SupportWidget clinicName={clinic?.name} />
    </div>
  );
}

export default function ClinicDashboardPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = use(params);
  return (
    <React.Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-[#176B68] font-medium">
          Loading Clinic Dashboard...
        </div>
      }
    >
      <ClinicDashboardContent clinicId={clinicId} />
    </React.Suspense>
  );
}

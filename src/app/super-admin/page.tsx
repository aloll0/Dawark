'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  MessageSquare,
  Users,
} from 'lucide-react';

interface ClinicData {
  _id: string;
  name: string;
  phone: string;
  whatsappSupport: string;
  subscriptionStatus: 'active' | 'pending' | 'inactive';
  maxDoctors: number;
  basePrice: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPayment, setCopiedPayment] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New clinic form
  const [newClinic, setNewClinic] = useState<{
    name: string;
    phone: string;
    whatsappSupport: string;
    maxDoctors: number;
    basePrice: number;
    subscriptionStatus: 'active' | 'pending' | 'inactive';
  }>({
    name: '',
    phone: '',
    whatsappSupport: '+201010428244',
    maxDoctors: 3,
    basePrice: 2000,
    subscriptionStatus: 'active',
  });

  const paymentInstructions =
    'For subscription renewals (Base: 2000 EGP/month for up to 3 doctors. Additional cost for extra doctors), transfer via InstaPay or Vodafone Cash to +201010428244';

  const fetchClinics = async () => {
    try {
      setLoading(true);
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
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleCopyPayment = () => {
    navigator.clipboard.writeText(paymentInstructions);
    setCopiedPayment(true);
    setTimeout(() => setCopiedPayment(false), 2500);
  };

  const handleStatusChange = async (
    clinicId: string,
    newStatus: 'active' | 'pending' | 'inactive'
  ) => {
    try {
      setUpdatingId(clinicId);
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setClinics((prev) =>
          prev.map((c) => (c._id === clinicId ? { ...c, subscriptionStatus: newStatus } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMaxDoctorsChange = async (clinicId: string, currentVal: number, delta: number) => {
    const newVal = Math.max(1, currentVal + delta);
    try {
      setUpdatingId(clinicId);
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDoctors: newVal }),
      });
      const data = await res.json();
      if (data.success) {
        setClinics((prev) =>
          prev.map((c) => (c._id === clinicId ? { ...c, maxDoctors: newVal } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update max doctors:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinic.name || !newClinic.phone) return;

    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClinic),
      });
      const data = await res.json();
      if (data.success && data.clinic) {
        setClinics((prev) => [data.clinic, ...prev]);
        setShowAddModal(false);
        setNewClinic({
          name: '',
          phone: '',
          whatsappSupport: '+201010428244',
          maxDoctors: 3,
          basePrice: 2000,
          subscriptionStatus: 'active',
        });
      }
    } catch (err) {
      console.error('Failed to create clinic:', err);
    }
  };

  const filteredClinics = clinics.filter((c) => {
    if (filter === 'all') return true;
    return c.subscriptionStatus === filter;
  });

  const activeCount = clinics.filter((c) => c.subscriptionStatus === 'active').length;
  const pendingCount = clinics.filter((c) => c.subscriptionStatus === 'pending').length;
  const inactiveCount = clinics.filter((c) => c.subscriptionStatus === 'inactive').length;
  const totalMRR = clinics
    .filter((c) => c.subscriptionStatus === 'active')
    .reduce((sum, c) => sum + (c.basePrice || 2000), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-white border border-[#D6E8E3] rounded-xl px-3.5 py-1.5 items-center shadow-sm">
            <img src="/logo.png" alt="Dawrak دورك" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#176B68] mb-1">
              <ShieldCheck className="w-4 h-4 text-[#36B8A4]" />
              Platform Administration • دورك SaaS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#123B4A]">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-[#176B68]">
              Manage multi-tenant medical clinics, subscriptions, and payment approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClinics}
            className="p-2.5 bg-white border border-[#D6E8E3] rounded hover:bg-[#E8F5F2] text-[#123B4A] transition-colors"
            title="Refresh Clinics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#123B4A] hover:bg-[#176B68] text-[#F7FAFC] px-4 py-2.5 rounded text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#36B8A4]" />
            <span>Register Clinic</span>
          </button>
        </div>
      </div>

      {/* Manual Payment Instructions Box (Prompt requirement) */}
      <div className="bg-[#123B4A] text-[#F7FAFC] border-2 border-[#176B68] rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#36B8A4]">
              <MessageSquare className="w-4 h-4" />
              Manual Payment Instructions (Send to Clinics)
            </div>
            <p className="text-sm sm:text-base font-medium leading-relaxed text-[#F7FAFC] font-mono bg-[#176B68]/30 p-3 rounded border border-[#176B68]">
              &ldquo;{paymentInstructions}&rdquo;
            </p>
            <div className="text-xs text-[#A0C4BF]">
              Payment Methods: InstaPay / Vodafone Cash to <strong>+201010428244</strong>
            </div>
          </div>

          <button
            onClick={handleCopyPayment}
            className="self-start md:self-center inline-flex items-center gap-2 bg-[#36B8A4] hover:bg-[#2fa391] text-[#123B4A] px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all shrink-0"
          >
            {copiedPayment ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Instructions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#D6E8E3] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#176B68] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Clinics</span>
            <Building2 className="w-4 h-4 text-[#176B68]" />
          </div>
          <div className="text-2xl font-black text-[#123B4A]">{clinics.length}</div>
          <div className="text-[11px] text-[#176B68] mt-1">Registered clinics</div>
        </div>

        <div className="bg-white border border-[#D6E8E3] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#176B68] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Active Subscriptions</span>
            <CheckCircle2 className="w-4 h-4 text-[#36B8A4]" />
          </div>
          <div className="text-2xl font-black text-[#123B4A]">{activeCount}</div>
          <div className="text-[11px] text-[#176B68] mt-1">Live queue enabled</div>
        </div>

        <div className="bg-white border border-[#D6E8E3] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#176B68] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#123B4A]">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Awaiting manual payment check</div>
        </div>

        <div className="bg-white border border-[#D6E8E3] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#176B68] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Estimated MRR</span>
            <span className="text-xs font-bold text-[#176B68]">EGP</span>
          </div>
          <div className="text-2xl font-black text-[#123B4A]">
            {totalMRR.toLocaleString()} <span className="text-sm font-normal">EGP</span>
          </div>
          <div className="text-[11px] text-[#176B68] mt-1">Active monthly revenue</div>
        </div>
      </div>

      {/* Clinics Directory & Table */}
      <div className="bg-white border border-[#D6E8E3] rounded-lg overflow-hidden shadow-sm">
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#D6E8E3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#123B4A]">Registered Clinics</h2>
            <span className="text-xs bg-[#E8F5F2] text-[#176B68] px-2 py-0.5 rounded font-semibold">
              {filteredClinics.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded transition-colors ${
                filter === 'all'
                  ? 'bg-[#123B4A] text-white'
                  : 'bg-[#F7FAFC] text-[#176B68] hover:bg-[#E8F5F2]'
              }`}
            >
              All ({clinics.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded transition-colors ${
                filter === 'active'
                  ? 'bg-[#36B8A4] text-[#123B4A] font-bold'
                  : 'bg-[#F7FAFC] text-[#176B68] hover:bg-[#E8F5F2]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-400 text-amber-950 font-bold'
                  : 'bg-[#F7FAFC] text-[#176B68] hover:bg-[#E8F5F2]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1.5 rounded transition-colors ${
                filter === 'inactive'
                  ? 'bg-gray-400 text-gray-900 font-bold'
                  : 'bg-[#F7FAFC] text-[#176B68] hover:bg-[#E8F5F2]'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-sm text-[#176B68]">Loading clinics...</div>
        ) : filteredClinics.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#176B68]">
            No clinics found matching filter &quot;{filter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7FAFC] text-[#176B68] border-b border-[#D6E8E3] font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Clinic Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Doctors Quota</th>
                  <th className="py-3 px-4">Monthly Fee</th>
                  <th className="py-3 px-4">Subscription Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E8E3] text-[#123B4A]">
                {filteredClinics.map((clinic) => {
                  const isUpdating = updatingId === clinic._id;
                  return (
                    <tr key={clinic._id} className="hover:bg-[#F7FAFC]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#123B4A]">{clinic.name}</div>
                        <div className="text-[11px] text-[#176B68] font-mono">
                          ID: {clinic._id.slice(-8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">{clinic.phone}</td>

                      {/* Doctor Quota Adjustment */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-[#F7FAFC] border border-[#D6E8E3] rounded px-2 py-1">
                          <Users className="w-3.5 h-3.5 text-[#176B68]" />
                          <span className="font-bold text-xs">{clinic.maxDoctors}</span>
                          <span className="text-[11px] text-gray-500">docs</span>
                          <div className="flex flex-col ml-1">
                            <button
                              onClick={() => handleMaxDoctorsChange(clinic._id, clinic.maxDoctors, 1)}
                              disabled={isUpdating}
                              className="text-[9px] hover:text-[#36B8A4] font-bold leading-none px-0.5"
                              title="Increase Doctor Quota"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMaxDoctorsChange(clinic._id, clinic.maxDoctors, -1)}
                              disabled={isUpdating || clinic.maxDoctors <= 1}
                              className="text-[9px] hover:text-red-500 font-bold leading-none px-0.5 disabled:opacity-30"
                              title="Decrease Doctor Quota"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-xs">
                        {clinic.basePrice || 2000} EGP
                      </td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
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

                          <select
                            value={clinic.subscriptionStatus}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(
                                clinic._id,
                                e.target.value as 'active' | 'pending' | 'inactive'
                              )
                            }
                            className="text-xs bg-white border border-[#D6E8E3] rounded px-2 py-1 focus:outline-none focus:border-[#176B68]"
                          >
                            <option value="active">Approve (Active)</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Deactivate</option>
                          </select>
                        </div>
                      </td>

                      {/* External Links */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/clinic/${clinic._id}`}
                            className="inline-flex items-center gap-1 text-xs text-[#176B68] hover:text-[#123B4A] font-semibold bg-[#E8F5F2] hover:bg-[#D6E8E3] px-2.5 py-1.5 rounded transition-colors"
                          >
                            <span>Dashboard</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/q/${clinic._id}`}
                            className="inline-flex items-center gap-1 text-xs text-[#123B4A] hover:text-[#176B68] font-semibold border border-[#D6E8E3] hover:border-[#36B8A4] px-2.5 py-1.5 rounded transition-colors"
                          >
                            <span>QR App</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#D6E8E3] shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6E8E3] mb-4">
              <h3 className="text-base font-bold text-[#123B4A]">Register New Clinic</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                  placeholder="e.g. Al-Nour Medical Center"
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newClinic.phone}
                  onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                  placeholder="e.g. +201012345678"
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#176B68] mb-1">
                    Max Doctors
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newClinic.maxDoctors}
                    onChange={(e) =>
                      setNewClinic({ ...newClinic, maxDoctors: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#176B68] mb-1">
                    Base Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newClinic.basePrice}
                    onChange={(e) =>
                      setNewClinic({ ...newClinic, basePrice: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#176B68] mb-1">
                  Initial Subscription Status
                </label>
                <select
                  value={newClinic.subscriptionStatus}
                  onChange={(e) =>
                    setNewClinic({
                      ...newClinic,
                      subscriptionStatus: e.target.value as 'active' | 'pending' | 'inactive',
                    })
                  }
                  className="w-full text-xs sm:text-sm border border-[#D6E8E3] rounded p-2 focus:outline-none focus:border-[#176B68]"
                >
                  <option value="active">Active (Immediate Access)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D6E8E3]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#D6E8E3] rounded text-xs font-semibold text-[#176B68] hover:bg-[#F7FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#123B4A] hover:bg-[#176B68] text-white rounded text-xs font-bold transition-colors"
                >
                  Create Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

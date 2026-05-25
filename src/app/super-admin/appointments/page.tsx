'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, User, Phone, MapPin, Video, Building2, Home,
  CheckCircle2, XCircle, AlertCircle, Loader2, Eye, Filter, Download,
  IndianRupee, ChevronDown, ChevronUp, RefreshCw, Bell, MessageSquare,
  ArrowRight, CalendarClock, PhoneOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { AppointmentsAdminSkeleton, StackedCardsSkeleton } from '@/components/admin/AdminSkeletons';
import { DailyJoinButton } from '@/components/video/DailyJoinButton';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  location_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  mode: 'online' | 'offline' | 'home_visit';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  amount: number;
  notes: string | null;
  google_meet_link?: string | null;
  metadata?: {
    patient_name?: string;
    patient_phone?: string;
    center_name?: string;
    booked_at?: string;
    admin_video_url?: string; // Super admin owner link (host)
  } | null;
  created_at: string;
  patient?: { id: string; full_name: string; email: string; phone: string | null };
  doctor?: { id: string; users: { full_name: string; email: string } };
  service?: { id: string; name: string };
  location?: { id: string; city: string; name: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  paid: 'bg-green-50 text-green-600',
  refunded: 'bg-purple-50 text-purple-600',
  failed: 'bg-red-50 text-red-600',
};

const MODE_ICONS = {
  online: Video,
  offline: Building2,
  home_visit: Home,
};

interface RescheduleRequest {
  appointmentId: string;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  reason: string | null;
  requestStatus: string;
  requestedAt: string;
  requestedBy: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminNote: string | null;
  mode: string;
  appointmentStatus: string;
  amount: number;
  patient: { name: string; email: string; phone: string };
  doctor: { id: string | null; name: string };
  service: { id: string | null; name: string };
}

interface SlotData {
  time: string;
  endTime: string;
  available: boolean;
  duration: number;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'online'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'reschedule'>('appointments');
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [rescheduleFilter, setRescheduleFilter] = useState<string>('pending');
  // Slot picker state for admin rescheduling
  const [slotPickerOpen, setSlotPickerOpen] = useState<string | null>(null);
  const [slotPickerDate, setSlotPickerDate] = useState<string>('');
  const [slotPickerSlots, setSlotPickerSlots] = useState<SlotData[]>([]);
  const [slotPickerLoading, setSlotPickerLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endConsultationSuccess, setEndConsultationSuccess] = useState(false);
  /** Which status button is loading (avoids all buttons spinning together) */
  const [statusUpdating, setStatusUpdating] = useState<{ id: string; action: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchAppointments(); fetchRescheduleRequests(); }, []);

  const handleEndConsultation = async (appointmentId: string) => {
    setEndingId(appointmentId);
    try {
      const res = await fetch('/api/video/end-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEndConsultationSuccess(true);
        fetchAppointments();
      } else {
        setError(data.error || 'Failed to end consultation');
      }
    } catch {
      setError('Network error');
    } finally {
      setEndingId(null);
    }
  };

  const fetchRescheduleRequests = async () => {
    setRescheduleLoading(true);
    try {
      const res = await fetch('/api/admin/reschedule-requests?status=all');
      const data = await res.json();
      if (data.success) {
        setRescheduleRequests(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reschedule requests:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRescheduleAction = async (appointmentId: string, action: 'approve' | 'reject' | 'reschedule', customData?: { date: string; startTime: string; endTime?: string }) => {
    setProcessingId(appointmentId);
    setCollisionError(null);
    try {
      const payload: any = { action, adminNote: adminNotes[appointmentId] || '' };
      if (action === 'reschedule' && customData) {
        payload.customDate = customData.date;
        payload.customStartTime = customData.startTime;
        if (customData.endTime) payload.customEndTime = customData.endTime;
      }
      const res = await fetch(`/api/admin/reschedule-requests/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchRescheduleRequests();
        fetchAppointments();
        setAdminNotes(prev => ({ ...prev, [appointmentId]: '' }));
        setSlotPickerOpen(null);
        setSelectedSlot(null);
        setCollisionError(null);
      } else {
        if (data.collision || data.availabilityIssue) {
          setCollisionError(data.error);
          // Auto-open slot picker if collision detected
          if (!slotPickerOpen) {
            const req = rescheduleRequests.find(r => r.appointmentId === appointmentId);
            if (req?.doctor?.id) {
              setSlotPickerOpen(appointmentId);
              const targetDate = req.requestedDate;
              setSlotPickerDate(targetDate);
              fetchSlotsForDate(req.doctor.id, targetDate, appointmentId);
            }
          }
        } else {
          alert(data.error || 'Action failed');
        }
      }
    } catch (err) {
      alert('Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const fetchSlotsForDate = async (doctorId: string, date: string, appointmentId: string) => {
    setSlotPickerLoading(true);
    setSelectedSlot(null);
    try {
      const req = rescheduleRequests.find(r => r.appointmentId === appointmentId);
      const mode = req?.mode || 'offline';
      const res = await fetch(`/api/slots?doctorId=${doctorId}&date=${date}&mode=${mode}&duration=15`);
      const data = await res.json();
      if (data.success) {
        setSlotPickerSlots(data.data?.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setSlotPickerLoading(false);
    }
  };

  const handleAdminReschedule = (appointmentId: string) => {
    if (!selectedSlot) return;
    handleRescheduleAction(appointmentId, 'reschedule', {
      date: slotPickerDate,
      startTime: selectedSlot.time,
      endTime: selectedSlot.endTime,
    });
  };

  const pendingCount = rescheduleRequests.filter(r => r.requestStatus === 'pending').length;
  const filteredReschedule = rescheduleRequests.filter(r => rescheduleFilter === 'all' || r.requestStatus === rescheduleFilter);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    setStatusUpdating({ id: appointmentId, action: newStatus });
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? { ...a, status: (data.data?.status as Appointment['status']) || newStatus }
              : a
          )
        );
        const labels: Record<string, string> = {
          confirmed: 'Confirmed',
          completed: 'Completed',
          cancelled: 'Cancelled',
          no_show: 'Marked as no-show',
          pending: 'Pending',
        };
        setStatusMessage({
          id: appointmentId,
          text: `Appointment ${labels[newStatus] || newStatus}.`,
          tone: 'success',
        });
      } else {
        setStatusMessage({
          id: appointmentId,
          text: data.error || 'Could not update status',
          tone: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatusMessage({
        id: appointmentId,
        text: 'Network error — try again',
        tone: 'error',
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const isStatusLoading = (aptId: string, action: string) =>
    statusUpdating?.id === aptId && statusUpdating.action === action;

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    // Search filter
    const patientName = apt.metadata?.patient_name || apt.patient?.full_name || '';
    const patientPhone = apt.metadata?.patient_phone || apt.patient?.phone || '';
    const doctorName = apt.doctor?.users?.full_name || '';
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      patientName.toLowerCase().includes(searchLower) ||
      patientPhone.includes(searchQuery) ||
      doctorName.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    // Mode filter
    const matchesMode = modeFilter === 'all' || apt.mode === 'online';

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = isToday(parseISO(apt.appointment_date));
    } else if (dateFilter === 'tomorrow') {
      matchesDate = isTomorrow(parseISO(apt.appointment_date));
    } else if (dateFilter === 'past') {
      matchesDate = isPast(parseISO(apt.appointment_date)) && !isToday(parseISO(apt.appointment_date));
    }

    return matchesSearch && matchesStatus && matchesMode && matchesDate;
  });

  // Stats
  const stats = {
    total: appointments.length,
    today: appointments.filter(a => isToday(parseISO(a.appointment_date))).length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    revenue: appointments.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + (a.amount || 0), 0),
  };

  const ModeIcon = (mode: string) => MODE_ICONS[mode as keyof typeof MODE_ICONS] || Building2;

  if (loading) {
    return <AppointmentsAdminSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all patient appointments</p>
        </div>
        <Button onClick={fetchAppointments} variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'appointments'
              ? 'border-cyan-500 text-cyan-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Appointments
        </button>
        <button
          onClick={() => { setActiveTab('reschedule'); fetchRescheduleRequests(); }}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px flex items-center gap-2 ${
            activeTab === 'reschedule'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          Reschedule Requests
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />{error}
        </div>
      )}

      {/* Reschedule Requests Tab */}
      {activeTab === 'reschedule' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setRescheduleFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  rescheduleFilter === f
                    ? f === 'pending' ? 'bg-amber-500 text-white' :
                      f === 'approved' ? 'bg-emerald-500 text-white' :
                      f === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            ))}
          </div>

          {rescheduleLoading ? (
            <StackedCardsSkeleton count={3} />
          ) : filteredReschedule.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No {rescheduleFilter !== 'all' ? rescheduleFilter : ''} reschedule requests</p>
              <p className="text-sm text-gray-400 mt-1">Requests from patients will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReschedule.map(req => (
                <div key={req.appointmentId} className="bg-white rounded-xl border overflow-hidden">
                  {/* Request Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    req.requestStatus === 'pending' ? 'bg-amber-50 border-b border-amber-100' :
                    req.requestStatus === 'approved' ? 'bg-emerald-50 border-b border-emerald-100' :
                    'bg-red-50 border-b border-red-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs font-bold capitalize ${
                        req.requestStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                        req.requestStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.requestStatus}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Requested {format(parseISO(req.requestedAt), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">#{req.appointmentId.slice(0, 8)}</span>
                  </div>

                  <div className="p-5">
                    {/* Patient & Service Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{req.patient.name}</h3>
                        <p className="text-sm text-gray-500">{req.patient.phone} &bull; {req.patient.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{req.service.name}</p>
                        <p className="text-xs text-gray-500">{req.doctor.name}</p>
                      </div>
                    </div>

                    {/* Date Change Visual */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Current</p>
                        <p className="text-sm font-bold text-gray-900">{format(parseISO(req.currentDate), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-gray-500">{req.currentStartTime}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-amber-500 shrink-0" />
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Requested</p>
                        <p className="text-sm font-bold text-amber-700">{format(parseISO(req.requestedDate), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-amber-600">{req.requestedStartTime}</p>
                      </div>
                    </div>

                    {/* Reason */}
                    {req.reason && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Patient&apos;s Reason</p>
                        <p className="text-sm text-blue-900">{req.reason}</p>
                      </div>
                    )}

                    {/* Admin Note (for reviewed) */}
                    {req.adminNote && req.requestStatus !== 'pending' && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Admin Note</p>
                        <p className="text-sm text-gray-700">{req.adminNote}</p>
                        {req.reviewedBy && <p className="text-[10px] text-gray-400 mt-1">— {req.reviewedBy}</p>}
                      </div>
                    )}

                    {/* Action Buttons (only for pending) */}
                    {req.requestStatus === 'pending' && (
                      <div className="space-y-3">
                        {/* Collision / Availability Error */}
                        {collisionError && (slotPickerOpen === req.appointmentId || processingId === req.appointmentId) && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-700">{collisionError}</p>
                                <p className="text-xs text-red-500 mt-1">Use the slot picker below to choose an available time.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Admin Note (optional)</label>
                          <input
                            type="text"
                            value={adminNotes[req.appointmentId] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ ...prev, [req.appointmentId]: e.target.value }))}
                            placeholder="Add a note for the patient..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleRescheduleAction(req.appointmentId, 'approve')}
                            disabled={processingId === req.appointmentId}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            {processingId === req.appointmentId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Approve Reschedule
                          </Button>
                          <Button
                            onClick={() => handleRescheduleAction(req.appointmentId, 'reject')}
                            disabled={processingId === req.appointmentId}
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {processingId === req.appointmentId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Reject
                          </Button>
                        </div>

                        {/* Admin Reschedule / Change Time Button */}
                        <Button
                          variant="outline"
                          className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                          onClick={() => {
                            if (slotPickerOpen === req.appointmentId) {
                              setSlotPickerOpen(null);
                              setCollisionError(null);
                            } else {
                              setSlotPickerOpen(req.appointmentId);
                              setCollisionError(null);
                              const targetDate = req.requestedDate;
                              setSlotPickerDate(targetDate);
                              if (req.doctor?.id) {
                                fetchSlotsForDate(req.doctor.id, targetDate, req.appointmentId);
                              }
                            }
                          }}
                        >
                          <CalendarClock className="h-4 w-4 mr-2" />
                          {slotPickerOpen === req.appointmentId ? 'Close Slot Picker' : 'Pick a Different Time'}
                        </Button>

                        {/* Slot Picker Panel */}
                        {slotPickerOpen === req.appointmentId && (
                          <div className="border border-cyan-200 rounded-xl overflow-hidden bg-cyan-50/30">
                            <div className="px-4 py-3 bg-cyan-50 border-b border-cyan-100">
                              <p className="text-sm font-semibold text-cyan-800">Choose Available Slot for {req.doctor.name}</p>
                              <p className="text-xs text-cyan-600 mt-0.5">Select a date and pick an open time slot</p>
                            </div>
                            <div className="p-4 space-y-4">
                              {/* Date Picker */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Date</label>
                                <input
                                  type="date"
                                  value={slotPickerDate}
                                  min={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    setSlotPickerDate(e.target.value);
                                    setSelectedSlot(null);
                                    if (req.doctor?.id && e.target.value) {
                                      fetchSlotsForDate(req.doctor.id, e.target.value, req.appointmentId);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none bg-white"
                                />
                              </div>

                              {/* Slots Grid */}
                              {slotPickerLoading ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-4">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 rounded-lg" />
                                  ))}
                                </div>
                              ) : slotPickerSlots.length === 0 ? (
                                <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm text-gray-500 font-medium">No slots available on this date</p>
                                  <p className="text-xs text-gray-400 mt-1">Doctor may not be available. Try another date.</p>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                      Available Slots ({slotPickerSlots.filter(s => s.available).length} open)
                                    </p>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                                      {slotPickerSlots.map((slot, idx) => (
                                        <button
                                          key={idx}
                                          disabled={!slot.available}
                                          onClick={() => setSelectedSlot(slot)}
                                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                                            !slot.available
                                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                                              : selectedSlot?.time === slot.time
                                                ? 'bg-cyan-500 text-white ring-2 ring-cyan-300 shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-700 hover:border-cyan-400 hover:bg-cyan-50'
                                          }`}
                                        >
                                          {slot.time}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Selected Slot Summary + Confirm */}
                                  {selectedSlot && (
                                    <div className="p-3 bg-white rounded-lg border border-cyan-200">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <p className="text-xs text-gray-500">New Time</p>
                                          <p className="text-sm font-bold text-cyan-700">
                                            {slotPickerDate && format(parseISO(slotPickerDate), 'dd MMM yyyy')} &bull; {selectedSlot.time} - {selectedSlot.endTime}
                                          </p>
                                        </div>
                                        <Badge className="bg-cyan-100 text-cyan-700 text-xs">{selectedSlot.duration} min</Badge>
                                      </div>
                                      <Button
                                        onClick={() => handleAdminReschedule(req.appointmentId)}
                                        disabled={processingId === req.appointmentId}
                                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                                      >
                                        {processingId === req.appointmentId ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Confirm & Reschedule to This Slot
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-cyan-600">{stats.today}</p>
          <p className="text-sm text-gray-500">Today</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          <p className="text-sm text-gray-500">Confirmed</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <p className="text-2xl font-bold text-teal-600 flex items-center"><IndianRupee className="h-5 w-5" />{stats.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by patient name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white min-w-[140px]">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        <button
          onClick={() => setModeFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            modeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setModeFilter('online')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            modeFilter === 'online' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Video className="h-4 w-4" /> Online
        </button>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white min-w-[140px]">
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="past">Past</option>
        </select>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No appointments found</p>
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const isExpanded = expandedId === apt.id;
            const Icon = ModeIcon(apt.mode);
            const patientName = apt.metadata?.patient_name || apt.patient?.full_name || 'Unknown';
            const patientPhone = apt.metadata?.patient_phone || apt.patient?.phone || 'N/A';
            const rawDocName = apt.doctor?.users?.full_name || 'Unknown Doctor';
            const doctorName = rawDocName.replace(/^Dr\.?\s*/i, '');
            const serviceName = apt.service?.name || 'Unknown Service';
            const centerName = apt.metadata?.center_name || apt.location?.city || 'N/A';

            return (
              <div key={apt.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Main Row */}
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(isExpanded ? null : apt.id)}>
                  {/* Date/Time */}
                  <div className="w-24 text-center">
                    <p className="text-lg font-bold text-gray-900">{format(parseISO(apt.appointment_date), 'dd MMM')}</p>
                    <p className="text-sm text-gray-500">{apt.start_time}</p>
                    {isToday(parseISO(apt.appointment_date)) && <Badge className="bg-cyan-500 text-white text-[10px] mt-1">Today</Badge>}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">{patientName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-500">{patientPhone}</span>
                    </div>
                  </div>

                  {/* Service & Doctor */}
                  <div className="hidden md:block flex-1">
                    <p className="text-sm font-medium text-gray-900">{serviceName}</p>
                    <p className="text-xs text-gray-500">Dr. {doctorName}</p>
                  </div>

                  {/* Mode & Location */}
                  <div className="hidden md:flex flex-col items-start gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600 capitalize">
                      <Icon className="h-4 w-4 text-gray-400" />{apt.mode.replace('_', ' ')}
                    </span>
                    {apt.mode === 'online' && apt.google_meet_link && (
                      <span onClick={(e) => e.stopPropagation()}>
                        <DailyJoinButton
                          appointmentId={apt.id}
                          role="admin"
                          label="Host"
                          className="text-xs"
                        />
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 flex items-center justify-end"><IndianRupee className="h-3 w-3" />{apt.amount}</p>
                    <Badge className={`text-[10px] ${PAYMENT_COLORS[apt.payment_status]}`}>{apt.payment_status}</Badge>
                  </div>

                  {/* Status */}
                  <Badge className={`${STATUS_COLORS[apt.status]} capitalize`}>{apt.status}</Badge>

                  {/* Expand */}
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Patient Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Patient Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500">Name:</span> <span className="font-medium">{patientName}</span></p>
                          <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{patientPhone}</span></p>
                          <p><span className="text-gray-500">Email:</span> <span className="font-medium">{apt.patient?.email || 'N/A'}</span></p>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Appointment Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500">Date:</span> <span className="font-medium">{format(parseISO(apt.appointment_date), 'EEEE, dd MMMM yyyy')}</span></p>
                          <p><span className="text-gray-500">Time:</span> <span className="font-medium">{apt.start_time} - {apt.end_time}</span></p>
                          <p><span className="text-gray-500">Mode:</span> <span className="font-medium capitalize">{apt.mode.replace('_', ' ')}</span></p>
                          <p><span className="text-gray-500">Location:</span> <span className="font-medium">{centerName}</span></p>
                          {apt.mode === 'online' && apt.google_meet_link && (
                            <p className="mt-2">
                              <span className="text-gray-500 block mb-1">Video call (you join as host):</span>
                              <DailyJoinButton
                                appointmentId={apt.id}
                                role="admin"
                                variant="primary"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="block text-xs text-gray-500 mt-2">
                                Use this button only — do not copy the room URL from the browser bar (host token is required).
                                You join as co-host, can start the call, and admit patients from the waiting list.
                              </span>
                              {apt.google_meet_link.includes('daily.co') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
                                  disabled={endingId === apt.id}
                                  onClick={() => handleEndConsultation(apt.id)}
                                >
                                  {endingId === apt.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <PhoneOff className="h-3 w-3 mr-1" />}
                                  End for everyone
                                </Button>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Payment & Notes */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h4>
                        <div className="space-y-2 text-sm mb-4">
                          <p><span className="text-gray-500">Amount:</span> <span className="font-medium flex items-center gap-0.5 inline-flex"><IndianRupee className="h-3 w-3" />{apt.amount}</span></p>
                          <p><span className="text-gray-500">Status:</span> <Badge className={`ml-1 text-[10px] ${PAYMENT_COLORS[apt.payment_status]}`}>{apt.payment_status}</Badge></p>
                          {(apt as any).razorpay_payment_id && (
                            <p><span className="text-gray-500">Transaction ID:</span> <span className="font-mono text-xs">{(apt as any).razorpay_payment_id}</span></p>
                          )}
                        </div>
                        
                        {apt.notes && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                            <p className="text-sm text-gray-600 mb-4 p-2 bg-white rounded border">{apt.notes}</p>
                          </>
                        )}
                        
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Appointment status</h4>
                        {statusMessage?.id === apt.id && (
                          <p
                            className={`text-sm mb-3 px-3 py-2 rounded-lg ${
                              statusMessage.tone === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {statusMessage.text}
                          </p>
                        )}
                        {apt.status === 'completed' ? (
                          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            This appointment is completed. No further status changes needed.
                          </p>
                        ) : apt.status === 'cancelled' ? (
                          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <XCircle className="h-4 w-4 shrink-0" />
                            This appointment was cancelled.
                          </p>
                        ) : apt.status === 'no_show' ? (
                          <p className="text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                            Marked as no-show.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {apt.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'confirmed'); }}
                                  disabled={!!statusUpdating}
                                >
                                  {isStatusLoading(apt.id, 'confirmed') ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  Confirm booking
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'cancelled'); }}
                                  disabled={!!statusUpdating}
                                  className="text-red-600 border-red-200"
                                >
                                  {isStatusLoading(apt.id, 'cancelled') ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Cancel
                                </Button>
                              </>
                            )}
                            {apt.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'completed'); }}
                                  disabled={!!statusUpdating}
                                >
                                  {isStatusLoading(apt.id, 'completed') ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  Mark complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'cancelled'); }}
                                  disabled={!!statusUpdating}
                                  className="text-red-600 border-red-200"
                                >
                                  {isStatusLoading(apt.id, 'cancelled') ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'no_show'); }}
                                  disabled={!!statusUpdating}
                                  className="text-gray-600"
                                >
                                  {isStatusLoading(apt.id, 'no_show') ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : null}
                                  No show
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Info */}
                    <div className="mt-4 pt-4 border-t text-xs text-gray-400">
                      <span>Booked: {apt.metadata?.booked_at ? format(parseISO(apt.metadata.booked_at), 'dd MMM yyyy, HH:mm') : format(parseISO(apt.created_at), 'dd MMM yyyy, HH:mm')}</span>
                      <span className="mx-2">•</span>
                      <span>ID: {apt.id.slice(0, 8)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>}

      <Dialog open={endConsultationSuccess} onOpenChange={setEndConsultationSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Consultation ended
            </DialogTitle>
            <DialogDescription>
              The consultation has been ended for everyone. All participants have been removed from the call.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setEndConsultationSuccess(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

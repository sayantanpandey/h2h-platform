'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  FileText,
  PhoneOff,
} from 'lucide-react';
import Link from 'next/link';
import { DailyJoinButton } from '@/components/video/DailyJoinButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  amount: number;
  mode: string;
  paymentStatus: string;
  googleMeetLink: string | null;
  patient: { id: string | null; fullName: string; email: string; phone: string };
  service: { id: string | null; name: string };
  location: { id: string; name: string; city: string; address: string } | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-600', icon: AlertCircle },
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<'all' | 'online'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endConsultationSuccess, setEndConsultationSuccess] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (statusFilter) params.set('status', statusFilter);
      if (modeFilter === 'online') params.set('mode', 'online');
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetch(`/api/doctor/appointments?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Failed to load appointments');
        return;
      }
      if (data.success) {
        const list = data.data || [];
        setAppointments(list);
        setTotal(data.total ?? 0);
        if (list.length) {
          const ids = list.map((a: AppointmentItem) => a.id);
          setSelectedId((prev) => (prev && ids.includes(prev) ? prev : list[0].id));
        } else {
          setSelectedId(null);
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, modeFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const selected = appointments.find((a) => a.id === selectedId);
  const totalPages = Math.ceil(total / pageSize);

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hh = parseInt(h, 10);
    return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: string,
    notes?: string
  ) => {
    setError(null);
    setUpdatingId(appointmentId);
    try {
      const res = await fetch(`/api/doctor/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          notes != null ? { status: newStatus, notes } : { status: newStatus }
        ),
      });
      const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
        await fetchAppointments();
        if (newStatus === 'completed') {
          window.location.href = `/doctor/prescriptions/appointment/${appointmentId}`;
          return;
        }
      } else {
        setError(typeof data?.error === 'string' ? data.error : 'Update failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getModeIcon = (mode: string) => {
    if (mode === 'online') return <Video className="h-4 w-4 text-blue-600" />;
    return <Building2 className="h-4 w-4 text-green-600" />;
  };

  const handleEndConsultation = async (appointmentId: string) => {
    setError(null);
    setEndingId(appointmentId);
    try {
      const res = await fetch('/api/video/end-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setError(null);
        setEndConsultationSuccess(true);
        await fetchAppointments();
      } else {
        setError(typeof data?.error === 'string' ? data.error : 'Failed to end consultation');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setEndingId(null);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <div className="flex gap-2">
            <button
              onClick={() => { setModeFilter('all'); setPage(1); }}
              className={`h-9 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                modeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setModeFilter('online'); setPage(1); }}
              className={`h-9 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                modeFilter === 'online' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video className="h-4 w-4" /> Online
            </button>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => fetchAppointments()} className="h-9">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* List */}
        <Card className="border-gray-200 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {appointments.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No appointments found</div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[min(420px,calc(100vh-11rem))] overflow-y-auto">
                {appointments.map((apt) => {
                  const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                  const Icon = config.icon;
                  return (
                    <li key={apt.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(apt.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          selectedId === apt.id ? 'bg-cyan-50 border-l-2 border-cyan-500' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {apt.patient.fullName}
                          </span>
                          <Badge className={`text-[10px] ${config.bg} ${config.text} border-0`}>
                            {apt.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {apt.date}
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatTime(apt.startTime)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="p-2 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Detail - fixed height, scrollable inner content */}
        <Card className="border-gray-200 md:col-span-2 flex flex-col h-[min(520px,calc(100vh-11rem))] min-h-[320px]">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm font-medium text-gray-700">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 p-0 flex-1">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center py-12 text-center text-gray-500 text-sm px-4">
                Select an appointment
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selected.patient.fullName}</h3>
                      <p className="text-sm text-gray-500">{selected.service.name}</p>
                    </div>
                    <Badge className={`shrink-0 ${STATUS_CONFIG[selected.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[selected.status]?.text || 'text-gray-700'} border-0`}>
                      {selected.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {formatDate(selected.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 shrink-0" />
                      {formatTime(selected.startTime)} – {formatTime(selected.endTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      {getModeIcon(selected.mode)}
                      {selected.mode === 'online' ? 'Online' : 'Clinic'}
                    </span>
                  </div>
                  {selected.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Building2 className="h-4 w-4 shrink-0" />
                      {selected.location.name}, {selected.location.city}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {selected.patient.phone && (
                      <a href={`tel:${selected.patient.phone}`} className="flex items-center gap-1 text-cyan-600 hover:underline">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {selected.patient.phone}
                      </a>
                    )}
                    {selected.patient.email && (
                      <a href={`mailto:${selected.patient.email}`} className="flex items-center gap-1 text-cyan-600 hover:underline truncate max-w-[200px]">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {selected.patient.email}
                      </a>
                    )}
                  </div>
                  {selected.googleMeetLink && selected.status === 'confirmed' && selected.mode === 'online' && (
                    <div className="flex flex-wrap gap-2 items-center">
                      {selected.googleMeetLink.includes('daily.co') ? (
                        <DailyJoinButton
                          appointmentId={selected.id}
                          role="doctor"
                          variant="primary"
                          label="Start / Join as Host"
                        />
                      ) : (
                        <a
                          href={selected.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <Video className="h-4 w-4 shrink-0" /> Join Video Call <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      )}
                      {selected.googleMeetLink.includes('daily.co') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={endingId === selected.id}
                          onClick={() => handleEndConsultation(selected.id)}
                        >
                          {endingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PhoneOff className="h-4 w-4 mr-1" />}
                          End for everyone
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <Link
                      href={`/doctor/prescriptions/appointment/${selected.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100"
                    >
                      <FileText className="h-4 w-4 shrink-0" /> Prescriptions for this appointment
                    </Link>
                  </div>
                </div>

                {/* State actions - fixed at bottom, always visible when appointment is active */}
                <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-4 py-3 rounded-b-lg">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Update status</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        disabled={updatingId === selected.id}
                        onClick={() => handleUpdateStatus(selected.id, 'confirmed')}
                      >
                        {updatingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                        Confirm
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(selected.status) && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updatingId === selected.id}
                          onClick={() => handleUpdateStatus(selected.id, 'completed')}
                        >
                          {updatingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
                          disabled={updatingId === selected.id}
                          onClick={() => handleUpdateStatus(selected.id, 'completed', 'Checked out')}
                        >
                          {updatingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />}
                          Check out
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-200 text-gray-600 hover:bg-gray-100"
                          disabled={updatingId === selected.id}
                          onClick={() => handleUpdateStatus(selected.id, 'no_show')}
                        >
                          No show
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={updatingId === selected.id}
                          onClick={() => handleUpdateStatus(selected.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </>
                    )}
                    {['completed', 'cancelled', 'no_show'].includes(selected.status) && (
                      <span className="text-xs text-gray-500 py-1.5">No further actions</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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

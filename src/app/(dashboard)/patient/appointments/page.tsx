'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Calendar, Clock, Video, Building2, ArrowLeft, Loader2, 
  MapPin, IndianRupee, CalendarPlus, ExternalLink,
  FileText, RefreshCw, X, ChevronRight, Home, AlertCircle,
  CheckCircle2, XCircle, ClockIcon
} from 'lucide-react';
import { AppointmentListSkeleton } from '@/components/admin/AdminSkeletons';

interface RescheduleRequest {
  status: 'pending' | 'approved' | 'rejected';
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  reason: string | null;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_note?: string;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  status: string;
  amount: number;
  paymentStatus: string;
  notes: string;
  transactionId?: string;
  googleMeetLink?: string | null;
  rescheduleRequest?: RescheduleRequest | null;
  doctor: { id: string; name: string; avatar: string; specializations: string[] };
  service: { id: string; name: string; duration: number };
  location: { name: string; city?: string; address: string; phone?: string };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: any; dot: string }> = {
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-500' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2, dot: 'bg-blue-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, dot: 'bg-red-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: ClockIcon, dot: 'bg-amber-500' },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-600', icon: AlertCircle, dot: 'bg-gray-400' },
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'online'>('all');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const displayAppointments = modeFilter === 'online' 
    ? appointments.filter(a => a.mode === 'online') 
    : appointments;

  // Auto-select first appointment when list loads or filter changes
  useEffect(() => {
    if (displayAppointments.length > 0) {
      const inList = selectedApt && displayAppointments.find(a => a.id === selectedApt.id);
      if (!inList) setSelectedApt(displayAppointments[0]);
    }
  }, [appointments, modeFilter, filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      const res = await fetch(`/api/patient/appointments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDateShort = (d: string) => {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateLong = (d: string) => {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getModeLabel = (mode: string) => {
    return { online: 'Video Consultation', offline: 'Clinic Visit', home_visit: 'Home Visit' }[mode] || mode;
  };

  const getModeIcon = (mode: string) => {
    if (mode === 'online') return <Video className="h-4 w-4" />;
    if (mode === 'home_visit') return <Home className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  const getGoogleCalendarUrl = (apt: Appointment) => {
    const startDT = `${apt.date.replace(/-/g, '')}T${(apt.startTime || '09:00').replace(/:/g, '')}00`;
    const endDT = `${apt.date.replace(/-/g, '')}T${(apt.endTime || '10:00').replace(/:/g, '')}00`;
    const docName = apt.doctor.name.replace(/^Dr\.?\s*/i, '');
    const loc = apt.mode === 'online' ? 'Online Video Consultation' : `${apt.location?.name || ''}, ${apt.location?.city || ''}`;
    const details = `H2H Healthcare Appointment\nService: ${apt.service.name}\nDoctor: Dr. ${docName}\nMode: ${getModeLabel(apt.mode)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`H2H: ${apt.service.name} with Dr. ${docName}`)}&dates=${startDT}/${endDT}&ctz=Asia/Kolkata&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
  };

  const handleInvoiceDownload = async (apt: Appointment) => {
    setInvoiceLoading(apt.id);
    try {
      const response = await fetch(`/api/invoices/${apt.id}`);
      const data = await response.json();
      if (data.success && data.data) {
        const inv = data.data;
        const fmtC = (a: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);
        const fmtD = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const fmtDLong = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const modeLabel = ({ online: 'Online Consultation', offline: 'Clinic Visit', home_visit: 'Home Visit' } as Record<string, string>)[inv.appointment.mode] || inv.appointment.mode;
        const isPaid = inv.appointment.paymentStatus === 'paid';

        const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Invoice ${inv.invoiceNumber} - H2H Healthcare</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;color:#1e293b;line-height:1.4;background:#f1f5f9}
.toolbar{max-width:780px;margin:10px auto 0;display:flex;justify-content:flex-end;gap:8px}
.toolbar button{padding:8px 18px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
.btn-print{background:linear-gradient(135deg,#0891b2,#06b6d4);color:#fff}
.btn-print:hover{background:linear-gradient(135deg,#0e7490,#0891b2)}
.btn-download{background:#fff;color:#334155;border:1px solid #e2e8f0 !important}
.btn-download:hover{background:#f8fafc}
.page{max-width:780px;margin:8px auto 20px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06)}
.accent-bar{height:5px;background:linear-gradient(90deg,#0891b2,#06b6d4,#22d3ee)}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 30px 16px}
.brand{display:flex;align-items:center;gap:10px}
.brand-icon{width:38px;height:38px;background:linear-gradient(135deg,#0891b2,#06b6d4);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px}
.brand-text h2{font-size:16px;font-weight:700;color:#0f172a}
.brand-text p{font-size:9px;color:#94a3b8;font-weight:500;letter-spacing:0.5px;text-transform:uppercase}
.inv-badge{text-align:right}
.inv-badge h1{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#0891b2;margin-bottom:2px}
.inv-badge .inv-num{font-size:17px;font-weight:800;color:#0f172a}
.inv-badge .inv-date{font-size:10px;color:#64748b;margin-top:3px}
.divider{height:1px;background:#e2e8f0;margin:0 30px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:14px 30px}
.info-col{padding-right:20px}
.info-col:last-child{padding-right:0;padding-left:20px;border-left:1px solid #f1f5f9}
.info-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#0891b2;margin-bottom:6px}
.info-name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:11px}
.info-row .label{color:#64748b;font-weight:500}
.info-row .val{color:#1e293b;font-weight:600;text-align:right}
.mode-badge{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;background:#ecfeff;color:#0891b2;border:1px solid #cffafe}
.svc-section{padding:0 30px 14px}
.svc-header{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#0891b2;margin-bottom:8px}
.svc-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.svc-table thead th{background:#f8fafc;padding:8px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#64748b;border-bottom:1px solid #e2e8f0;text-align:left}
.svc-table thead th:last-child{text-align:right}
.svc-table tbody td{padding:10px 12px;font-size:11px;color:#334155;font-weight:500}
.svc-table tbody td:first-child{font-weight:700;color:#0f172a;font-size:12px}
.svc-table tbody td:last-child{text-align:right;font-weight:700;color:#0f172a;font-size:12px}
.totals-wrap{display:flex;justify-content:flex-end;padding:0 30px 14px}
.totals{width:240px;background:#f8fafc;border-radius:8px;padding:10px 14px;border:1px solid #e2e8f0}
.totals-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;color:#64748b;font-weight:500}
.totals-row .amt{color:#334155;font-weight:600}
.totals-row.grand{border-top:2px solid #0891b2;margin-top:6px;padding-top:8px}
.totals-row.grand span{font-size:14px;font-weight:800;color:#0891b2}
.pay-section{padding:0 30px 14px}
.pay-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.pay-card{background:#f8fafc;border-radius:6px;padding:8px 12px;border:1px solid #e2e8f0}
.pay-card .pc-label{font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:2px}
.pay-card .pc-val{font-size:11px;font-weight:700;color:#0f172a}
.status-paid{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
.status-pending{display:inline-flex;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:#fef9c3;color:#854d0e;border:1px solid #fde68a}
.footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 30px;display:flex;justify-content:space-between;align-items:center}
.footer-left p{font-size:9px;color:#94a3b8;line-height:1.5}
.footer-left p strong{color:#64748b}
.footer-right{text-align:right}
.footer-right .thank{font-size:12px;font-weight:700;color:#0891b2;margin-bottom:2px}
.footer-right p{font-size:9px;color:#94a3b8}
@media print{.toolbar{display:none !important}body{background:#fff}.page{margin:0;border-radius:0;box-shadow:none;max-width:100%}@page{margin:10mm;size:A4}.accent-bar,thead th,.mode-badge,.status-paid,.status-pending,.totals,.pay-card,.brand-icon{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="toolbar">
  <button class="btn-download" onclick="downloadHTML()">&#11015; Download HTML</button>
  <button class="btn-print" onclick="window.print()">&#128438; Save as PDF</button>
</div>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="brand"><div class="brand-icon">H2H</div><div class="brand-text"><h2>H2H Healthcare</h2><p>Physiotherapy & Wellness</p></div></div>
    <div class="inv-badge"><h1>Invoice</h1><div class="inv-num">${inv.invoiceNumber}</div><div class="inv-date">Issued ${fmtD(inv.invoiceDate)}</div></div>
  </div>
  <div class="divider"></div>
  <div class="info-grid">
    <div class="info-col">
      <div class="info-label">Billed To</div>
      <div class="info-name">${inv.patient.name}</div>
      <div class="info-row"><span class="label">Phone</span><span class="val">${inv.patient.phone || 'N/A'}</span></div>
      <div class="info-row"><span class="label">Email</span><span class="val" style="font-size:10px">${inv.patient.email || 'N/A'}</span></div>
    </div>
    <div class="info-col">
      <div class="info-label">Appointment Details</div>
      <div class="info-row"><span class="label">Date</span><span class="val">${fmtDLong(inv.appointment.date)}</span></div>
      <div class="info-row"><span class="label">Time</span><span class="val">${inv.appointment.time}</span></div>
      <div class="info-row"><span class="label">Mode</span><span class="val"><span class="mode-badge">${modeLabel}</span></span></div>
      ${inv.location.name ? '<div class="info-row"><span class="label">Location</span><span class="val" style="font-size:10px">' + inv.location.name + ', ' + inv.location.city + '</span></div>' : ''}
    </div>
  </div>
  <div class="divider" style="margin-bottom:14px"></div>
  <div class="svc-section">
    <div class="svc-header">Service Details</div>
    <table class="svc-table"><thead><tr><th>Service</th><th>Doctor</th><th>Duration</th><th>Amount</th></tr></thead>
    <tbody><tr><td>${inv.service.name}</td><td>Dr. ${inv.service.doctor}</td><td>${inv.service.duration} mins</td><td>${fmtC(inv.billing.subtotal)}</td></tr></tbody></table>
  </div>
  <div class="totals-wrap"><div class="totals">
    <div class="totals-row"><span>Subtotal</span><span class="amt">${fmtC(inv.billing.subtotal)}</span></div>
    <div class="totals-row"><span>GST (Included)</span><span class="amt">${fmtC(inv.billing.gst)}</span></div>
    <div class="totals-row grand"><span>Total Payable</span><span>${fmtC(inv.billing.total)}</span></div>
  </div></div>
  <div class="divider" style="margin-bottom:14px"></div>
  <div class="pay-section">
    <div class="svc-header" style="margin-bottom:8px">Payment Information</div>
    <div class="pay-grid">
      <div class="pay-card"><div class="pc-label">Status</div><div class="pc-val"><span class="${isPaid ? 'status-paid' : 'status-pending'}">${isPaid ? 'Paid' : 'Pending'}</span></div></div>
      <div class="pay-card"><div class="pc-label">Method</div><div class="pc-val">${inv.billing.paymentMethod}</div></div>
      <div class="pay-card"><div class="pc-label">Transaction ID</div><div class="pc-val" style="font-size:9px;word-break:break-all">${inv.billing.transactionId || 'N/A'}</div></div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left"><p><strong>${inv.company.name}</strong></p><p>${inv.company.address}</p><p>GSTIN: ${inv.company.gstin}</p><p style="margin-top:3px;font-size:8px">Computer-generated invoice</p></div>
    <div class="footer-right"><div class="thank">Thank you!</div><p>${inv.company.phone}</p><p>${inv.company.email}</p></div>
  </div>
</div>
<script>
function downloadHTML(){
  var a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent(document.documentElement.outerHTML);
  a.download='Invoice-${inv.invoiceNumber}.html';
  a.click();
}
</script>
</body></html>`;

        // Create blob URL so the tab shows a proper URL instead of about:blank
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        const w = window.open(blobUrl, '_blank');
        if (w) {
          // Auto-trigger print after page loads
          w.onload = () => {
            setTimeout(() => w.print(), 500);
          };
        }
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        alert('Failed to generate invoice.');
      }
    } catch (err) {
      console.error('Invoice error:', err);
      alert('Failed to generate invoice.');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  const handleReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return;
    setRescheduleLoading(true);
    try {
      const res = await fetch(`/api/appointments/${rescheduleApt.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: rescheduleDate,
          newTime: rescheduleTime,
          reason: rescheduleReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRescheduleApt(null);
        setRescheduleDate('');
        setRescheduleTime('');
        setRescheduleReason('');
        setRescheduleSuccess(true);
        setTimeout(() => setRescheduleSuccess(false), 5000);
        fetchAppointments();
      } else {
        alert(data.error || 'Failed to submit reschedule request');
      }
    } catch (err) {
      alert('Failed to submit reschedule request');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const statusCfg = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-sm text-gray-500">View and manage your appointments</p>
          </div>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg" asChild>
          <Link href="/booking">+ Book New</Link>
        </Button>
      </div>

      {/* Success Toast */}
      {rescheduleSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Reschedule request submitted!</p>
            <p className="text-xs text-emerald-600">Your request has been sent to the admin for approval. You&apos;ll be notified once it&apos;s reviewed.</p>
          </div>
          <button onClick={() => setRescheduleSuccess(false)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedApt(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === f
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex gap-2 border-l border-gray-200 pl-4">
          <button
            onClick={() => setModeFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              modeFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" /> All
          </button>
          <button
            onClick={() => setModeFilter('online')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              modeFilter === 'online'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Video className="h-4 w-4" /> Online ({appointments.filter(a => a.mode === 'online').length})
          </button>
        </div>
      </div>

      {loading ? (
        <AppointmentListSkeleton count={5} />
      ) : displayAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <Calendar className="h-14 w-14 mx-auto mb-4 text-gray-200" />
          {modeFilter === 'online' ? (
            <>
              <p className="text-gray-500 mb-1 font-medium">No online consultations yet</p>
              <p className="text-sm text-gray-400 mb-6">Book an online video consultation to see it here</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-1 font-medium">No appointments found</p>
              <p className="text-sm text-gray-400 mb-6">Book your first appointment to get started</p>
            </>
          )}
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg" asChild>
            <Link href="/booking">Book Appointment</Link>
          </Button>
        </div>
      ) : modeFilter === 'online' ? (
        /* Online tab: dedicated table with Meet links */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Video className="h-5 w-5 text-emerald-600" /> Online Video Consultations
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Your online appointments with Google Meet links</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Meet Link</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayAppointments.map((apt) => {
                  const sc = statusCfg(apt.status);
                  return (
                    <tr
                      key={apt.id}
                      onClick={() => setSelectedApt(apt)}
                      className={`border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors ${
                        selectedApt?.id === apt.id ? 'bg-cyan-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{formatDateShort(apt.date)}</div>
                        <div className="text-xs text-gray-500">{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{apt.doctor.name}</div>
                        {apt.doctor.specializations?.length > 0 && (
                          <div className="text-xs text-gray-500">{apt.doctor.specializations.slice(0, 2).join(', ')}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{apt.service.name}</div>
                        <div className="text-xs text-gray-500">{apt.service.duration} min</div>
                      </td>
                      <td className="py-3 px-4">
                        {apt.paymentStatus === 'paid' && apt.googleMeetLink ? (
                          <a
                            href={apt.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                          >
                            <Video className="h-4 w-4" /> Join Call
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : apt.paymentStatus === 'pending' ? (
                          <span className="text-xs text-amber-600 font-medium">Complete payment first</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${sc.bg} ${sc.text} border-0 text-[11px] font-semibold capitalize`}>
                          {apt.status}
                        </Badge>
                        <Badge className={`ml-1 text-[10px] border-0 ${apt.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {apt.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm font-semibold text-gray-900 flex items-center justify-end gap-0.5">
                          <IndianRupee className="h-3.5 w-3.5" /> {apt.amount?.toLocaleString() || 0}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Selected appointment detail panel (collapsible below table on mobile) */}
          {selectedApt && selectedApt.mode === 'online' && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Selected</p>
                  <p className="font-medium text-gray-900">{selectedApt.service.name} with {selectedApt.doctor.name}</p>
                </div>
                {selectedApt.googleMeetLink && selectedApt.paymentStatus === 'paid' && (
                  <a
                    href={selectedApt.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    <Video className="h-5 w-5" /> Join Google Meet
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleInvoiceDownload(selectedApt)}
                  disabled={invoiceLoading === selectedApt.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  {invoiceLoading === selectedApt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:h-[calc(100vh-220px)]">
          {/* LEFT: Appointments List */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto hide-scrollbar">
            {displayAppointments.map((apt) => {
              const sc = statusCfg(apt.status);
              const isSelected = selectedApt?.id === apt.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedApt(apt)}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-cyan-500 shadow-md ring-1 ring-cyan-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-[15px] truncate">{apt.service.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{apt.doctor.name}</p>
                    </div>
                    <Badge className={`${sc.bg} ${sc.text} border-0 text-[11px] font-semibold capitalize shrink-0 ml-2`}>
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateShort(apt.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(apt.startTime)}
                    </span>
                    {apt.location?.name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {apt.location.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {apt.amount?.toLocaleString() || 0}
                      <Badge className={`ml-2 text-[10px] border-0 ${apt.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {apt.paymentStatus}
                      </Badge>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-colors ${isSelected ? 'text-cyan-500' : 'text-gray-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Selected Appointment Detail */}
          <div className="lg:col-span-3 overflow-y-auto hide-scrollbar">
            {selectedApt ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Detail Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-white/20 text-white border-0 text-xs font-mono">
                      #{selectedApt.id.slice(0, 8).toUpperCase()}
                    </Badge>
                    <Badge className={`border-0 text-xs font-bold capitalize ${
                      selectedApt.status === 'confirmed' ? 'bg-white/90 text-emerald-700' :
                      selectedApt.status === 'completed' ? 'bg-white/90 text-blue-700' :
                      selectedApt.status === 'cancelled' ? 'bg-white/90 text-red-700' :
                      'bg-white/90 text-amber-700'
                    }`}>
                      {selectedApt.status}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold mb-1">{selectedApt.service.name}</h2>
                  <p className="text-white/80 text-sm">with {selectedApt.doctor.name}</p>
                  {selectedApt.doctor.specializations?.length > 0 && (
                    <p className="text-white/60 text-xs mt-1">{selectedApt.doctor.specializations.join(', ')}</p>
                  )}
                </div>

                {/* Detail Body */}
                <div className="p-6 space-y-5">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Date</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatDateLong(selectedApt.date)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Time</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatTime(selectedApt.startTime)} - {formatTime(selectedApt.endTime)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        {getModeIcon(selectedApt.mode)}
                        <span className="text-xs font-medium uppercase tracking-wide">Mode</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{getModeLabel(selectedApt.mode)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <IndianRupee className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Amount</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(selectedApt.amount || 0)}
                        </p>
                        <Badge className={`text-[10px] border-0 ${selectedApt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedApt.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedApt.location?.name && selectedApt.mode !== 'online' && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Location</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{selectedApt.location.name}</p>
                      {selectedApt.location.city && (
                        <p className="text-xs text-gray-500 mt-0.5">{selectedApt.location.address || selectedApt.location.city}</p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {selectedApt.notes && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-amber-900">{selectedApt.notes}</p>
                    </div>
                  )}

                  {/* Reschedule Request Status */}
                  {selectedApt.rescheduleRequest && (
                    <div className={`rounded-xl p-4 border ${
                      selectedApt.rescheduleRequest.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                      selectedApt.rescheduleRequest.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedApt.rescheduleRequest.status === 'pending' && <Clock className="h-4 w-4 text-amber-600" />}
                        {selectedApt.rescheduleRequest.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {selectedApt.rescheduleRequest.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          selectedApt.rescheduleRequest.status === 'pending' ? 'text-amber-700' :
                          selectedApt.rescheduleRequest.status === 'approved' ? 'text-emerald-700' :
                          'text-red-700'
                        }`}>
                          Reschedule {selectedApt.rescheduleRequest.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Requested: <strong>{new Date(selectedApt.rescheduleRequest.requested_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong> at <strong>{formatTime(selectedApt.rescheduleRequest.requested_start_time)}</strong>
                      </p>
                      {selectedApt.rescheduleRequest.reason && (
                        <p className="text-xs text-gray-500 mt-1">Reason: {selectedApt.rescheduleRequest.reason}</p>
                      )}
                      {selectedApt.rescheduleRequest.admin_note && (
                        <p className="text-xs text-gray-500 mt-1">Admin note: {selectedApt.rescheduleRequest.admin_note}</p>
                      )}
                      {selectedApt.rescheduleRequest.reviewed_by && (
                        <p className="text-[10px] text-gray-400 mt-2">Reviewed by {selectedApt.rescheduleRequest.reviewed_by}</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Invoice Download */}
                      <button
                        onClick={() => handleInvoiceDownload(selectedApt)}
                        disabled={invoiceLoading === selectedApt.id}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                          {invoiceLoading === selectedApt.id ? (
                            <Loader2 className="h-5 w-5 text-cyan-600 animate-spin" />
                          ) : (
                            <FileText className="h-5 w-5 text-cyan-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Download Invoice</p>
                          <p className="text-[11px] text-gray-400">PDF receipt</p>
                        </div>
                      </button>

                      {/* Google Calendar */}
                      <a
                        href={getGoogleCalendarUrl(selectedApt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <CalendarPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Add to Calendar</p>
                          <p className="text-[11px] text-gray-400">Google Calendar</p>
                        </div>
                      </a>

                      {/* Reschedule */}
                      {(selectedApt.status === 'confirmed' || selectedApt.status === 'pending') && (
                        selectedApt.rescheduleRequest?.status === 'pending' ? (
                          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-left">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-amber-800">Reschedule Pending</p>
                              <p className="text-[11px] text-amber-600">Awaiting admin approval</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setRescheduleApt(selectedApt);
                              setRescheduleDate(selectedApt.date);
                            }}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                              <RefreshCw className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Reschedule</p>
                              <p className="text-[11px] text-gray-400">Request date/time change</p>
                            </div>
                          </button>
                        )
                      )}

                      {/* Join Call */}
                      {selectedApt.status === 'confirmed' && selectedApt.mode === 'online' && selectedApt.googleMeetLink && (
                        <a
                          href={selectedApt.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/25 col-span-2 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Video className="h-6 w-6" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold">Join Video Call</p>
                            <p className="text-[12px] text-white/80 truncate mt-0.5" title={selectedApt.googleMeetLink}>
                              {selectedApt.googleMeetLink.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </p>
                          </div>
                          <ExternalLink className="h-5 w-5 shrink-0 opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-32">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">Select an appointment</p>
                  <p className="text-sm text-gray-300 mt-1">Click on any appointment to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Request Reschedule</h3>
                <p className="text-white/80 text-sm">{rescheduleApt.service.name}</p>
                <p className="text-white/60 text-xs mt-0.5">Requires admin approval</p>
              </div>
              <button onClick={() => setRescheduleApt(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Why do you need to reschedule?"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setRescheduleApt(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                  onClick={handleReschedule}
                  disabled={!rescheduleDate || !rescheduleTime || rescheduleLoading}
                >
                  {rescheduleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Plus, RefreshCw, Loader2, X, Printer, Pencil } from 'lucide-react';
import { PrescriptionsListSkeleton } from '@/components/admin/AdminSkeletons';

interface AppointmentOption {
  id: string;
  date: string;
  startTime: string;
  patient: { fullName: string };
  service: { name: string };
}
interface PrescriptionRow {
  id: string;
  appointmentId: string;
  notes: string | null;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
  patient: { id: string; fullName: string; email: string } | null;
  appointment: { date: string; startTime: string; serviceName: string } | null;
}

const defaultMed = () => ({ name: '', dosage: '', frequency: '', duration: '' });
const defaultEx = () => ({ name: '', reps: '', sets: '', duration: '', notes: '' });

export default function DoctorPrescriptionsPage() {
  const searchParams = useSearchParams();
  const [list, setList] = useState<PrescriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [hasMoreAppointments, setHasMoreAppointments] = useState(true);
  const [loadingMoreAppointments, setLoadingMoreAppointments] = useState(false);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([defaultMed()]);
  const [exercises, setExercises] = useState<{ name: string; reps: string; sets: string; duration: string; notes: string }[]>([defaultEx()]);
  const [instructions, setInstructions] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{
    patient: { fullName: string; email?: string; phone?: string };
    appointment: { date: string; startTime: string; serviceName?: string };
    notes: string | null;
  } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMedications, setEditMedications] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([defaultMed()]);
  const [editExercises, setEditExercises] = useState<{ name: string; reps: string; sets: string; duration: string; notes: string }[]>([defaultEx()]);
  const [editInstructions, setEditInstructions] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      const res = await fetch(`/api/doctor/prescriptions?${params}`);
      const data = await res.json();
      if (data.success) {
        setList(data.data || []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const createParam = searchParams.get('create');
  const appointmentIdParam = searchParams.get('appointmentId');
  const router = useRouter();
  useEffect(() => {
    if (createParam || appointmentIdParam) {
      const id = createParam || appointmentIdParam;
      if (id) router.replace(`/doctor/prescriptions/appointment/${id}`);
    }
  }, [createParam, appointmentIdParam, router]);

  const loadAppointmentsPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMoreAppointments(true);
    const res = await fetch(`/api/doctor/appointments?page=${pageNum}&pageSize=50&status=completed`);
    const data = await res.json();
    if (data.success) {
      const apts = (data.data || []).map((a: any) => ({
        id: a.id,
        date: a.date,
        startTime: a.startTime,
        patient: a.patient,
        service: a.service,
      }));
      setAppointments((prev) => append ? [...prev, ...apts] : apts);
      setHasMoreAppointments((data.data?.length || 0) >= 50);
      if (pageNum === 1) setAppointmentsPage(1);
      else setAppointmentsPage(pageNum);
    }
    if (append) setLoadingMoreAppointments(false);
  }, []);

  useEffect(() => {
    if (openCreate) loadAppointmentsPage(1, false);
  }, [openCreate]);

  const loadMoreAppointments = () => {
    const next = appointmentsPage + 1;
    setAppointmentsPage(next);
    loadAppointmentsPage(next, true);
  };

  const resetCreate = () => {
    setSelectedAppointmentId(null);
    setMedications([defaultMed()]);
    setExercises([defaultEx()]);
    setInstructions('');
    setFollowUp('');
    setError(null);
  };

  const payloadFromForm = () => ({
    medications: medications.filter((m) => m.name.trim()),
    exercises: exercises.filter((e) => e.name.trim()),
    instructions: instructions.trim(),
    followUp: followUp.trim(),
  });

  const handleCreate = async () => {
    if (!selectedAppointmentId) {
      setError('Select an appointment');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: selectedAppointmentId, notes: JSON.stringify(payloadFromForm()) }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenCreate(false);
        resetCreate();
        fetchList();
      } else {
        setError(data.error || 'Failed to create');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: PrescriptionRow) => {
    setEditId(row.id);
    const p = parseNotes(row.notes);
    if (p) {
      setEditMedications(
        p.medications?.length
          ? p.medications.map((m: any) => ({
              name: m.name ?? '',
              dosage: m.dosage ?? '',
              frequency: m.frequency ?? '',
              duration: m.duration ?? '',
            }))
          : [defaultMed()]
      );
      setEditExercises(
        p.exercises?.length
          ? p.exercises.map((e: any) => ({
              name: e.name ?? '',
              reps: e.reps ?? '',
              sets: e.sets ?? '',
              duration: e.duration ?? '',
              notes: e.notes ?? '',
            }))
          : [defaultEx()]
      );
      setEditInstructions(p.instructions ?? '');
      setEditFollowUp(p.followUp ?? '');
    } else {
      setEditMedications([defaultMed()]);
      setEditExercises([defaultEx()]);
      setEditInstructions('');
      setEditFollowUp('');
    }
  };

  const editPayload = () => ({
    medications: editMedications.filter((m) => m.name.trim()),
    exercises: editExercises.filter((e) => e.name.trim()),
    instructions: editInstructions.trim(),
    followUp: editFollowUp.trim(),
  });

  const handleEdit = async () => {
    if (!editId) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/doctor/prescriptions/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: JSON.stringify(editPayload()) }),
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        fetchList();
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const closeEdit = () => {
    setEditId(null);
    setEditMedications([defaultMed()]);
    setEditExercises([defaultEx()]);
    setEditInstructions('');
    setEditFollowUp('');
  };

  const openPrint = async (id: string) => {
    setPrintId(id);
    try {
      const res = await fetch(`/api/doctor/prescriptions/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data.patient;
        const apt = data.data.appointment;
        setPrintData({
          patient: { fullName: p?.fullName ?? p?.full_name ?? 'Unknown', email: p?.email, phone: p?.phone },
          appointment: {
            date: apt?.date ?? apt?.appointment_date ?? '',
            startTime: apt?.startTime ?? apt?.start_time ?? '',
            serviceName: apt?.serviceName ?? apt?.service?.name,
          },
          notes: data.data.notes,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const doPrint = () => {
    window.print();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.slice(0, 5).split(':');
    const hh = parseInt(h, 10);
    return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes) as {
        medications?: { name: string; dosage?: string; frequency?: string; duration?: string }[];
        exercises?: { name: string; reps?: string; sets?: string; duration?: string; notes?: string }[];
        instructions?: string;
        followUp?: string;
      };
    } catch {
      return { instructions: notes };
    }
  };

  const filteredAppointments = appointmentSearch.trim()
    ? appointments.filter(
        (a) =>
          a.patient?.fullName?.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
          a.service?.name?.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
          a.date?.includes(appointmentSearch)
      )
    : appointments;
  const schemaError = error && (error.includes('prescriptions') || error.includes('schema'));

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage prescriptions for your patients</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button onClick={() => setOpenCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-2" /> Create prescription
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchList()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          </div>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Prescription records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PrescriptionsListSkeleton />
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No prescriptions yet. Create one from a completed appointment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[180px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.patient?.fullName ?? '—'}</TableCell>
                    <TableCell>
                      {row.appointment ? `${row.appointment.date} ${row.appointment.startTime?.slice(0, 5)} — ${row.appointment.serviceName || ''}` : '—'}
                    </TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openPrint(row.id)}>
                          <Printer className="h-4 w-4 mr-1" /> Print
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog - fixed header/footer, scrollable middle, scalable for 100+ appointments */}
      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) resetCreate(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle>Create prescription</DialogTitle>
            <DialogDescription>Select a completed appointment. Add medications, exercises/rehab, and instructions.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-4">
            <div>
              <Label>Appointment</Label>
              <Input
                placeholder="Search by patient name, service, or date..."
                className="mt-1"
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
              />
              <div className="mt-2 max-h-[180px] overflow-y-auto rounded-lg border border-gray-200 p-1">
                {filteredAppointments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(a.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${selectedAppointmentId === a.id ? 'bg-cyan-100 border border-cyan-300' : 'hover:bg-gray-50'}`}
                  >
                    {a.date} {a.startTime?.slice(0, 5)} — {a.patient?.fullName} — {a.service?.name}
                  </button>
                ))}
                {hasMoreAppointments && (
                  <Button type="button" variant="ghost" size="sm" className="w-full mt-1" onClick={loadMoreAppointments} disabled={loadingMoreAppointments}>
                    {loadingMoreAppointments ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Load more appointments'}
                  </Button>
                )}
              </div>
              {selectedAppointmentId && <p className="text-xs text-gray-500 mt-1">Selected: {filteredAppointments.find((a) => a.id === selectedAppointmentId)?.patient?.fullName}</p>}
              {appointments.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}{hasMoreAppointments ? ' · Load more below' : ''}</p>
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <Label className="text-gray-700 font-medium">Medications (if any)</Label>
              <div className="space-y-2 mt-1">
                {medications.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Medicine" className="col-span-3" value={m.name} onChange={(e) => setMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
                    <Input placeholder="Dosage" className="col-span-2" value={m.dosage} onChange={(e) => setMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], dosage: e.target.value }; return n; })} />
                    <Input placeholder="Frequency" className="col-span-2" value={m.frequency} onChange={(e) => setMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], frequency: e.target.value }; return n; })} />
                    <Input placeholder="Duration" className="col-span-2" value={m.duration} onChange={(e) => setMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], duration: e.target.value }; return n; })} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => setMedications((prev) => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setMedications((prev) => [...prev, defaultMed()])}>+ Add medication</Button>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <Label className="text-gray-700 font-medium">Exercises / Rehab protocol</Label>
              <div className="space-y-2 mt-1">
                {exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Exercise / stretch" className="col-span-3" value={ex.name} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
                    <Input placeholder="Reps" className="col-span-1" value={ex.reps} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], reps: e.target.value }; return n; })} />
                    <Input placeholder="Sets" className="col-span-1" value={ex.sets} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], sets: e.target.value }; return n; })} />
                    <Input placeholder="Duration" className="col-span-2" value={ex.duration} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], duration: e.target.value }; return n; })} />
                    <Input placeholder="Notes" className="col-span-3" value={ex.notes} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], notes: e.target.value }; return n; })} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => setExercises((prev) => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setExercises((prev) => [...prev, defaultEx()])}>+ Add exercise</Button>
              </div>
            </div>
            <div>
              <Label>Instructions</Label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[60px]" placeholder="Additional instructions..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
            <div>
              <Label>Follow-up</Label>
              <Input className="mt-1" placeholder="e.g. Review in 2 weeks" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
            {schemaError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-medium">Database setup required</p>
                <p className="mt-1">Create the prescriptions table in Supabase. See <code className="bg-amber-100 px-1 rounded">docs/PRESCRIPTIONS_TABLE_SETUP.md</code> or run the SQL in <code className="bg-amber-100 px-1 rounded">supabase/migrations/20260222000000_create_prescriptions.sql</code> in your Supabase SQL Editor.</p>
              </div>
            )}
            {error && !schemaError && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog - structured form, fixed header/footer, scrollable middle */}
      <Dialog open={!!editId} onOpenChange={(o) => { if (!o) closeEdit(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle>Edit prescription</DialogTitle>
            <DialogDescription>Update medications, exercises, instructions and follow-up.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-4">
            <div>
              <Label>Medications (if any)</Label>
              <div className="space-y-2 mt-1">
                {editMedications.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Medicine" className="col-span-3" value={m.name} onChange={(e) => setEditMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
                    <Input placeholder="Dosage" className="col-span-2" value={m.dosage} onChange={(e) => setEditMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], dosage: e.target.value }; return n; })} />
                    <Input placeholder="Frequency" className="col-span-2" value={m.frequency} onChange={(e) => setEditMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], frequency: e.target.value }; return n; })} />
                    <Input placeholder="Duration" className="col-span-2" value={m.duration} onChange={(e) => setEditMedications((prev) => { const n = [...prev]; n[i] = { ...n[i], duration: e.target.value }; return n; })} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => setEditMedications((prev) => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setEditMedications((prev) => [...prev, defaultMed()])}>+ Add medication</Button>
              </div>
            </div>
            <div>
              <Label>Exercises / Rehab</Label>
              <div className="space-y-2 mt-1">
                {editExercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Exercise" className="col-span-3" value={ex.name} onChange={(e) => setEditExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
                    <Input placeholder="Reps" className="col-span-1" value={ex.reps} onChange={(e) => setEditExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], reps: e.target.value }; return n; })} />
                    <Input placeholder="Sets" className="col-span-1" value={ex.sets} onChange={(e) => setEditExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], sets: e.target.value }; return n; })} />
                    <Input placeholder="Duration" className="col-span-2" value={ex.duration} onChange={(e) => setEditExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], duration: e.target.value }; return n; })} />
                    <Input placeholder="Notes" className="col-span-3" value={ex.notes} onChange={(e) => setEditExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], notes: e.target.value }; return n; })} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => setEditExercises((prev) => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setEditExercises((prev) => [...prev, defaultEx()])}>+ Add exercise</Button>
              </div>
            </div>
            <div>
              <Label>Instructions</Label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[60px]" placeholder="Additional instructions..." value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} />
            </div>
            <div>
              <Label>Follow-up</Label>
              <Input placeholder="e.g. Review in 2 weeks" value={editFollowUp} onChange={(e) => setEditFollowUp(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>{editSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print view dialog - free visual integration via print styles */}
      <Dialog open={!!printId} onOpenChange={(o) => { if (!o) { setPrintId(null); setPrintData(null); } }}>
        <DialogContent className="max-w-2xl print:max-w-none print:border-0 print:shadow-none" id="prescription-print-area">
          <div className="print:block">
            <DialogHeader className="print:mb-4">
              <DialogTitle className="text-lg print:text-xl">Prescription</DialogTitle>
            </DialogHeader>
            {printData && (
              <div className="space-y-4 text-sm print:text-base">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-medium text-gray-500">Patient:</span> {printData.patient.fullName}</p>
                  <p><span className="font-medium text-gray-500">Date:</span> {printData.appointment?.date ? formatDate(printData.appointment.date) : '—'} {printData.appointment?.startTime ? formatTime(printData.appointment.startTime) : ''}</p>
                </div>
                {(() => {
                  const parsed = parseNotes(printData.notes);
                  if (!parsed) return <p className="whitespace-pre-wrap">{printData.notes}</p>;
                  return (
                    <>
                      {parsed.medications && parsed.medications.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">Medications</p>
                          <table className="w-full border border-gray-200 text-left">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-2 border-b">Medicine</th>
                                <th className="p-2 border-b">Dosage</th>
                                <th className="p-2 border-b">Frequency</th>
                                <th className="p-2 border-b">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.medications.map((m, i) => (
                                <tr key={i}>
                                  <td className="p-2 border-b">{m.name}</td>
                                  <td className="p-2 border-b">{m.dosage}</td>
                                  <td className="p-2 border-b">{m.frequency}</td>
                                  <td className="p-2 border-b">{m.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {parsed.exercises && parsed.exercises.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">Exercises / Rehab protocol</p>
                          <table className="w-full border border-gray-200 text-left">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-2 border-b">Exercise</th>
                                <th className="p-2 border-b">Reps</th>
                                <th className="p-2 border-b">Sets</th>
                                <th className="p-2 border-b">Duration</th>
                                <th className="p-2 border-b">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.exercises.map((e, i) => (
                                <tr key={i}>
                                  <td className="p-2 border-b">{e.name}</td>
                                  <td className="p-2 border-b">{e.reps}</td>
                                  <td className="p-2 border-b">{e.sets}</td>
                                  <td className="p-2 border-b">{e.duration}</td>
                                  <td className="p-2 border-b">{e.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {parsed.instructions && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Instructions</p>
                          <p className="whitespace-pre-wrap text-gray-800">{parsed.instructions}</p>
                        </div>
                      )}
                      {parsed.followUp && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Follow-up</p>
                          <p className="text-gray-800">{parsed.followUp}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            <DialogFooter className="print:mt-6 print:flex print:justify-end">
              <Button type="button" onClick={doPrint} className="print:hidden">
                <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

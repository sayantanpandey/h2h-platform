'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { ArrowLeft, FileText, Plus, Loader2, X, Printer, Pencil, Calendar, Clock } from 'lucide-react';
import { ProfileFormSkeleton } from '@/components/admin/AdminSkeletons';

interface AppointmentData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  patient: { fullName: string; email?: string; phone?: string };
  service: { name: string };
  location?: { name: string; city: string };
}

interface PrescriptionItem {
  id: string;
  appointmentId: string;
  notes: string | null;
  createdAt: string;
  patient: { fullName: string } | null;
  appointment: { date: string; startTime: string; serviceName: string } | null;
}

const defaultMed = () => ({ name: '', dosage: '', frequency: '', duration: '' });
const defaultEx = () => ({ name: '', reps: '', sets: '', duration: '', notes: '' });

type ParsedNotes = {
  medications?: { name: string; dosage?: string; frequency?: string; duration?: string }[];
  exercises?: { name: string; reps?: string; sets?: string; duration?: string; notes?: string }[];
  instructions?: string;
  followUp?: string;
};
function parseNotes(notes: string | null): ParsedNotes | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as ParsedNotes;
  } catch {
    return { instructions: notes };
  }
}

function prescriptionSummary(notes: string | null): string {
  const p = parseNotes(notes);
  if (!p) return '—';
  const parts: string[] = [];
  if (p.medications?.length) parts.push(`${p.medications.length} med(s)`);
  if (p.exercises?.length) parts.push(`${p.exercises.length} exercise(s)`);
  if (p.instructions) parts.push('Instructions');
  if (p.followUp) parts.push('Follow-up');
  return parts.length ? parts.join(', ') : '—';
}

export default function AppointmentPrescriptionsPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [medications, setMedications] = useState<ReturnType<typeof defaultMed>[]>([defaultMed()]);
  const [exercises, setExercises] = useState<ReturnType<typeof defaultEx>[]>([defaultEx()]);
  const [instructions, setInstructions] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{ patient: { fullName: string }; appointment: { date: string; startTime: string }; notes: string | null } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMedications, setEditMedications] = useState<ReturnType<typeof defaultMed>[]>([]);
  const [editExercises, setEditExercises] = useState<ReturnType<typeof defaultEx>[]>([]);
  const [editInstructions, setEditInstructions] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchAppointment = useCallback(async () => {
    const res = await fetch(`/api/doctor/appointments/${appointmentId}`);
    const data = await res.json();
    if (data.success && data.data) setAppointment(data.data);
    else setAppointment(null);
  }, [appointmentId]);

  const fetchPrescriptions = useCallback(async () => {
    const res = await fetch(`/api/doctor/prescriptions?appointmentId=${appointmentId}&pageSize=50`);
    const data = await res.json();
    if (data.success) setPrescriptions(data.data || []);
    else setPrescriptions([]);
  }, [appointmentId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAppointment(), fetchPrescriptions()]).finally(() => setLoading(false));
  }, [fetchAppointment, fetchPrescriptions]);

  const resetForm = () => {
    setMedications([defaultMed()]);
    setExercises([defaultEx()]);
    setInstructions('');
    setFollowUp('');
    setError(null);
    setShowCreateForm(false);
  };

  const payloadFromForm = () => ({
    medications: medications.filter((m) => m.name.trim()),
    exercises: exercises.filter((e) => e.name.trim()),
    instructions: instructions.trim(),
    followUp: followUp.trim(),
  });

  const handleCreate = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, notes: JSON.stringify(payloadFromForm()) }),
      });
      const data = await res.json();
      if (data.success) {
        resetForm();
        await fetchPrescriptions();
      } else {
        setError(data.error || 'Failed to create');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (rx: PrescriptionItem) => {
    setEditId(rx.id);
    const p = parseNotes(rx.notes);
    if (p) {
      setEditMedications(
        p.medications?.length
          ? p.medications.map((m) => ({
              name: m.name ?? '',
              dosage: m.dosage ?? '',
              frequency: m.frequency ?? '',
              duration: m.duration ?? '',
            }))
          : [defaultMed()]
      );
      setEditExercises(
        p.exercises?.length
          ? p.exercises.map((e) => ({
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

  const handleEditSave = async () => {
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
        fetchPrescriptions();
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
      const d = await res.json();
      if (d.success && d.data) {
        const p = d.data.patient;
        const apt = d.data.appointment;
        setPrintData({
          patient: { fullName: p?.fullName ?? p?.full_name ?? 'Unknown' },
          appointment: {
            date: apt?.date ?? apt?.appointment_date ?? '',
            startTime: apt?.startTime ?? apt?.start_time ?? '',
          },
          notes: d.data.notes,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.slice(0, 5).split(':');
    const hh = parseInt(h, 10);
    return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading && !appointment) {
    return <ProfileFormSkeleton />;
  }

  if (!appointment) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/doctor/appointments" className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Appointments
        </Link>
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center text-gray-500">
            Appointment not found or you don’t have access.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <Link href="/doctor/appointments" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">For this appointment — add or view prescriptions</p>
      </div>

      <Card className="border-gray-200 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium text-gray-900">{appointment.patient?.fullName}</p>
          <p className="text-sm text-gray-500">{appointment.service?.name}</p>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatDate(appointment.date)} · {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </p>
          {appointment.location && (
            <p className="text-sm text-gray-500">{appointment.location.name}, {appointment.location.city}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Prescriptions for this appointment
          </CardTitle>
          {!showCreateForm && (
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> {prescriptions.length === 0 ? 'Create first prescription' : 'Add another prescription'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {prescriptions.length === 0 && !showCreateForm && (
            <div className="py-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No prescriptions yet for this appointment.</p>
              <Button className="mt-3 bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create first prescription
              </Button>
            </div>
          )}

          {prescriptions.length > 0 && (
            <ul className="space-y-3">
              {prescriptions.map((rx) => (
                <li key={rx.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{prescriptionSummary(rx.notes)}</p>
                    <p className="text-xs text-gray-500">Created {formatDate(rx.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPrint(rx.id)}>
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(rx)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showCreateForm && (
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="font-medium text-gray-900">New prescription</h3>
              <div>
                <Label>Medications (if any)</Label>
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
              <div>
                <Label>Exercises / Rehab</Label>
                <div className="space-y-2 mt-1">
                  {exercises.map((ex, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Input placeholder="Exercise" className="col-span-3" value={ex.name} onChange={(e) => setExercises((prev) => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })} />
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
                <Input placeholder="e.g. Review in 2 weeks" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save prescription
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!printId} onOpenChange={(o) => { if (!o) { setPrintId(null); setPrintData(null); } }}>
        <DialogContent className="max-w-2xl" id="prescription-print-area">
          <DialogHeader>
            <DialogTitle>Prescription</DialogTitle>
          </DialogHeader>
          {printData && (() => {
            const parsed = parseNotes(printData.notes);
            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-medium text-gray-500">Patient:</span> {printData.patient.fullName}</p>
                  <p><span className="font-medium text-gray-500">Date:</span> {printData.appointment?.date ? formatDate(printData.appointment.date) : '—'} {printData.appointment?.startTime ? formatTime(printData.appointment.startTime) : ''}</p>
                </div>
                {parsed && (
                  <>
                    {parsed.medications && parsed.medications.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Medications</p>
                        <table className="w-full border border-gray-200 text-left">
                          <thead><tr className="bg-gray-50"><th className="p-2 border-b">Medicine</th><th className="p-2 border-b">Dosage</th><th className="p-2 border-b">Frequency</th><th className="p-2 border-b">Duration</th></tr></thead>
                          <tbody>
                            {parsed.medications.map((m: any, i: number) => (
                              <tr key={i}><td className="p-2 border-b">{m.name}</td><td className="p-2 border-b">{m.dosage}</td><td className="p-2 border-b">{m.frequency}</td><td className="p-2 border-b">{m.duration}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {parsed.exercises && parsed.exercises.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Exercises / Rehab</p>
                        <table className="w-full border border-gray-200 text-left">
                          <thead><tr className="bg-gray-50"><th className="p-2 border-b">Exercise</th><th className="p-2 border-b">Reps</th><th className="p-2 border-b">Sets</th><th className="p-2 border-b">Duration</th><th className="p-2 border-b">Notes</th></tr></thead>
                          <tbody>
                            {parsed.exercises.map((e: any, i: number) => (
                              <tr key={i}><td className="p-2 border-b">{e.name}</td><td className="p-2 border-b">{e.reps}</td><td className="p-2 border-b">{e.sets}</td><td className="p-2 border-b">{e.duration}</td><td className="p-2 border-b">{e.notes}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {parsed.instructions && <div><p className="font-medium text-gray-700 mb-1">Instructions</p><p className="whitespace-pre-wrap">{parsed.instructions}</p></div>}
                    {parsed.followUp && <div><p className="font-medium text-gray-700 mb-1">Follow-up</p><p>{parsed.followUp}</p></div>}
                  </>
                )}
                {!parsed && printData.notes && <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded">{printData.notes}</pre>}
                <Button type="button" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
            <Button onClick={handleEditSave} disabled={editSubmitting}>{editSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

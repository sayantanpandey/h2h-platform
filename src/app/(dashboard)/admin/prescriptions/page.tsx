'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { FileText, Plus, RefreshCw, Loader2, X, Printer } from 'lucide-react';
import { PrescriptionsListSkeleton } from '@/components/admin/AdminSkeletons';

interface Patient { id: string; fullName: string; email: string; phone?: string }
interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  patient?: { full_name: string };
  doctor?: { users?: { full_name: string } };
  service?: { name: string };
}
interface PrescriptionRow {
  id: string;
  appointmentId: string;
  patientId: string;
  notes: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  patient: { id: string; fullName: string; email: string } | null;
  doctor: { id: string; fullName: string } | null;
}

const defaultMed = () => ({ name: '', dosage: '', frequency: '', duration: '' });

export default function AdminPrescriptionsPage() {
  const [list, setList] = useState<PrescriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [patientFilter, setPatientFilter] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([defaultMed()]);
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{ patient: { full_name?: string; fullName?: string }; doctor: { fullName?: string; full_name?: string }; notes: string | null } | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (patientFilter) params.set('patientId', patientFilter);
      const res = await fetch(`/api/admin/prescriptions?${params}`);
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
  }, [page, patientFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchPatients = useCallback(async () => {
    const res = await fetch('/api/admin/patients');
    const data = await res.json();
    if (data.success) setPatients(data.data || []);
  }, []);

  const fetchAppointments = useCallback(async (pid: string) => {
    const res = await fetch(`/api/admin/appointments?patientId=${pid}&limit=50`);
    const data = await res.json();
    if (data.success) setAppointments(data.data || []);
    else setAppointments([]);
  }, []);

  useEffect(() => {
    if (openCreate) fetchPatients();
  }, [openCreate, fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) fetchAppointments(selectedPatientId);
    else setAppointments([]);
  }, [selectedPatientId, fetchAppointments]);

  const resetCreate = () => {
    setSelectedPatientId(null);
    setSelectedAppointmentId(null);
    setMedications([defaultMed()]);
    setInstructions('');
    setError(null);
  };

  const handleCreate = async () => {
    if (!selectedAppointmentId) {
      setError('Select an appointment');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: { medications?: unknown[]; instructions?: string } = {
        medications: medications.filter((m) => m.name.trim()),
        instructions: instructions.trim(),
      };
      const notes = JSON.stringify(payload);
      const res = await fetch('/api/admin/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: selectedAppointmentId, notes }),
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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const parseNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes) as { medications?: { name: string; dosage?: string; frequency?: string; duration?: string }[]; instructions?: string };
    } catch {
      return { instructions: notes };
    }
  };

  const openPrint = async (id: string) => {
    setPrintId(id);
    try {
      const res = await fetch(`/api/admin/prescriptions/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data.patient;
        const d = data.data.doctor;
        setPrintData({
          patient: p ? { fullName: (p as any).fullName ?? (p as any).full_name, full_name: (p as any).full_name } : { fullName: 'Unknown' },
          doctor: d ? { fullName: (d as any).fullName ?? (d as any).full_name } : { fullName: 'Unknown' },
          notes: data.data.notes,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and assign prescriptions to patients</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpenCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-2" /> Create prescription
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchList()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> All prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PrescriptionsListSkeleton />
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No prescriptions yet. Create one to assign to a patient.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => {
                  const parsed = parseNotes(row.notes);
                  const medCount = parsed?.medications?.length ?? 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.patient?.fullName ?? '—'}</TableCell>
                      <TableCell>{row.doctor?.fullName ?? '—'}</TableCell>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {medCount ? `${medCount} medication(s)` : parsed?.instructions?.slice(0, 50) || '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openPrint(row.id)}>
                          <Printer className="h-4 w-4 mr-1" /> View / Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (!o) resetCreate(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create prescription</DialogTitle>
            <DialogDescription>Assign a prescription to a patient by selecting their appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Patient</Label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 h-10 px-3 text-sm"
                value={selectedPatientId || ''}
                onChange={(e) => { setSelectedPatientId(e.target.value || null); setSelectedAppointmentId(null); }}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Appointment</Label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 h-10 px-3 text-sm"
                value={selectedAppointmentId || ''}
                onChange={(e) => setSelectedAppointmentId(e.target.value || null)}
                disabled={!selectedPatientId}
              >
                <option value="">Select appointment</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appointment_date} {a.start_time?.slice(0, 5)} — {a.service?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Medications</Label>
              <div className="space-y-2 mt-1">
                {medications.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Medicine" className="col-span-3" value={m.name} onChange={(e) => {
                      const next = [...medications]; next[i] = { ...next[i], name: e.target.value }; setMedications(next);
                    }} />
                    <Input placeholder="Dosage" className="col-span-2" value={m.dosage} onChange={(e) => {
                      const next = [...medications]; next[i] = { ...next[i], dosage: e.target.value }; setMedications(next);
                    }} />
                    <Input placeholder="Frequency" className="col-span-2" value={m.frequency} onChange={(e) => {
                      const next = [...medications]; next[i] = { ...next[i], frequency: e.target.value }; setMedications(next);
                    }} />
                    <Input placeholder="Duration" className="col-span-2" value={m.duration} onChange={(e) => {
                      const next = [...medications]; next[i] = { ...next[i], duration: e.target.value }; setMedications(next);
                    }} />
                    <Button type="button" variant="ghost" size="sm" className="col-span-1" onClick={() => setMedications((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setMedications((prev) => [...prev, defaultMed()])}>
                  + Add medication
                </Button>
              </div>
            </div>
            <div>
              <Label>Instructions</Label>
              <textarea className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]" placeholder="Additional instructions..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="ml-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print view */}
      <Dialog open={!!printId} onOpenChange={(o) => { if (!o) { setPrintId(null); setPrintData(null); } }}>
        <DialogContent className="max-w-2xl print:max-w-none" id="prescription-print-area">
          <DialogHeader>
            <DialogTitle>Prescription</DialogTitle>
          </DialogHeader>
          {printData && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p><span className="font-medium text-gray-500">Patient:</span> {printData.patient?.fullName ?? printData.patient?.full_name ?? 'Unknown'}</p>
                <p><span className="font-medium text-gray-500">Doctor:</span> {printData.doctor?.fullName ?? printData.doctor?.full_name ?? 'Unknown'}</p>
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
                    {parsed.instructions && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Instructions</p>
                        <p className="whitespace-pre-wrap">{parsed.instructions}</p>
                      </div>
                    )}
                  </>
                );
              })()}
              <DialogFooter>
                <Button type="button" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

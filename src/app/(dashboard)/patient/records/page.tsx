'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Loader2, FileText, Calendar, Download, 
  Stethoscope, Pill, ClipboardList, User, Search, Eye, Printer
} from 'lucide-react';
import { TableBodySkeleton } from '@/components/admin/AdminSkeletons';

interface MedicalRecord {
  id: string;
  type: string;
  title: string;
  description?: string;
  fileUrl?: string;
  notes?: string;
  date: string;
  service?: string;
  doctor: string;
  createdAt: string;
}

interface PrescriptionRecord {
  id: string;
  type: 'prescription';
  title: string;
  description?: string;
  fileUrl?: string;
  notes?: string;
  date: string;
  service?: string;
  doctor: string;
  createdAt: string;
  startTime?: string;
}

type RecordItem = MedicalRecord | PrescriptionRecord;

const TYPE_ICONS: Record<string, any> = {
  consultation: Stethoscope,
  prescription: Pill,
  report: ClipboardList,
  document: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  consultation: 'bg-cyan-50 text-cyan-600',
  prescription: 'bg-purple-50 text-purple-600',
  report: 'bg-orange-50 text-orange-600',
  document: 'bg-gray-50 text-gray-600',
};

function prescriptionSummary(notes: string | null | undefined): string {
  if (!notes) return '—';
  try {
    const p = JSON.parse(notes) as { medications?: unknown[]; exercises?: unknown[]; instructions?: string; followUp?: string };
    const parts: string[] = [];
    if (p.medications?.length) parts.push(`${p.medications.length} med(s)`);
    if (p.exercises?.length) parts.push(`${p.exercises.length} exercise(s)`);
    if (p.instructions) parts.push('Instructions');
    if (p.followUp) parts.push('Follow-up');
    return parts.length ? parts.join(', ') : (p.instructions || '—');
  } catch {
    return notes.length > 80 ? notes.slice(0, 80) + '…' : notes;
  }
}

function parsePrescriptionNotes(notes: string | null | undefined): { medications?: { name: string; dosage?: string; frequency?: string; duration?: string }[]; exercises?: { name: string; reps?: string; sets?: string; duration?: string; notes?: string }[]; instructions?: string; followUp?: string } | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as any;
  } catch {
    return { instructions: notes };
  }
}

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);

  const handlePrintPrescription = () => {
    if (!selectedRecord || selectedRecord.type !== 'prescription') return;
    const parsed = parsePrescriptionNotes(selectedRecord.notes);
    const win = window.open('', '_blank');
    if (!win) return;
    const dateStr = new Date(selectedRecord.date || selectedRecord.createdAt).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    let medsHtml = '';
    if (parsed?.medications?.length) {
      medsHtml = `<div style="margin-bottom:16px"><h3 style="margin:0 0 8px 0;font-size:14px;color:#374151">Medications</h3><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;color:#4b5563">${parsed.medications.map(m => `<li><strong>${m.name}</strong>${[m.dosage, m.frequency, m.duration].filter(Boolean).length ? ` — ${[m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ')}` : ''}</li>`).join('')}</ul></div>`;
    }
    let exHtml = '';
    if (parsed?.exercises?.length) {
      exHtml = `<div style="margin-bottom:16px"><h3 style="margin:0 0 8px 0;font-size:14px;color:#374151">Exercises</h3><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;color:#4b5563">${parsed.exercises.map(e => `<li><strong>${e.name}</strong>${[e.reps && `${e.reps} reps`, e.sets && `${e.sets} sets`, e.duration, e.notes].filter(Boolean).length ? ` — ${[e.reps && `${e.reps} reps`, e.sets && `${e.sets} sets`, e.duration, e.notes].filter(Boolean).join(' • ')}` : ''}</li>`).join('')}</ul></div>`;
    }
    const instHtml = parsed?.instructions ? `<div style="margin-bottom:16px"><h3 style="margin:0 0 8px 0;font-size:14px;color:#374151">Instructions</h3><p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;white-space:pre-wrap">${parsed.instructions}</p></div>` : '';
    const followHtml = parsed?.followUp ? `<div style="margin-bottom:16px"><h3 style="margin:0 0 8px 0;font-size:14px;color:#374151">Follow-up</h3><p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;white-space:pre-wrap">${parsed.followUp}</p></div>` : '';
    const rawHtml = !parsed || (!parsed.medications?.length && !parsed.exercises?.length && !parsed.instructions && !parsed.followUp)
      ? `<p style="font-size:13px;color:#4b5563;white-space:pre-wrap">${selectedRecord.notes || 'No prescription details.'}</p>`
      : '';
    win.document.write(`
      <!DOCTYPE html><html><head><title>Prescription - ${selectedRecord.title}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:600px;margin:0 auto;color:#111}
      h1{font-size:20px;margin:0 0 8px 0;color:#0e7490}
      .meta{font-size:13px;color:#6b7280;margin-bottom:24px}
      hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
      @media print{body{padding:16px}}</style></head><body>
      <h1>${selectedRecord.title}</h1>
      <div class="meta">Dr. ${selectedRecord.doctor} • ${dateStr}</div>
      <hr/>
      ${medsHtml}${exHtml}${instHtml}${followHtml}${rawHtml}
      <hr/>
      <p style="font-size:11px;color:#9ca3af;margin-top:24px">H2H Healthcare • Prescription</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.onafterprint = () => win.close();
    }, 250);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/patient/records').then(r => r.json()),
      fetch('/api/patient/prescriptions').then(r => r.json()),
    ]).then(([recRes, preRes]) => {
      if (recRes.success) setRecords(recRes.data || []);
      else setRecords([]);
      if (preRes.success && Array.isArray(preRes.data)) {
        const pres = (preRes.data as any[]).map((p: any) => ({
          id: p.id,
          type: 'prescription' as const,
          title: p.serviceName || 'Prescription',
          description: prescriptionSummary(p.notes),
          fileUrl: p.fileUrl,
          notes: p.notes,
          date: p.date,
          service: p.serviceName,
          doctor: p.doctor || 'Doctor',
          createdAt: p.createdAt,
          startTime: p.startTime,
        }));
        setPrescriptions(pres);
      } else setPrescriptions([]);
    }).finally(() => setLoading(false));
  }, []);

  const allRecords: RecordItem[] = [
    ...records,
    ...prescriptions,
  ].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const stats = {
    total: allRecords.length,
    consultations: allRecords.filter(r => r.type === 'consultation').length,
    prescriptions: allRecords.filter(r => r.type === 'prescription').length,
    reports: allRecords.filter(r => r.type === 'report').length,
  };

  const filteredRecords = allRecords.filter(r => {
    const matchFilter = filter === 'all' || r.type === filter;
    if (!matchFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.doctor?.toLowerCase().includes(q) ||
      r.service?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-3 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">Medical Records</h1>
            <p className="text-xs md:text-sm text-gray-500">Your consultations, prescriptions & reports</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-cyan-100 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50">
                <Stethoscope className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-gray-900">{stats.consultations}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Consultations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <Pill className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-gray-900">{stats.prescriptions}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-orange-100 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50">
                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-gray-900">{stats.reports}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-[10px] md:text-xs text-gray-500">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by doctor, service, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'consultation', label: 'Consultations' },
            { key: 'prescription', label: 'Prescriptions' },
            { key: 'report', label: 'Reports' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
                className={`text-xs md:text-sm shrink-0 rounded-lg transition-all ${filter === f.key ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-md' : 'hover:border-cyan-300'}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Records - Table on desktop, Cards on mobile */}
      {loading ? (
        <TableBodySkeleton rows={8} />
      ) : filteredRecords.length === 0 ? (
        <Card className="border-gray-200 rounded-xl shadow-sm">
          <CardContent className="py-12 md:py-16 text-center">
            <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2 text-sm md:text-base">No records found</p>
            <p className="text-xs md:text-sm text-gray-400">
              {searchTerm || filter !== 'all' ? 'Try adjusting your search or filters' : 'Your consultations and prescriptions will appear here after appointments'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cyan-50/50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Doctor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Details</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const Icon = TYPE_ICONS[record.type] || FileText;
                    const colorClass = TYPE_COLORS[record.type] || TYPE_COLORS.document;
                    return (
                      <tr
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className="border-b border-gray-50 hover:bg-cyan-50/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${colorClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium capitalize">{record.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{record.title}</td>
                        <td className="py-3 px-4 text-gray-600">{record.doctor}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(record.date || record.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={record.description || ''}>
                          {record.description || record.service || '—'}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => { e.preventDefault(); setSelectedRecord(record); }}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            {record.fileUrl && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                  <Download className="h-3 w-3 mr-1" /> Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Record Detail Sheet */}
          <Sheet open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 rounded-none">
              {selectedRecord && (
                <>
                  <div className="pt-6 pb-6 px-6 pr-14 bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white mb-4">
                      {(() => {
                        const Icon = TYPE_ICONS[selectedRecord.type] || FileText;
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span className="text-sm font-medium capitalize">{selectedRecord.type}</span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{selectedRecord.title}</h2>
                    <div className="flex flex-col gap-2 mt-3 text-white/90 text-sm">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 opacity-80" /> {selectedRecord.doctor}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 opacity-80" />
                        {new Date(selectedRecord.date || selectedRecord.createdAt).toLocaleDateString('en-IN', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <SheetHeader className="sr-only">
                    <SheetTitle>{selectedRecord.title}</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 px-6 space-y-5">
                    {selectedRecord.type === 'prescription' && (() => {
                      const parsed = parsePrescriptionNotes(selectedRecord.notes);
                      if (!parsed || (!parsed.medications?.length && !parsed.exercises?.length && !parsed.instructions && !parsed.followUp)) {
                        return <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedRecord.notes || 'No prescription details.'}</p>;
                      }
                      return (
                        <div className="space-y-4">
                          {parsed.medications && parsed.medications.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Pill className="h-4 w-4 text-purple-500" /> Medications
                              </h4>
                              <ul className="space-y-2">
                                {parsed.medications.map((m, i) => (
                                  <li key={i} className="text-sm text-gray-700 bg-purple-50 p-3.5 border border-purple-100">
                                    <span className="font-semibold text-gray-900">{m.name}</span>
                                    {(m.dosage || m.frequency || m.duration) && (
                                      <span className="text-gray-500 ml-2">
                                        — {[m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ')}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {parsed.exercises && parsed.exercises.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-orange-500" /> Exercises
                              </h4>
                              <ul className="space-y-2">
                                {parsed.exercises.map((e, i) => (
                                  <li key={i} className="text-sm text-gray-700 bg-orange-50 rounded-xl p-3.5 border border-orange-100">
                                    <span className="font-semibold text-gray-900">{e.name}</span>
                                    {(e.reps || e.sets || e.duration || e.notes) && (
                                      <span className="text-gray-500 ml-2">
                                        — {[e.reps && `${e.reps} reps`, e.sets && `${e.sets} sets`, e.duration, e.notes].filter(Boolean).join(' • ')}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {parsed.instructions && (
                            <div className="bg-gray-50 border border-gray-100 p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h4>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{parsed.instructions}</p>
                            </div>
                          )}
                          {parsed.followUp && (
                            <div className="bg-cyan-50/50 border border-cyan-100 p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Follow-up</h4>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{parsed.followUp}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {selectedRecord.type !== 'prescription' && (
                      <>
                        {selectedRecord.description && (
                          <div className="bg-gray-50 border border-gray-100 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Details</h4>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedRecord.description}</p>
                          </div>
                        )}
                        {selectedRecord.service && (
                          <p className="text-sm text-gray-600"><strong>Service:</strong> {selectedRecord.service}</p>
                        )}
                        {!selectedRecord.description && !selectedRecord.service && (
                          <p className="text-sm text-gray-500">No additional details available.</p>
                        )}
                      </>
                    )}
                    {selectedRecord.fileUrl && (
                      <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-md">
                        <a href={selectedRecord.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> Download File
                        </a>
                      </Button>
                    )}
                    {selectedRecord.type === 'prescription' && (
                      <Button
                        onClick={handlePrintPrescription}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-md"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        {selectedRecord.fileUrl ? 'Print Prescription' : 'Download / Print Prescription'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRecords.map((record) => {
              const Icon = TYPE_ICONS[record.type] || FileText;
              const colorClass = TYPE_COLORS[record.type] || TYPE_COLORS.document;
              return (
                <Card
                  key={record.id}
                  className="border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-300 transition-colors active:bg-gray-50"
                  onClick={() => setSelectedRecord(record)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{record.title}</h3>
                          <Badge className="bg-gray-100 text-gray-600 capitalize shrink-0 text-[10px]">
                            {record.type}
                          </Badge>
                        </div>
                        {record.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{record.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {new Date(record.date || record.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {record.doctor}
                          </span>
                        </div>
                        {record.fileUrl && (
                          <Button size="sm" variant="outline" className="mt-2 text-xs h-7" asChild>
                            <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Download className="h-3 w-3 mr-1" /> Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

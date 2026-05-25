'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, RefreshCw, Loader2, FileText, ExternalLink, Pencil, ArrowRight } from 'lucide-react';
import { TableBodySkeleton } from '@/components/admin/AdminSkeletons';

interface ActivityItem {
  id: string;
  type: 'prescription' | 'appointment_status_changed' | 'prescription_edited';
  createdAt: string;
  patientName: string;
  details: string;
  appointmentId: string | null;
  entityId: string;
  meta?: Record<string, unknown>;
}

export default function DoctorActivityPage() {
  const [list, setList] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/activity?pageSize=100');
      const data = await res.json();
      if (data.success) {
        setList(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const actionLabel = (item: ActivityItem) => {
    if (item.type === 'prescription') return { label: 'Prescription', icon: FileText };
    if (item.type === 'prescription_edited') return { label: 'Prescription edited', icon: Pencil };
    if (item.type === 'appointment_status_changed') return { label: 'Status changed', icon: ArrowRight };
    return { label: item.type, icon: Activity };
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">Activity</h1>
            <p className="text-sm text-gray-500 mt-0.5">Console view of your recent prescriptions and actions</p>
          </div>
          <div className="flex items-center sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => fetchActivity()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableBodySkeleton rows={6} />
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No activity yet. Prescriptions you create will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Time</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[100px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => {
                  const { label, icon: Icon } = actionLabel(row);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.patientName ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {row.details ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.appointmentId ? (
                          <Link
                            href={`/doctor/prescriptions/appointment/${row.appointmentId}`}
                            className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:underline"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ListItemsSkeleton } from '@/components/admin/AdminSkeletons';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

interface AppointmentItem {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  service?: { name?: string };
  doctor?: { user?: { full_name?: string } };
}

interface PatientNotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientNotificationDrawer({ open, onOpenChange }: PatientNotificationDrawerProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/bookings');
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setAppointments(data.data);
        }
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b px-4 py-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Notifications
          </SheetTitle>
          <p className="text-[13px] text-gray-500">Your appointments</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <ListItemsSkeleton count={4} />
          ) : upcoming.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-600">No upcoming appointments</p>
              <p className="text-[12px] text-gray-400 mt-1">Your appointments will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcoming.map((apt) => (
                <Link
                  key={apt.id}
                  href="/patient/appointments"
                  onClick={() => onOpenChange(false)}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-gray-900 truncate">
                        {apt.service?.name ?? 'Appointment'} — Dr. {apt.doctor?.user?.full_name ?? 'Doctor'}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(apt.appointment_date)} • {apt.start_time?.slice(0, 5)}
                      </p>
                      <span
                        className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {upcoming.length > 0 && (
          <div className="border-t p-4 shrink-0">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/patient/appointments" onClick={() => onOpenChange(false)}>
                View all appointments
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

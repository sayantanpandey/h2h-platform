'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListItemsSkeleton } from '@/components/admin/AdminSkeletons';

interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  patient?: { fullName?: string };
  service?: { name?: string };
}

interface DoctorNotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seenIds?: Set<string>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: (ids: string[]) => void;
}

export function DoctorNotificationDrawer({ open, onOpenChange, seenIds = new Set(), onMarkAsRead, onMarkAllAsRead }: DoctorNotificationDrawerProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/doctor/appointments?pageSize=50');
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b px-4 py-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Notifications
          </SheetTitle>
          <p className="text-[13px] text-gray-500">Your recent appointments</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <ListItemsSkeleton count={4} />
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-600">No appointments yet</p>
              <p className="text-[12px] text-gray-400 mt-1">New bookings will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {appointments.map((apt) => {
                const isRead = seenIds.has(apt.id);
                return (
                  <Link
                    key={apt.id}
                    href="/doctor/appointments"
                    onClick={() => {
                      onMarkAsRead?.(apt.id);
                      onOpenChange(false);
                    }}
                    className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${isRead ? 'opacity-75' : ''}`}
                  >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isRead ? 'bg-gray-100' : 'bg-teal-100'}`}>
                      <User className={`h-4 w-4 ${isRead ? 'text-gray-500' : 'text-teal-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-gray-900 truncate">
                        {apt.patient?.fullName ?? 'Patient'} — {apt.service?.name ?? 'Appointment'}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(apt.date)}
                      </p>
                      <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {apt.startTime?.slice(0, 5)} – {apt.endTime?.slice(0, 5)}
                      </p>
                      {apt.status && (
                        <span
                          className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : apt.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {apt.status}
                        </span>
                      )}
                      {!isRead && apt.paymentStatus === 'paid' && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[11px] font-medium">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
        {appointments.length > 0 && (
          <div className="border-t p-4 shrink-0">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link
                href="/doctor/appointments"
                onClick={() => {
                  onMarkAllAsRead?.(appointments.map((a) => a.id));
                  onOpenChange(false);
                }}
              >
                View all appointments
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

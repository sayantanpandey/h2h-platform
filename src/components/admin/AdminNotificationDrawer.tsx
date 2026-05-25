'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Bell, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListItemsSkeleton } from '@/components/admin/AdminSkeletons';

interface ContactItem {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface BookingItem {
  id: string;
  patient_name: string;
  service_name: string;
  doctor_name: string;
  appointment_date: string;
  start_time: string;
  payment_status: string;
  created_at?: string;
}

type NotificationItem =
  | { type: 'contact'; data: ContactItem }
  | { type: 'booking'; data: BookingItem };

interface AdminNotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seenBookingIds?: Set<string>;
  onMarkBookingAsRead?: (id: string) => void;
}

export function AdminNotificationDrawer({ open, onOpenChange, seenBookingIds = new Set(), onMarkBookingAsRead }: AdminNotificationDrawerProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [msgRes, aptRes] = await Promise.all([
          fetch('/api/admin/contact-messages'),
          fetch('/api/admin/appointments?limit=15'),
        ]);
        const msgData = await msgRes.json().catch(() => ({}));
        const aptData = await aptRes.json().catch(() => ({}));

        const messages: NotificationItem[] = (msgData.success && msgData.data ? msgData.data : []).map(
          (m: any) => ({
            type: 'contact' as const,
            data: {
              id: m.id,
              name: m.name ?? '',
              email: m.email ?? '',
              message: m.message ?? '',
              status: m.status ?? 'new',
              created_at: m.created_at,
            },
          })
        );

        const bookings: NotificationItem[] = (aptData.success && aptData.data ? aptData.data : []).map(
          (a: any) => ({
            type: 'booking' as const,
            data: {
              id: a.id,
              patient_name: (a.patient as { full_name?: string })?.full_name ?? 'Patient',
              service_name: (a.service as { name?: string })?.name ?? 'Service',
              doctor_name: (a.doctor as { users?: { full_name?: string } })?.users?.full_name ?? 'Doctor',
              appointment_date: a.appointment_date,
              start_time: a.start_time,
              payment_status: a.payment_status ?? 'pending',
              created_at: a.created_at,
            },
          })
        );

        const combined = [
          ...messages.map((x) => ({ ...x, _t: new Date(x.data.created_at || 0).getTime() })),
          ...bookings.map((x) => ({
            ...x,
            _t: new Date(x.data.created_at || x.data.appointment_date + 'T' + x.data.start_time).getTime(),
          })),
        ]
          .sort((a, b) => (b as any)._t - (a as any)._t)
          .map(({ _t, ...rest }) => rest as NotificationItem);

        setItems(combined);
      } catch {
        setItems([]);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b px-4 py-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-cyan-600" />
            Notifications
          </SheetTitle>
          <p className="text-[13px] text-gray-500">Contact messages & bookings</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <ListItemsSkeleton count={4} />
          ) : items.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-600">No notifications yet</p>
              <p className="text-[12px] text-gray-400 mt-1">Messages and bookings will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) =>
                item.type === 'contact' ? (
                  <Link
                    key={`c-${item.data.id}`}
                    href={`/super-admin/help-support?expand=${item.data.id}`}
                    onClick={() => onOpenChange(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                          item.data.status === 'new' ? 'bg-cyan-100' : 'bg-gray-100'
                        }`}
                      >
                        <MessageCircle
                          className={`h-4 w-4 ${item.data.status === 'new' ? 'text-cyan-600' : 'text-gray-600'}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-gray-900 truncate">{item.data.name}</p>
                        <p className="text-[12px] text-gray-500 truncate">{item.data.email}</p>
                        <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-2">{item.data.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatDate(item.data.created_at)}</p>
                        {item.data.status === 'new' && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[11px] font-medium">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    key={`b-${item.data.id}`}
                    href={`/super-admin/appointments?id=${item.data.id}`}
                    onClick={() => {
                      onMarkBookingAsRead?.(item.data.id);
                      onOpenChange(false);
                    }}
                    className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${seenBookingIds.has(item.data.id) ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${seenBookingIds.has(item.data.id) ? 'bg-gray-100' : 'bg-teal-100'}`}>
                        <Calendar className={`h-4 w-4 ${seenBookingIds.has(item.data.id) ? 'text-gray-500' : 'text-teal-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-gray-900 truncate">
                          {item.data.patient_name} — {item.data.service_name}
                        </p>
                        <p className="text-[12px] text-gray-500 truncate">Dr. {item.data.doctor_name}</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {formatDate(item.data.appointment_date + 'T' + item.data.start_time)}
                        </p>
                        {item.data.payment_status === 'paid' && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            seenBookingIds.has(item.data.id) ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {seenBookingIds.has(item.data.id) ? 'Seen' : 'Paid'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t p-4 shrink-0 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href="/super-admin/notifications" onClick={() => onOpenChange(false)}>
                View all
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="flex-1">
              <Link href="/super-admin/help-support" onClick={() => onOpenChange(false)}>
                Help & Support
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

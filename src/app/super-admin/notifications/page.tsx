'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListItemsSkeleton } from '@/components/admin/AdminSkeletons';

interface ContactNotification {
  type: 'contact';
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

interface BookingNotification {
  type: 'booking';
  id: string;
  patient_name: string;
  service_name: string;
  doctor_name: string;
  appointment_date: string;
  start_time: string;
  payment_status: string;
  created_at: string;
}

type NotificationItem = ContactNotification | BookingNotification;

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'contact' | 'booking'>('all');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [msgRes, aptRes] = await Promise.all([
        fetch('/api/admin/contact-messages'),
        fetch('/api/admin/appointments?limit=50'),
      ]);

      const msgData = await msgRes.json().catch(() => ({}));
      const aptData = await aptRes.json().catch(() => ({}));

      const messages: ContactNotification[] = (msgData.success && msgData.data ? msgData.data : []).map(
        (m: any) => ({
          type: 'contact' as const,
          id: m.id,
          name: m.name ?? '',
          email: m.email ?? '',
          phone: m.phone ?? null,
          message: m.message ?? '',
          status: m.status ?? 'new',
          created_at: m.created_at,
        })
      );

      const bookings: BookingNotification[] = (aptData.success && aptData.data ? aptData.data : []).map(
        (a: any) => ({
          type: 'booking' as const,
          id: a.id,
          patient_name: (a.patient as { full_name?: string })?.full_name ?? 'Patient',
          service_name: (a.service as { name?: string })?.name ?? 'Service',
          doctor_name: (a.doctor as { users?: { full_name?: string } })?.users?.full_name ?? 'Doctor',
          appointment_date: a.appointment_date,
          start_time: a.start_time,
          payment_status: a.payment_status ?? 'pending',
          created_at: a.created_at ?? a.appointment_date,
        })
      );

      const combined: NotificationItem[] = [
        ...messages.map((m) => ({ ...m, _sort: new Date(m.created_at).getTime() })),
        ...bookings.map((b) => ({ ...b, _sort: new Date(b.created_at).getTime() })),
      ].sort((a, b) => ((b as any)._sort - (a as any)._sort) as number)
        .map(({ _sort, ...rest }) => rest as NotificationItem);

      setItems(combined);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const filtered =
    filter === 'contact'
      ? items.filter((i) => i.type === 'contact')
      : filter === 'booking'
      ? items.filter((i) => i.type === 'booking')
      : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            All contact messages and new bookings in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'contact' | 'booking')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[14px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All</option>
            <option value="contact">Contact messages</option>
            <option value="booking">Bookings</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="shrink-0">
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <ListItemsSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[15px] font-medium text-gray-700">No notifications yet</p>
          <p className="text-[13px] text-gray-500 mt-1">
            Contact messages and new bookings will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {item.type === 'contact' ? (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === 'new'
                          ? 'bg-cyan-100 text-cyan-600'
                          : item.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-[13px] text-gray-500 truncate">{item.email}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {formatDate(item.created_at)}
                        {item.status === 'new' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-medium">
                            New
                          </span>
                        )}
                      </p>
                      {item.message && (
                        <p className="text-[13px] text-gray-600 mt-2 line-clamp-2">{item.message}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/super-admin/help-support?expand=${item.id}`}
                    className="flex-shrink-0"
                  >
                    <Button size="sm" variant="outline" className="text-[13px]">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Details
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-teal-100 text-teal-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-gray-900 truncate">
                        {item.patient_name} booked {item.service_name}
                      </p>
                      <p className="text-[13px] text-gray-500 truncate">with {item.doctor_name}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {item.appointment_date} • {item.start_time}
                        {item.payment_status === 'paid' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium">
                            Paid
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/super-admin/appointments?id=${item.id}`}
                    className="flex-shrink-0"
                  >
                    <Button size="sm" variant="outline" className="text-[13px]">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Details
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListItemsSkeleton } from '@/components/admin/AdminSkeletons';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  services: string[];
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

function HelpSupportContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const expandId = searchParams.get('expand');

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  useEffect(() => {
    if (expandId && messages.length > 0) {
      const found = messages.some((m) => m.id === expandId);
      if (found) setExpandedId(expandId);
    }
  }, [expandId, messages]);

  async function fetchMessages() {
    setLoading(true);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/admin/contact-messages'
          : `/api/admin/contact-messages?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: 'new' | 'read' | 'replied') {
    const prev = messages.find((m) => m.id === id)?.status;
    setMessages((p) => p.map((m) => (m.id === id ? { ...m, status } : m)));
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessages((p) => p.map((m) => (m.id === id && prev ? { ...m, status: prev } : m)));
      }
    } catch {
      if (prev) setMessages((p) => p.map((m) => (m.id === id ? { ...m, status: prev } : m)));
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Contact form submissions from the website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'new' | 'read' | 'replied')
            }
            className="rounded-lg border border-gray-200 px-3 py-2 text-[14px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="shrink-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <ListItemsSkeleton count={6} />
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-[15px] font-medium text-gray-700">No messages yet</p>
          <p className="text-[13px] text-gray-500 mt-1">
            Contact form submissions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border bg-white overflow-hidden transition-all ${
                msg.status === 'new'
                  ? 'border-cyan-200 ring-1 ring-cyan-100'
                  : 'border-gray-200'
              }`}
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === msg.id ? null : msg.id)
                }
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      msg.status === 'new'
                        ? 'bg-cyan-100 text-cyan-600'
                        : msg.status === 'replied'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {msg.status === 'new' ? (
                      <Clock className="w-5 h-5" />
                    ) : msg.status === 'replied' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-gray-900 truncate">
                      {msg.name}
                    </p>
                    <p className="text-[13px] text-gray-500 truncate">
                      {msg.email} • {formatDate(msg.created_at)}
                    </p>
                  </div>
                  {msg.status === 'new' && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-100 text-cyan-700">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedId === msg.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedId === msg.id && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-[13px] text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${msg.email}`}
                        className="text-cyan-600 hover:underline truncate"
                      >
                        {msg.email}
                      </a>
                    </div>
                    {msg.phone && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${msg.phone}`}
                          className="text-cyan-600 hover:underline"
                        >
                          {msg.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {msg.services.length > 0 && (
                    <div>
                      <p className="text-[12px] font-medium text-gray-500 mb-1">
                        Services
                      </p>
                      <p className="text-[13px] text-gray-700">
                        {msg.services.join(', ')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[12px] font-medium text-gray-500 mb-1">
                      Message
                    </p>
                    <p className="text-[14px] text-gray-900 whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {msg.status !== 'read' && msg.status !== 'replied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(msg.id, 'read')}
                        disabled={updatingId === msg.id}
                        className="text-[13px]"
                      >
                        {updatingId === msg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : null}
                        Mark Read
                      </Button>
                    )}
                    {msg.status !== 'replied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(msg.id, 'replied')}
                        disabled={updatingId === msg.id}
                        className="text-[13px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        {updatingId === msg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : null}
                        Mark Replied
                      </Button>
                    )}
                    {msg.status !== 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(msg.id, 'new')}
                        disabled={updatingId === msg.id}
                        className="text-[13px] text-gray-600"
                      >
                        Mark New
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpSupportPage() {
  return (
    <Suspense fallback={<ListItemsSkeleton count={4} />}>
      <HelpSupportContent />
    </Suspense>
  );
}

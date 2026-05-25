'use client';

import { useState } from 'react';
import { Video, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DailyJoinRole = 'admin' | 'doctor';

interface DailyJoinButtonProps {
  appointmentId: string;
  role: DailyJoinRole;
  className?: string;
  variant?: 'link' | 'button' | 'primary';
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function DailyJoinButton({
  appointmentId,
  role,
  className = '',
  variant = 'link',
  label,
  onClick,
}: DailyJoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const defaultLabel =
    role === 'admin' ? 'Start / Join as Host' : 'Join Video Call';

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    setLoading(true);
    try {
      const res = await fetch('/api/video/join-url', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not open video call');
      }
      if (!String(data.url).includes('?t=')) {
        throw new Error('Invalid host link — please try again');
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join call';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayLabel = label ?? defaultLabel;

  if (variant === 'primary' || variant === 'button') {
    return (
      <Button
        type="button"
        variant={variant === 'primary' ? 'default' : 'outline'}
        size="sm"
        className={
          variant === 'primary'
            ? `bg-emerald-600 hover:bg-emerald-700 text-white ${className}`
            : className
        }
        disabled={loading}
        onClick={handleJoin}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : variant === 'primary' ? (
          <Play className="h-4 w-4 mr-2" />
        ) : (
          <Video className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Opening meeting…' : displayLabel}
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleJoin}
      className={`font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
      {loading ? 'Opening…' : displayLabel}
    </button>
  );
}

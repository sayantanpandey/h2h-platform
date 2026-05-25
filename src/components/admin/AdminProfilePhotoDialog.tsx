'use client';

import { useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfilePhotoPicker } from '@/components/shared/ProfilePhotoPicker';

type AdminProfilePhotoDialogProps = {
  userId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  onSaved?: (url: string) => void;
};

export function AdminProfilePhotoDialog({
  userId,
  email,
  fullName,
  avatarUrl,
  onSaved,
}: AdminProfilePhotoDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setValue(avatarUrl || '');
    setError(null);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save photo');
        return;
      }
      onSaved?.(value);
      setOpen(false);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center gap-2 w-full mt-2 px-2 py-1.5 rounded-md text-[11px] text-cyan-400/90 hover:text-cyan-300 hover:bg-white/5 transition-colors"
      >
        <Camera className="h-3.5 w-3.5 shrink-0" />
        Update my photo
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-photo-title"
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 id="admin-photo-title" className="text-base font-semibold text-gray-900">
                Your profile photo
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <ProfilePhotoPicker
                value={value}
                onChange={setValue}
                name={fullName || email}
                email={email}
                userId={userId}
              />
              {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/80">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

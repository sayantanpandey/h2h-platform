'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Upload } from 'lucide-react';

const AVATAR_STYLES = ['lorelei', 'avataaars', 'micah', 'notionists', 'personas'] as const;

type ProfilePhotoPickerProps = {
  value: string;
  onChange: (url: string) => void;
  name?: string;
  email?: string | null;
  userId?: string;
  className?: string;
};

function avatarSeed(name: string, email?: string | null) {
  return name?.trim() || email?.trim() || 'user';
}

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function previewSrc(value: string, name: string, email?: string | null) {
  if (value?.trim()) return value.trim();
  return dicebearUrl('lorelei', avatarSeed(name, email));
}

export function ProfilePhotoPicker({
  value,
  onChange,
  name = 'Profile',
  email,
  userId,
  className,
}: ProfilePhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<string>(AVATAR_STYLES[0]);

  const displaySrc = previewSrc(value, name, email);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      if (userId) body.append('userId', userId);

      const res = await fetch('/api/upload/avatar', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError('Network error while uploading');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function generateAvatar() {
    setUploadError(null);
    const seed = avatarSeed(name, email);
    onChange(dicebearUrl(avatarStyle, seed));
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-cyan-200 bg-gray-100">
          <Image
            src={displaySrc}
            alt={name}
            fill
            className="object-cover"
            unoptimized={displaySrc.startsWith('http')}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-gray-900">Profile photo</p>
          <p className="text-xs text-gray-500">
            Upload a real photo or generate a unique avatar from the doctor&apos;s name.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">Generate avatar</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={avatarStyle}
            onChange={(e) => setAvatarStyle(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            {AVATAR_STYLES.map((style) => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={generateAvatar} className="shrink-0">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate avatar
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">Upload photo</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full border-cyan-200 text-cyan-800 hover:bg-cyan-50"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Choose photo from device
            </>
          )}
        </Button>
        <p className="text-[11px] text-gray-500 text-center">JPEG, PNG, or WebP · max 5MB</p>
        {uploadError && (
          <p className="text-xs text-red-600 text-center bg-red-50 rounded-lg py-2 px-2">{uploadError}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Or paste image URL</label>
        <Input
          value={value}
          onChange={(e) => {
            setUploadError(null);
            onChange(e.target.value);
          }}
          placeholder="https://…"
          className="text-sm"
        />
      </div>
    </div>
  );
}

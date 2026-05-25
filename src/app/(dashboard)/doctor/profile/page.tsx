'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileFormSkeleton } from '@/components/admin/AdminSkeletons';
import { ProfilePhotoPicker } from '@/components/shared/ProfilePhotoPicker';
import { User, Loader2, Save, Phone, Mail, Briefcase, GraduationCap, FileText, DollarSign, Video, X } from 'lucide-react';

interface ProfileData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  specializations: string[];
  qualifications: string[];
  experienceYears: number;
  bio: string;
  consultationFee: number;
  googleMeetEnabled: boolean;
  rating: number;
  totalReviews: number;
  location: { id: string; name: string; city: string; address?: string } | null;
  services: string[];
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/profile');
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setProfile(p);
        setFullName(p.fullName ?? '');
        setPhone(p.phone ?? '');
        setBio(p.bio ?? '');
        setSpecializations(Array.isArray(p.specializations) ? p.specializations : []);
        setQualifications(Array.isArray(p.qualifications) ? p.qualifications : []);
        setExperienceYears(p.experienceYears ?? 0);
        setAvatarUrl(p.avatarUrl ?? '');
      } else {
        setError(data.error ?? 'Failed to load profile');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const addSpecialization = () => {
    const v = specializationInput.trim();
    if (v && !specializations.includes(v)) {
      setSpecializations((prev) => [...prev, v]);
      setSpecializationInput('');
    }
  };

  const removeSpecialization = (idx: number) => {
    setSpecializations((prev) => prev.filter((_, i) => i !== idx));
  };

  const addQualification = () => {
    const v = qualificationInput.trim();
    if (v && !qualifications.includes(v)) {
      setQualifications((prev) => [...prev, v]);
      setQualificationInput('');
    }
  };

  const removeQualification = (idx: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
          specializations,
          qualifications,
          experienceYears: Math.max(0, experienceYears),
          avatarUrl: avatarUrl.trim() || undefined,
          // consultationFee, googleMeetEnabled: doctors cannot change — contact admin
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfile();
      } else {
        setError(data.error ?? 'Failed to save');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return <ProfileFormSkeleton />;
  }

  if (error && !profile) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center text-gray-600">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your doctor profile and account settings</p>
        </div>
        <div className="flex justify-end sm:ml-auto">
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <ProfilePhotoPicker
                value={avatarUrl}
                onChange={setAvatarUrl}
                name={fullName || profile?.fullName || 'Doctor'}
                email={profile?.email}
                userId={profile?.userId}
              />
            </div>
            <div>
              <Label>Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Full Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-500">
                <Mail className="h-4 w-4" /> Email (read-only)
              </Label>
              <Input value={profile?.email ?? ''} disabled className="mt-1 bg-gray-50" />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Professional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Specializations
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  placeholder="e.g. Sports Medicine"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSpecialization}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {specializations.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-50 text-cyan-800 text-sm">
                    {s}
                    <button type="button" onClick={() => removeSpecialization(i)} className="hover:text-cyan-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Qualifications
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  placeholder="e.g. MBBS, MD"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addQualification}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {qualifications.map((q, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 text-teal-800 text-sm">
                    {q}
                    <button type="button" onClick={() => removeQualification(i)} className="hover:text-teal-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label>Experience (years)</Label>
              <Input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                className="mt-1"
              />
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Read-only (contact admin to change)</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" /> Consultation fee: ₹{profile?.consultationFee ?? 0}
                </span>
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-400" /> Google Meet: {profile?.googleMeetEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Bio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief professional bio, areas of expertise, approach to treatment..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[120px]"
          />
        </CardContent>
      </Card>

      {profile && (profile.location || profile.services?.length) && (
        <Card className="mt-6 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Read-only info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            {profile.location && (
              <p><strong>Primary location:</strong> {profile.location.name}, {profile.location.city}</p>
            )}
            {profile.services?.length > 0 && (
              <p><strong>Services:</strong> Managed via admin. Contact admin to update.</p>
            )}
            <p><strong>Rating:</strong> {profile.rating} ({profile.totalReviews} reviews)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

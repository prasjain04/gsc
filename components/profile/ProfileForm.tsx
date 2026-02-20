'use client';

import { useState, useRef } from 'react';
import DietaryPicker from './DietaryPicker';
import { createBrowserSupabase } from '@/lib/supabase';

interface ProfileFormProps {
  userId: string;
  initialName?: string;
  initialAvatarUrl?: string | null;
  initialDietary?: string[];
  onSave: () => void;
}

export default function ProfileForm({
  userId,
  initialName = '',
  initialAvatarUrl = null,
  initialDietary = [],
  onSave,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [dietary, setDietary] = useState<string[]>(initialDietary);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setSaving(true);
    setError('');
    const supabase = createBrowserSupabase();

    let finalAvatarUrl = avatarUrl;

    // Upload avatar if changed
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setError('Failed to upload photo: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      finalAvatarUrl = publicUrl;
    }

    // Save profile
    const { error: saveError } = await supabase.from('profiles').upsert({
      id: userId,
      name: name.trim(),
      avatar_url: finalAvatarUrl,
      dietary_restrictions: dietary,
    });

    if (saveError) {
      setError('Failed to save profile: ' + saveError.message);
      setSaving(false);
      return;
    }

    onSave();
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden transition-transform hover:scale-105"
          style={{
            border: '2px solid var(--accent-warm)',
            background: 'var(--surface)',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
          )}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <span className="text-white text-xs font-body">Change</span>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <p className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
          Tap to upload a photo
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block font-body text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-elegant font-body text-lg"
          placeholder="First name"
          required
        />
      </div>

      {/* Dietary Restrictions */}
      <div>
        <label className="block font-body text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--accent-warm)' }}>
          Dietary Restrictions
        </label>
        <DietaryPicker selected={dietary} onChange={setDietary} />
      </div>

      {error && (
        <p className="text-sm font-body" style={{ color: 'var(--accent)' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-elegant-filled w-full py-3 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save & Continue'}
      </button>
    </form>
  );
}

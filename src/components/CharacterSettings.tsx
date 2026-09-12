import React, { useState } from 'react';
import { Character } from '../types';
import { X } from 'lucide-react';

interface CharacterSettingsProps {
  character: Character;
  onSave: (character: Character) => void;
  onClose: () => void;
}

/**
 * Phase 6 exposes only user-facing Character settings.
 * Provider/model strategy and system instructions stay internal.
 */
export function CharacterSettings({ character, onSave, onClose }: CharacterSettingsProps) {
  const [displayName, setDisplayName] = useState(character.identity.displayName);
  const [description, setDescription] = useState(character.identity.description);
  const [greeting, setGreeting] = useState(character.identity.greeting);
  const [avatarSource, setAvatarSource] = useState(character.avatar.source);
  const [voiceEnabled, setVoiceEnabled] = useState(character.voiceModels.default.enabled);
  const [voiceLanguage, setVoiceLanguage] = useState(character.voiceModels.default.language);
  const [speechRate, setSpeechRate] = useState(
    character.voiceModels.default.speechRate ?? character.voiceModels.default.rate ?? 1,
  );
  const [pitch, setPitch] = useState(character.voiceModels.default.pitch ?? 1);
  const [volume, setVolume] = useState(character.voiceModels.default.volume ?? 1);

  const save = () => {
    onSave({
      ...character,
      identity: {
        ...character.identity,
        displayName: displayName.trim() || character.identity.displayName,
        description: description.trim(),
        greeting: greeting.trim() || character.identity.greeting,
      },
      avatar: {
        ...character.avatar,
        source: avatarSource.trim() || character.avatar.source,
      },
      voiceModels: {
        ...character.voiceModels,
        default: {
          ...character.voiceModels.default,
          enabled: voiceEnabled,
          language: voiceLanguage.trim() || character.voiceModels.default.language,
          speechRate,
          rate: speechRate,
          pitch,
          volume,
        },
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-settings-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#2a1740] p-5 text-amber-50 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/60">Character Settings</p>
            <h2 id="character-settings-title" className="mt-1 text-2xl font-bold text-amber-200">
              تنظیمات {character.identity.displayName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-50/55">
              تنظیمات این شخصیت مستقل از سایر شخصیت‌ها ذخیره می‌شود.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن تنظیمات" className="rounded-full p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h3 className="font-semibold text-amber-200">شخصیت</h3>
            <label className="block text-sm">
              نام نمایشی
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2 outline-none focus:border-amber-300/40" />
            </label>
            <label className="block text-sm">
              توضیحات
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2 outline-none focus:border-amber-300/40" />
            </label>
            <label className="block text-sm">
              پیام خوش‌آمدگویی
              <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={2} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2 outline-none focus:border-amber-300/40" />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h3 className="font-semibold text-amber-200">Avatar</h3>
            <label className="block text-sm">
              Avatar image URL
              <input value={avatarSource} onChange={(e) => setAvatarSource(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2 outline-none focus:border-amber-300/40" />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <h3 className="font-semibold text-amber-200">Voice</h3>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1b0e2b] p-3 text-sm">
              <span>خواندن پاسخ‌ها با صدا</span>
              <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} className="h-5 w-5" />
            </label>
            <label className="block text-sm">
              زبان
              <input value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2 outline-none focus:border-amber-300/40" />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                سرعت
                <input type="number" min="0.5" max="2" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2" />
              </label>
              <label className="block text-sm">
                زیر و بمی
                <input type="number" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2" />
              </label>
              <label className="block text-sm">
                بلندی صدا
                <input type="number" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b0e2b] px-3 py-2" />
              </label>
            </div>
          </section>

          <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.03] p-4 text-xs leading-6 text-amber-50/50">
            Provider، Model، Response Manager، Voice Manager و system instructions از تنظیمات کاربر جدا نگه داشته می‌شوند.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5">انصراف</button>
            <button type="button" onClick={save} className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-bold text-[#21102e] hover:bg-amber-400">ذخیره</button>
          </div>
        </div>
      </div>
    </div>
  );
}

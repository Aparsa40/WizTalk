import React, { useState } from 'react';
import { Character } from '../types';
import { createCharacterDraft } from '../services/character';

interface CharacterFormProps {
  initial?: Character;
  onSave: (character: Character) => void;
  onCancel: () => void;
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-white/10 bg-[#170c26] px-3 py-2.5 text-sm text-amber-50 outline-none transition focus:border-amber-300/70';

export function CharacterForm({ initial, onSave, onCancel }: CharacterFormProps) {
  const [form, setForm] = useState<Character>(() =>
    createCharacterDraft(initial ? JSON.parse(JSON.stringify(initial)) : {}),
  );

  const update = (patch: Partial<Character>) =>
    setForm((current) => ({ ...current, ...patch }));

  const updatePersonality = (
    key: keyof Character['personality'],
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      personality: { ...current.personality, [key]: value },
    }));

  const valid =
    form.name.trim() && form.displayName.trim();

  const save = () => {
    if (valid) {
      onSave({
        ...form,
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        source: 'custom',
      });
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-1" id="character-form-container">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-amber-100/80">
          نام شناسه (انگلیسی)
          <input
            id="char-form-name"
            className={fieldClass}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="مثلاً luna"
          />
        </label>

        <label className="text-sm text-amber-100/80">
          نام نمایشی (فارسی)
          <input
            id="char-form-display-name"
            className={fieldClass}
            value={form.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
            placeholder="مثلاً لونا لاوگود"
          />
        </label>

        <label className="text-sm text-amber-100/80 sm:col-span-2">
          توضیح کوتاه
          <input
            id="char-form-description"
            className={fieldClass}
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="دانش‌آموز عجیب و متفکر ریونکلا"
          />
        </label>

        <label className="text-sm text-amber-100/80">
          نقش در هاگوارتز
          <input
            id="char-form-role"
            className={fieldClass}
            value={form.role}
            onChange={(e) => update({ role: e.target.value })}
            placeholder="عضو ارتش دامبلدور"
          />
        </label>

        <label className="text-sm text-amber-100/80">
          آدرس تصویر آواتار
          <input
            id="char-form-avatar"
            className={fieldClass}
            dir="ltr"
            value={form.avatar.source}
            onChange={(e) =>
              update({ avatar: { ...form.avatar, source: e.target.value } })
            }
            placeholder="https://..."
          />
        </label>

        <label className="text-sm text-amber-100/80 sm:col-span-2">
          پیام خوش‌آمدگویی
          <input
            id="char-form-greeting"
            className={fieldClass}
            value={form.greeting}
            onChange={(e) => update({ greeting: e.target.value })}
            placeholder="سلام! به دنبال نارجِل‌ها هستی؟"
          />
        </label>

        <label className="text-sm text-amber-100/80">
          شخصیت و رفتار
          <textarea
            id="char-form-personality-desc"
            className={fieldClass + ' min-h-20'}
            value={form.personality.description}
            onChange={(e) => updatePersonality('description', e.target.value)}
            placeholder="آرام، خیال‌پرداز، صبور و مهربان"
          />
        </label>

        <label className="text-sm text-amber-100/80">
          لحن گفت‌وگو
          <textarea
            id="char-form-personality-tone"
            className={fieldClass + ' min-h-20'}
            value={form.personality.tone}
            onChange={(e) => updatePersonality('tone', e.target.value)}
            placeholder="آرامش‌بخش، شگفت‌زده و صمیمی"
          />
        </label>

        <label className="text-sm text-amber-100/80 sm:col-span-2">
          زبان صدا برای خواندن (TTS)
          <input
            id="char-form-voice-lang"
            className={fieldClass}
            dir="ltr"
            value={form.voice.language}
            onChange={(e) =>
              update({ voice: { ...form.voice, language: e.target.value } })
            }
          />
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          id="char-form-cancel-btn"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-amber-100/70 hover:bg-white/5"
        >
          انصراف
        </button>
        <button
          type="button"
          id="char-form-save-btn"
          disabled={!valid}
          onClick={save}
          className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-[#21102e] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ذخیره شخصیت
        </button>
      </div>
    </div>
  );
}

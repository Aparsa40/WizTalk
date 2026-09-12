import React, { useState } from 'react';
import { Character, Provider } from '../types';
import { createCharacterDraft } from '../services/character';
import { getDefaultModel } from '../services/ai';

interface CharacterFormProps {
  initial?: Character;
  onSave: (character: Character) => void;
  onCancel: () => void;
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-white/10 bg-[#170c26] px-3 py-2.5 text-sm text-amber-50 outline-none transition focus:border-amber-300/70';

export function CharacterForm({
  initial,
  onSave,
  onCancel,
}: CharacterFormProps) {
  const [form, setForm] = useState<Character>(() =>
    createCharacterDraft(
      initial
        ? JSON.parse(JSON.stringify(initial))
        : {},
    ),
  );

  /**
   * Update fields that live inside Character.identity.
   *
   * The Phase 2 Character schema moved the basic character
   * information from the root Character object into identity.
   */
  const updateIdentity = (
    patch: Partial<Character['identity']>,
  ) => {
    setForm((current) => ({
      ...current,
      identity: {
        ...current.identity,
        ...patch,
      },
    }));
  };

  /**
   * Small reusable input renderer.
   *
   * Keeping the input creation in one place reduces duplicated
   * JSX while still allowing each field to update its correct
   * location in the new Character schema.
   */
  const label = (
    text: string,
    value: string,
    change: (value: string) => void,
    placeholder?: string,
  ) => (
    <label className="text-sm text-amber-100/80">
      {text}

      <input
        className={fieldClass}
        value={value}
        onChange={(event) =>
          change(event.target.value)
        }
        placeholder={placeholder}
      />
    </label>
  );

  /**
   * Character validity is based on the new Phase 2 schema.
   */
  const valid =
    form.identity.name.trim() &&
    form.identity.displayName.trim() &&
    form.identity.systemInstructions.trim();

  /**
   * Save the character using the new nested schema.
   *
   * `source` now belongs to Character.settings rather than
   * being a root-level Character property.
   */
  const save = () => {
    if (!valid) {
      return;
    }

    onSave({
      ...form,
      identity: {
        ...form.identity,
        name: form.identity.name.trim(),
        displayName: form.identity.displayName.trim(),
      },
      settings: {
        ...form.settings,
        source: 'custom',
      },
    });
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-1">
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Internal name */}
        {label(
          'نام داخلی',
          form.identity.name,
          (name) => updateIdentity({ name }),
          'مثلاً Luna',
        )}

        {/* Display name */}
        {label(
          'نام نمایشی',
          form.identity.displayName,
          (displayName) =>
            updateIdentity({ displayName }),
          'مثلاً لونا',
        )}

        {/* Description */}
        {label(
          'توضیح کوتاه',
          form.identity.description,
          (description) =>
            updateIdentity({ description }),
        )}

        {/* Role */}
        {label(
          'نقش',
          form.identity.role,
          (role) => updateIdentity({ role }),
        )}

        {/* Avatar source */}
        {label(
          'آدرس تصویر Avatar',
          form.avatar.source,
          (source) =>
            setForm((current) => ({
              ...current,
              avatar: {
                ...current.avatar,
                source,
              },
            })),
          'https://...',
        )}

        {/* Greeting */}
        {label(
          'پیام خوش‌آمد',
          form.identity.greeting,
          (greeting) =>
            updateIdentity({ greeting }),
        )}

        {/* System instructions */}
        <label className="text-sm text-amber-100/80 sm:col-span-2">
          دستورهای سیستمی

          <textarea
            className={`${fieldClass} min-h-24`}
            value={
              form.identity.systemInstructions
            }
            onChange={(event) =>
              updateIdentity({
                systemInstructions:
                  event.target.value,
              })
            }
          />
        </label>

        {/* Personality description */}
        {label(
          'شخصیت و رفتار',
          form.identity.personality.description,
          (description) =>
            updateIdentity({
              personality: {
                ...form.identity.personality,
                description,
              },
            }),
        )}

        {/* Personality tone */}
        {label(
          'لحن گفت‌وگو',
          form.identity.personality.tone,
          (tone) =>
            updateIdentity({
              personality: {
                ...form.identity.personality,
                tone,
              },
            }),
        )}

        {/* Default text provider */}
        <label className="text-sm text-amber-100/80">
          ارائه‌دهنده‌ی پیش‌فرض

          <select
            className={fieldClass}
            value={
              form.textModels.default.provider
            }
            onChange={(event) => {
              const provider =
                event.target.value as Provider;

              setForm((current) => ({
                ...current,
                textModels: {
                  ...current.textModels,
                  default: {
                    ...current.textModels.default,
                    provider,
                    model:
                      getDefaultModel(provider),
                  },
                },
              }));
            }}
          >
            <option value="local">
              آفلاین
            </option>

            <option value="gemini">
              Gemini
            </option>

            <option value="openai">
              OpenAI
            </option>
          </select>
        </label>

        {/* Default text model */}
        {label(
          'مدل پیش‌فرض',
          form.textModels.default.model,
          (model) =>
            setForm((current) => ({
              ...current,
              textModels: {
                ...current.textModels,
                default: {
                  ...current.textModels.default,
                  model,
                },
              },
            })),
        )}

        {/* Voice language */}
        {label(
          'زبان صدا',
          form.voiceModels.default.language,
          (language) =>
            setForm((current) => ({
              ...current,
              voiceModels: {
                ...current.voiceModels,
                default: {
                  ...current.voiceModels.default,
                  language,
                },
              },
            })),
        )}
         </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-amber-100/70 hover:bg-white/5"
        >
          انصراف
        </button>

        <button
          type="button"
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

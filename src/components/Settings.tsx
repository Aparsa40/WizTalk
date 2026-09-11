import React, { useState } from 'react';
import { AppState, Character } from '../types';
import { CharacterManager } from './CharacterManager';
import { X, Volume2, Users, Sliders } from 'lucide-react';

interface SettingsProps {
  appState: AppState;
  characters: Character[];
  onCharactersChange: (characters: Character[]) => void;
  onUpdateState: (updates: Partial<AppState>) => void;
  onClose: () => void;
}

export function Settings({
  appState,
  characters,
  onCharactersChange,
  onUpdateState,
  onClose,
}: SettingsProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(appState.voiceEnabled);
  const [showManager, setShowManager] = useState(false);

  const save = () => {
    onUpdateState({ voiceEnabled });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div
          id="settings-modal"
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#2a1740] p-6 text-amber-50 shadow-2xl"
        >
          <button
            type="button"
            id="settings-close-btn"
            onClick={onClose}
            className="absolute left-5 top-5 rounded-full p-2 text-amber-100/60 hover:bg-white/10 hover:text-white"
            aria-label="بستن تنظیمات"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/70">WizTalk</p>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-amber-200">تنظیمات برنامه</h2>

          <div className="mt-6 space-y-5">
            <label
              id="voice-toggle-option"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 p-4 transition hover:border-amber-400/30"
            >
              <div className="flex items-start gap-3">
                <Volume2 className="mt-0.5 h-5 w-5 text-amber-300" />
                <span>
                  <span className="block text-sm font-semibold text-amber-100">
                    خواندن صوتی پاسخ‌ها
                  </span>
                  <span className="mt-1 block text-xs text-amber-50/50">
                    پخش هوشمند صدا بر اساس زبان و ویژگی‌های شخصیت
                  </span>
                </span>
              </div>
              <input
                type="checkbox"
                id="voice-toggle-checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-amber-400"
              />
            </label>

            <button
              type="button"
              id="open-character-manager-btn"
              onClick={() => setShowManager(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-300/30 bg-amber-400/5 p-4 text-right transition hover:bg-amber-300/10"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-300" />
                <div>
                  <span className="block text-sm font-semibold text-amber-200">
                    مدیریت شخصیت‌ها
                  </span>
                  <span className="mt-0.5 block text-xs text-amber-200/60">
                    مشاهده، ویرایش و ساخت شخصیت اختصاصی ({characters.length} شخصیت)
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-200">
                {characters.length}
              </span>
            </button>

            <button
              type="button"
              id="save-settings-btn"
              onClick={save}
              className="w-full rounded-xl bg-amber-500 py-3 font-bold text-[#21102e] shadow-lg transition hover:bg-amber-400"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>

      {showManager && (
        <CharacterManager
          characters={characters}
          onChange={onCharactersChange}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
}

import React, { useState } from 'react';
import { AppState, Character } from '../types';
import { CharacterManager } from './CharacterManager';
import { X } from 'lucide-react';

interface SettingsProps { appState: AppState; characters: Character[]; onCharactersChange: (characters: Character[]) => void; onUpdateState: (updates: Partial<AppState>) => void; onClose: () => void; }

export function Settings({ appState, characters, onCharactersChange, onUpdateState, onClose }: SettingsProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(appState.voiceEnabled);
  const [showManager, setShowManager] = useState(false);
  const save = () => { onUpdateState({ voiceEnabled }); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
        <div className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#2a1740] p-4 text-amber-50 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6">
          <button type="button" onClick={onClose} aria-label="بستن تنظیمات" className="absolute left-3 top-3 rounded-full p-2 text-amber-100/70 hover:bg-white/10 sm:left-5 sm:top-5"><X className="h-5 w-5" /></button>
          <p className="pr-10 text-[10px] uppercase tracking-[0.18em] text-amber-300/60 sm:text-xs sm:tracking-[0.2em]">WizTalk Settings</p>
          <h2 className="mt-1 pr-10 text-xl font-bold text-amber-200 sm:text-2xl">تنظیمات گفت‌وگو</h2>
          <div className="mt-5 space-y-3 sm:mt-7 sm:space-y-5">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3 sm:p-4"><p className="text-sm text-amber-100">مسیر پاسخ‌گویی</p><p className="mt-1 text-xs leading-5 text-amber-50/50">انتخاب Character تعیین می‌کند از چه تنظیمات داخلی و مسیر مدل استفاده شود. Provider و Model از رابط کاربری قابل تغییر نیستند.</p></div>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 p-3 sm:p-4"><span className="min-w-0"><span className="block text-sm">خواندن پاسخ با صدا</span><span className="mt-1 block text-xs leading-5 text-amber-50/45">از تنظیمات Voice خود Character استفاده می‌شود.</span></span><input type="checkbox" checked={voiceEnabled} onChange={e => setVoiceEnabled(e.target.checked)} className="h-5 w-5 shrink-0" /></label>
            <button type="button" onClick={() => setShowManager(true)} className="w-full rounded-xl border border-amber-300/30 px-4 py-3 text-sm text-amber-200">مدیریت شخصیت‌ها ({characters.length})</button>
            <button type="button" onClick={save} className="w-full rounded-xl bg-amber-500 py-3 font-bold text-[#21102e]">ذخیره تنظیمات</button>
          </div>
        </div>
      </div>
      {showManager && <CharacterManager characters={characters} onChange={onCharactersChange} onClose={() => setShowManager(false)} />}
    </>
  );
}

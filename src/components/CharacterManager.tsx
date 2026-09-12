import React, { useState } from 'react';
import { Character } from '../types';
import { CharacterService, createCharacterDraft } from '../services/character';
import { CharacterForm } from './CharacterForm';
import { Copy, LockKeyhole, Pencil, Plus, Trash2, X } from 'lucide-react';

interface CharacterManagerProps { characters: Character[]; onChange: (characters: Character[]) => void; onClose: () => void; }

export function CharacterManager({ characters, onChange, onClose }: CharacterManagerProps) {
  const [editing, setEditing] = useState<Character | null>(null);
  const [creating, setCreating] = useState(false);
  const custom = characters.filter(CharacterService.isCustom);
  const save = (character: Character) => { const saved = character.identity.id ? CharacterService.update(character) : CharacterService.create(character); onChange(characters.some(item => item.identity.id === saved.identity.id) ? characters.map(item => item.identity.id === saved.identity.id ? saved : item) : [...characters, saved]); setEditing(null); setCreating(false); };
  const duplicate = (character: Character) => { const copy = CharacterService.duplicate(character); onChange([...characters, copy]); };
  const remove = (character: Character) => { if (!window.confirm('شخصیت «' + character.identity.displayName + '» حذف شود؟')) return; CharacterService.remove(character.identity.id); onChange(characters.filter(item => item.identity.id !== character.identity.id)); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#2a1740] p-4 text-amber-50 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/60 sm:text-xs sm:tracking-[0.2em]">Character System</p><h2 className="mt-1 text-xl font-bold text-amber-200 sm:text-2xl">مدیریت شخصیت‌ها</h2><p className="mt-2 text-xs leading-5 text-amber-50/60 sm:text-sm">شخصیت‌های اصلی از داده‌ی پروژه می‌آیند؛ شخصیت‌های جدید فقط در مرورگر شما ذخیره می‌شوند.</p></div>
          <button type="button" onClick={onClose} aria-label="بستن مدیریت شخصیت‌ها" className="shrink-0 rounded-full p-2 text-amber-100/60 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {(creating || editing) ? <CharacterForm initial={editing || createCharacterDraft()} onSave={save} onCancel={() => { setEditing(null); setCreating(false); }} /> : <>
          <div className="space-y-2.5 sm:space-y-3">
            {characters.map(character => <div key={character.identity.id} className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-black/10 p-2.5 sm:gap-3 sm:p-3"><img src={character.avatar.source} alt="" className="h-12 w-10 shrink-0 rounded-xl object-cover sm:h-14 sm:w-12" referrerPolicy="no-referrer" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-amber-100 sm:text-base">{character.identity.displayName}</p><p className="truncate text-[11px] text-amber-50/50 sm:text-xs">{CharacterService.isCustom(character) ? 'شخصیت سفارشی · قابل ویرایش' : 'شخصیت اصلی · فقط خواندنی'}</p></div>{CharacterService.isCustom(character) ? <div className="flex shrink-0 items-center gap-0.5 sm:gap-1"><button type="button" onClick={() => setEditing(character)} title="ویرایش" aria-label="ویرایش" className="rounded-lg p-1.5 text-amber-200/70 hover:bg-white/10 hover:text-amber-200 sm:p-2"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => duplicate(character)} title="کپی" aria-label="کپی" className="rounded-lg p-1.5 text-amber-200/70 hover:bg-white/10 hover:text-amber-200 sm:p-2"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => remove(character)} title="حذف" aria-label="حذف" className="rounded-lg p-1.5 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-300 sm:p-2"><Trash2 className="h-4 w-4" /></button></div> : <LockKeyhole className="mr-1 h-4 w-4 shrink-0 text-amber-100/30 sm:mr-2" />}</div>)}
          </div>
          {custom.length === 0 && <p className="mt-4 text-center text-sm text-amber-50/45">هنوز شخصیت سفارشی نساخته‌اید.</p>}
          <button type="button" onClick={() => setCreating(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-[#21102e] transition hover:bg-amber-400 sm:mt-6"><Plus className="h-5 w-5" /> افزودن شخصیت</button>
        </>}
      </div>
    </div>
  );
}

import React from 'react';
import { Character } from '../types';
import { LockKeyhole, Plus, Settings2, Sparkles } from 'lucide-react';

interface CharacterSelectorProps { characters: Character[]; onSelect: (character: Character) => void; onManage: () => void; }

export function CharacterSelector({ characters, onSelect, onManage }: CharacterSelectorProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#12091f] px-4 py-6 text-amber-50 sm:px-8 sm:py-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-50"><div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-violet-900/60 blur-3xl sm:h-96 sm:w-96" /><div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-amber-900/40 blur-3xl sm:h-96 sm:w-96" /><div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-sky-900/30 blur-3xl sm:h-72 sm:w-72" /></div>
      <div className="relative z-10 mx-auto mb-7 flex w-full max-w-6xl flex-col gap-5 sm:mb-10 sm:gap-6 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="mb-2 flex items-center gap-2 text-xs text-amber-300/70 sm:text-sm"><Sparkles className="h-4 w-4 shrink-0" /> WizTalk · گفت‌وگوی شخصیت‌محور</p><h1 className="font-serif text-3xl font-bold leading-tight text-amber-300 sm:text-5xl lg:text-6xl">هم‌صحبت جادویی</h1><p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/65 sm:text-base sm:leading-7 lg:text-lg">شخصیتت را انتخاب کن؛ هر کدام دنیای گفت‌وگو، لحن و حافظه‌ی خودش را دارد.</p></div><button type="button" onClick={onManage} className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-white/5 px-4 py-3 text-sm text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-400/10 md:w-auto"><Settings2 className="h-4 w-4" /> مدیریت شخصیت‌ها</button></div>
      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => {
          // Harry is the first fully operational character. Other built-ins
          // stay visible in the showcase but are intentionally read-only until
          // their independent chat stacks are upgraded.
          const operational = character.settings.source !== 'builtin' || character.identity.id === 'harry';
          return <button type="button" key={character.identity.id} onClick={() => operational && onSelect(character)} disabled={!operational} aria-disabled={!operational} className={`group min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] text-right shadow-xl backdrop-blur-md transition duration-300 ${operational ? 'hover:-translate-y-1 hover:border-amber-300/60 hover:bg-white/[0.1] hover:shadow-amber-900/30' : 'cursor-not-allowed opacity-70'}`}>
            <div className="relative h-56 overflow-hidden bg-[#241437] sm:h-64"><img src={character.avatar.source} alt={character.identity.displayName} className={`h-full w-full object-cover transition duration-500 ${operational ? 'group-hover:scale-105' : 'grayscale'}`} referrerPolicy="no-referrer" /><div className="absolute inset-0 bg-gradient-to-t from-[#1b0e2b] via-transparent to-transparent" /><span className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/40 px-3 py-1 text-xs text-amber-100 backdrop-blur-sm sm:bottom-4 sm:right-4">{character.identity.role}</span>{!operational && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-amber-100 backdrop-blur"><LockKeyhole className="h-3.5 w-3.5" /> به‌زودی</span>}</div>
            <div className="p-4 sm:p-5"><h2 className="truncate text-lg font-bold text-amber-200 sm:text-xl">{character.identity.displayName}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-amber-50/70 sm:mt-3">{character.identity.description}</p><span className={`mt-4 inline-flex items-center text-sm font-medium sm:mt-5 ${operational ? 'text-amber-300' : 'text-amber-50/40'}`}>{operational ? 'شروع گفت‌وگو ←' : 'در حال آماده‌سازی'}</span></div>
          </button>;
        })}
      </div>
      {characters.length === 0 && <div className="relative z-10 mx-auto rounded-2xl border border-amber-200/20 bg-white/5 p-6 text-center text-sm text-amber-100/70 sm:p-8">شخصیتی برای نمایش وجود ندارد.</div>}
      <button type="button" onClick={onManage} className="relative z-10 mx-auto mt-6 flex items-center gap-2 rounded-xl border border-dashed border-amber-200/30 px-5 py-3 text-sm text-amber-200/80 transition hover:border-amber-300 hover:text-amber-100 sm:mt-8"><Plus className="h-4 w-4" /> ساخت شخصیت جدید</button>
    </section>
  );
}

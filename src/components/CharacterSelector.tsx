import React from 'react';
import { Character } from '../types';
import { Plus, Settings2, Sparkles } from 'lucide-react';

interface CharacterSelectorProps { characters: Character[]; onSelect: (character: Character) => void; onManage: () => void; }

export function CharacterSelector({ characters, onSelect, onManage }: CharacterSelectorProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#12091f] px-5 py-12 text-amber-50 sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50"><div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-900/60 blur-3xl" /><div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-amber-900/40 blur-3xl" /><div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-900/30 blur-3xl" /></div>
      <div className="relative z-10 mb-10 flex w-full max-w-6xl items-center justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm text-amber-300/70"><Sparkles className="h-4 w-4" /> WizTalk · گفت‌وگوی شخصیت‌محور</p><h1 className="font-serif text-4xl font-bold text-amber-300 sm:text-6xl">هم‌صحبت جادویی</h1><p className="mt-3 max-w-xl text-base text-amber-50/65 sm:text-lg">شخصیتت را انتخاب کن؛ هر کدام دنیای گفت‌وگو، لحن و حافظه‌ی خودش را دارد.</p></div><button type="button" onClick={onManage} className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-200/20 bg-white/5 px-4 py-3 text-sm text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-400/10"><Settings2 className="h-4 w-4" /> مدیریت شخصیت‌ها</button></div>
      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">{characters.map((character) => <button type="button" key={character.id} onClick={() => onSelect(character)} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] text-right shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-amber-300/60 hover:bg-white/[0.1] hover:shadow-amber-900/30"><div className="relative h-64 overflow-hidden bg-[#241437]"><img src={character.avatar.source} alt={character.displayName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" referrerPolicy="no-referrer" /><div className="absolute inset-0 bg-gradient-to-t from-[#1b0e2b] via-transparent to-transparent" /><span className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-xs text-amber-100 backdrop-blur-sm">{character.role}</span></div><div className="p-5"><h2 className="text-xl font-bold text-amber-200">{character.displayName}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-amber-50/70">{character.description}</p><span className="mt-5 inline-flex items-center text-sm font-medium text-amber-300">شروع گفت‌وگو ←</span></div></button>)}</div>
      {characters.length === 0 && <div className="relative z-10 rounded-2xl border border-amber-200/20 bg-white/5 p-8 text-center text-amber-100/70">شخصیتی برای نمایش وجود ندارد.</div>}
      <button type="button" onClick={onManage} className="relative z-10 mt-8 flex items-center gap-2 rounded-xl border border-dashed border-amber-200/30 px-5 py-3 text-sm text-amber-200/80 transition hover:border-amber-300 hover:text-amber-100"><Plus className="h-4 w-4" /> ساخت شخصیت جدید</button>
    </section>
  );
}

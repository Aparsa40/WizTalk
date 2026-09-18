import React, { useEffect, useState } from 'react';
import { Download, History, Plus, Trash2, X } from 'lucide-react';
import { ApiService, ChatSession } from '../services/api';

interface ChatSessionsPanelProps {
  characterId: string;
  activeSessionId: string;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export function ChatSessionsPanel({ characterId, activeSessionId, onSelect, onNew, onClose }: ChatSessionsPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try { setSessions(await ApiService.listSessions(characterId)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'جلسه‌ها بارگذاری نشدند.'); }
  };

  useEffect(() => { void load(); }, [characterId]);

  const remove = async (id: string) => {
    if (!window.confirm('این جلسه حذف شود؟ این کار قابل بازگشت نیست.')) return;
    try { await ApiService.deleteSession(id); await load(); if (id === activeSessionId) onNew(); }
    catch (e) { setError(e instanceof Error ? e.message : 'حذف جلسه ناموفق بود.'); }
  };

  return <aside dir="rtl" className="fixed inset-y-0 right-0 z-50 flex w-[min(92vw,25rem)] flex-col border-l border-white/10 bg-[#1a1027]/95 p-4 text-amber-50 shadow-2xl backdrop-blur-xl sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-amber-200"><History className="h-5 w-5"/><h2 className="font-bold">جلسه‌های گفتگو</h2></div><p className="mt-1 text-xs text-amber-50/45">هر بار ورود به شخصیت، یک Session جدید ساخته می‌شود.</p></div><button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5"/></button></div>
    <button type="button" onClick={onNew} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-[#21102e]"><Plus className="h-5 w-5"/>گفتگوی جدید</button>
    {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-100">{error}</p>}
    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      {sessions.map((session) => <div key={session.id} className={`rounded-2xl border p-3 ${session.id===activeSessionId?'border-amber-300/50 bg-amber-300/10':'border-white/10 bg-black/10'}`}>
        <button type="button" onClick={()=>onSelect(session.id)} className="w-full text-right"><p className="truncate text-sm font-semibold">{session.title}</p><p className="mt-1 text-[11px] text-amber-50/45">{new Date(session.updatedAt).toLocaleString('fa-IR')}</p></button>
        <div className="mt-2 flex gap-2"><a href={ApiService.downloadSessionUrl(session.id)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-amber-100/70 hover:bg-white/5"><Download className="h-3.5 w-3.5"/>دانلود</a><button type="button" onClick={()=>void remove(session.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300/10 px-2 py-1 text-xs text-red-200/70 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5"/>حذف</button></div>
      </div>)}
      {!sessions.length && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-amber-50/45">هنوز جلسه‌ای ثبت نشده.</div>}
    </div>
  </aside>;
}

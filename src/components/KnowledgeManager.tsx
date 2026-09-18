import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { ApiService, KnowledgeDocument } from '../services/api';

interface KnowledgeManagerProps { characterId: string; }

export function KnowledgeManager({ characterId }: KnowledgeManagerProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try { setDocuments(await ApiService.listKnowledge(characterId)); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'دانش بارگذاری نشد.'); }
  };
  useEffect(() => { void load(); }, [characterId]);

  const add = async () => {
    if (!content.trim()) return;
    setBusy(true); setMessage('');
    try { await ApiService.addKnowledge(characterId, title, content); setTitle(''); setContent(''); setMessage('سند دانش ذخیره شد.'); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'ذخیره دانش ناموفق بود.'); }
    finally { setBusy(false); }
  };

  const importText = async (file: File) => {
    const text = await file.text();
    setTitle(file.name);
    setContent(text);
  };

  const remove = async (id: string) => {
    try { await ApiService.deleteKnowledge(characterId, id); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'حذف سند ناموفق بود.'); }
  };

  return <section dir="rtl" className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
    <div className="flex items-start gap-2"><FileText className="mt-0.5 h-5 w-5 text-amber-300"/><div><h3 className="font-semibold text-amber-200">دانش محلی Character</h3><p className="mt-1 text-xs leading-5 text-amber-50/50">این اسناد داخل SQLite ذخیره می‌شوند و فقط در پاسخ‌های محلی همین Character استفاده می‌شوند.</p></div></div>
    <label className="block text-sm">عنوان<input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="مثلاً Harry - Biography" className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 outline-none focus:border-amber-300/40"/></label>
    <label className="block text-sm">متن خام<textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={6} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 text-sm leading-6 outline-none focus:border-amber-300/40"/></label>
    <div className="flex flex-col gap-2 sm:flex-row"><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"><Upload className="h-4 w-4"/>خواندن TXT/MD<input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" onChange={(e)=>{const file=e.target.files?.[0];if(file)void importText(file);}}/></label><button type="button" disabled={busy || !content.trim()} onClick={()=>void add()} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-[#21102e] disabled:opacity-50">{busy?'در حال ذخیره…':'ذخیره در SQLite'}</button></div>
    {message && <p className="rounded-xl bg-white/5 p-3 text-xs text-amber-100/70">{message}</p>}
    <div className="space-y-2">{documents.map((doc)=><div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#130d1d] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{doc.title}</p><p className="mt-1 truncate text-xs text-amber-50/40">{doc.content.slice(0,120)}</p></div><button type="button" onClick={()=>void remove(doc.id)} className="shrink-0 rounded-lg p-2 text-red-200/70 hover:bg-red-500/10"><Trash2 className="h-4 w-4"/></button></div>)}</div>
  </section>;
}

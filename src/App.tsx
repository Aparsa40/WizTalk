import React, { useEffect, useState } from 'react';
import { AppState, Character } from './types';
import { CharacterService } from './services/character';
import { MemoryService } from './services/memory';
import { CharacterSelector } from './components/CharacterSelector';
import { ChatUI } from './components/ChatUI';
import { Settings } from './components/Settings';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]); const [appState, setAppState] = useState<AppState>(() => MemoryService.getAppState()); const [showSettings, setShowSettings] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const loadCharacters = async () => { setLoading(true); setError(''); try { setCharacters(await CharacterService.list()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'بارگذاری شخصیت‌ها ناموفق بود.'); } finally { setLoading(false); } };
  useEffect(() => { void loadCharacters(); }, []);
  const updateAppState = (updates: Partial<AppState>) => { const next = { ...appState, ...updates }; setAppState(next); MemoryService.saveAppState(next); };
  const selected = characters.find((character) => character.id === appState.selectedCharacterId);
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#12091f] text-amber-300"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" /><p>در حال آماده‌سازی دنیای جادو...</p></div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-[#12091f] p-6 text-amber-50"><div className="max-w-md rounded-3xl border border-rose-300/20 bg-rose-500/10 p-8 text-center"><h1 className="text-xl font-bold text-rose-200">بارگذاری ناموفق بود</h1><p className="mt-3 text-sm text-amber-50/70">{error}</p><button type="button" onClick={() => void loadCharacters()} className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-bold text-[#21102e]">تلاش دوباره</button></div></div>;
  return <div dir="rtl" className="font-sans">{selected ? <ChatUI character={selected} appState={appState} onBack={() => updateAppState({ selectedCharacterId: null })} onOpenSettings={() => setShowSettings(true)} /> : <CharacterSelector characters={characters} onSelect={(character) => updateAppState({ selectedCharacterId: character.id, provider: CharacterService.defaultProvider(character), model: character.ai.model })} onManage={() => setShowSettings(true)} />}{showSettings && <Settings appState={appState} characters={characters} onCharactersChange={setCharacters} onUpdateState={updateAppState} onClose={() => setShowSettings(false)} />}</div>;
}

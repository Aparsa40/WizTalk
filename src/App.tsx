import React, { useEffect, useState } from 'react';
import { AppState, Character } from './types';
import { CharacterService } from './services/character';
import { MemoryService } from './services/memory';
import { CharacterSelector } from './components/CharacterSelector';
import { ChatUI } from './components/ChatUI';
import { CharacterSettings } from './components/CharacterSettings';
import { Settings } from './components/Settings';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [appState, setAppState] = useState<AppState>(() => MemoryService.getAppState());
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterSettings, setShowCharacterSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCharacters(await CharacterService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'بارگذاری شخصیت‌ها ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = (updates: Partial<AppState>) => {
    const next = { ...appState, ...updates };
    setAppState(next);
    MemoryService.saveAppState(next);
  };

  const saveCharacterSettings = (updated: Character) => {
    const saved = CharacterService.saveUserSettings(updated);
    setCharacters((current) =>
      current.map((item) =>
        item.identity.id === saved.identity.id ? saved : item,
      ),
    );
  };

  const selected = characters.find(
    (character) => character.identity.id === appState.selectedCharacterId,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12091f] text-amber-300">
        در حال آماده‌سازی دنیای جادو...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12091f] p-6 text-amber-50">
        <div className="text-center">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="mt-4 rounded-xl bg-amber-500 px-5 py-3 font-bold text-[#21102e]">
            تلاش دوباره
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="font-sans">
      {selected ? (
        <ChatUI
          character={selected}
          onBack={() => update({ selectedCharacterId: null })}
          onOpenSettings={() => setShowCharacterSettings(true)}
        />
      ) : (
        <CharacterSelector
          characters={characters}
          onSelect={(character) => update({ selectedCharacterId: character.identity.id })}
          onManage={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <Settings
          appState={appState}
          characters={characters}
          onCharactersChange={setCharacters}
          onUpdateState={update}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCharacterSettings && selected && (
        <CharacterSettings
          character={selected}
          onSave={saveCharacterSettings}
          onClose={() => setShowCharacterSettings(false)}
        />
      )}
    </div>
  );
}

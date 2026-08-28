/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Character, AppState } from './types';
import { ApiService } from './services/api';
import { MemoryService } from './services/memory';
import { CharacterSelector } from './components/CharacterSelector';
import { ChatUI } from './components/ChatUI';
import { Settings } from './components/Settings';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [appState, setAppState] = useState<AppState>(MemoryService.getAppState());
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getCharacters()
      .then(data => {
        setCharacters(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load characters:', err);
        setLoading(false);
      });
  }, []);

  const updateAppState = (updates: Partial<AppState>) => {
    const newState = { ...appState, ...updates };
    setAppState(newState);
    MemoryService.saveAppState(newState);
  };

  const handleSelectCharacter = (character: Character) => {
    updateAppState({ selectedCharacterId: character.id });
  };

  const handleBack = () => {
    updateAppState({ selectedCharacterId: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0f2e] flex flex-col items-center justify-center text-amber-400">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-serif text-xl animate-pulse">در حال ورود به دنیای جادو...</p>
      </div>
    );
  }

  const selectedCharacter = characters.find(c => c.id === appState.selectedCharacterId);

  return (
    <div dir="rtl" className="font-sans">
      {!selectedCharacter ? (
        <div className="relative">
          <button 
            onClick={() => setShowSettings(true)}
            className="absolute top-4 left-4 z-50 p-2 text-amber-50/70 hover:text-amber-400 bg-black/20 rounded-full backdrop-blur-sm transition-colors"
          >
            تنظیمات
          </button>
          <CharacterSelector characters={characters} onSelect={handleSelectCharacter} />
        </div>
      ) : (
        <ChatUI 
          character={selectedCharacter} 
          appState={appState} 
          onBack={handleBack}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <Settings 
          appState={appState} 
          onUpdateState={updateAppState} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

import React from 'react';
import { Character } from '../types';

interface CharacterSelectorProps {
  characters: Character[];
  onSelect: (character: Character) => void;
}

export function CharacterSelector({ characters, onSelect }: CharacterSelectorProps) {
  return (
    <div className="min-h-screen bg-[#1a0f2e] text-amber-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Magical background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-amber-900 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif text-amber-400 drop-shadow-md">WizTalk</h1>
        <p className="text-xl opacity-80">هم‌صحبت جادویی خودت رو انتخاب کن</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-10 w-full max-w-5xl">
        {characters.map(char => (
          <div 
            key={char.id}
            onClick={() => onSelect(char)}
            className="bg-[#2a1b42]/80 backdrop-blur-md border-2 border-[#4a3b62] hover:border-amber-400/60 rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] flex flex-col items-center text-center group"
          >
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#3a2b52] group-hover:border-amber-400/50 mb-4 transition-colors duration-300">
              <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-amber-200 mb-2">{char.displayName}</h2>
            <p className="text-sm text-amber-100/70 mb-4">{char.role}</p>
            <p className="text-sm opacity-90 leading-relaxed">{char.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

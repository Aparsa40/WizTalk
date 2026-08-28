import React from 'react';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface AvatarProps {
  imageUrl: string;
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ imageUrl, state, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const stateClasses = {
    idle: 'border-transparent shadow-md',
    listening: 'border-blue-400 shadow-blue-400/50 shadow-lg animate-pulse',
    thinking: 'border-purple-400 shadow-purple-400/50 shadow-lg animate-spin-slow',
    speaking: 'border-amber-400 shadow-amber-400/50 shadow-xl scale-105 transition-transform duration-200',
    error: 'border-red-500 shadow-red-500/50 shadow-md',
  };

  return (
    <div className="relative inline-block">
      <div 
        className={`rounded-full overflow-hidden border-4 bg-gray-800 ${sizeClasses[size]} ${stateClasses[state]}`}
        style={{ transition: 'all 0.3s ease' }}
      >
        <img 
          src={imageUrl} 
          alt="Character Avatar" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {state === 'thinking' && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
          ...
        </div>
      )}
      {state === 'listening' && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          🎤
        </div>
      )}
    </div>
  );
}

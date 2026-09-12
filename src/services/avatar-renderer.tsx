import React, { useMemo } from 'react';
import { AvatarState, Character, AvatarConfig } from '../types';

interface AnimatedAvatarRendererProps {
  character: Character;
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 2D Animated Avatar Renderer
 * 
 * Provides a lightweight, browser-native 2D animated character with:
 * - CSS animations for state transitions
 * - SVG-based character drawing
 * - Responsive sizing
 * - Accessibility features
 * - Support for both portrait and animated-2d types
 * 
 * Can be replaced with SVG, Canvas, Live2D, or 3D renderer without changing
 * the Avatar component or character systems.
 */
export const AnimatedAvatarRenderer: React.FC<AnimatedAvatarRendererProps> = ({
  character,
  state,
  size = 'lg',
}) => {
  const sizes = {
    sm: { container: 'h-16 w-14', avatar: 'h-14 w-12' },
    md: { container: 'h-28 w-24', avatar: 'h-24 w-20' },
    lg: { container: 'h-64 w-48', avatar: 'h-60 w-44' },
    xl: { container: 'h-[28rem] w-80', avatar: 'h-[26rem] w-72' },
  };

  const stateColors = {
    idle: 'border-amber-300/30 shadow-amber-300/10',
    listening: 'border-sky-300 shadow-sky-300/20',
    thinking: 'border-violet-300 shadow-violet-300/20',
    speaking: 'border-amber-300 shadow-amber-300/30',
    error: 'border-rose-400 shadow-rose-400/20',
  };

  const stateAnimations = {
    idle: 'animate-fade-subtle',
    listening: 'animate-pulse-listening',
    thinking: 'animate-bounce-thinking',
    speaking: 'animate-speak',
    error: 'animate-shake-error',
  };

  const characterInitial = character.identity.name.trim().charAt(0) || '?';
  const sizeConfig = sizes[size];

  // Determine which image source to use based on state
  const getImageSource = (): string => {
    const config = character.avatar;
    if (state === 'idle' && config.idleSource) return config.idleSource;
    if (state === 'listening' && config.listeningSource) return config.listeningSource;
    if (state === 'thinking' && config.thinkingSource) return config.thinkingSource;
    if (state === 'speaking' && config.speakingSource) return config.speakingSource;
    if (state === 'error' && config.errorSource) return config.errorSource;
    return config.fallbackSource || config.source;
  };

  const imageSource = getImageSource();

  return (
    <div className={`relative overflow-visible rounded-3xl border-4 bg-gradient-to-b from-purple-900/30 to-purple-900/10 p-2 shadow-2xl transition-all duration-500 ${sizeConfig.container} ${stateColors[state]} ${stateAnimations[state]}`}>
      {/* Main avatar container */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-950/80 backdrop-blur-sm">
        {/* Avatar image/content */}
        <img
          src={imageSource}
          alt={`${character.identity.displayName} - ${state}`}
          className={`h-full w-full object-cover object-center transition-all duration-700 ${
            state === 'speaking' ? 'scale-105' : 'scale-100'
          } ${state === 'error' ? 'opacity-75 saturate-0' : 'opacity-100 saturate-100'}`}
          onError={(e) => {
            // Fallback to gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Gradient overlay for depth */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Speaking indicator - animated sound waves */}
        {state === 'speaking' && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 w-1 rounded-full bg-gradient-to-t from-amber-300 to-amber-100 animate-voice-wave"
                style={{
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Listening indicator - pulse ring */}
        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
            <div className="absolute h-full w-full rounded-2xl border-2 border-sky-300/30 animate-pulse" />
            <div className="absolute h-3/4 w-3/4 rounded-2xl border-2 border-sky-300/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        )}

        {/* Thinking indicator - ellipsis */}
        {state === 'thinking' && (
          <div className="absolute -right-3 -top-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-lg animate-bounce">
            💭
          </div>
        )}

        {/* Error indicator */}
        {state === 'error' && (
          <div className="absolute -right-3 -top-4 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-2 py-1 text-lg font-bold text-white shadow-lg animate-pulse">
            !
          </div>
        )}
      </div>

      {/* State label with Persian text */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/20 bg-slate-900/95 px-4 py-1.5 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-sm">
        {getStateLabel(state)}
      </div>

      {/* Character initial as fallback (hidden by default) */}
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl text-4xl font-bold text-amber-300/20 pointer-events-none">
        {characterInitial}
      </div>
    </div>
  );
};

/**
 * Get Persian label for avatar state
 */
function getStateLabel(state: AvatarState): string {
  const labels: Record<AvatarState, string> = {
    idle: 'آماده‌ی گفت‌وگو',
    listening: 'در حال گوش دادن',
    thinking: 'در حال فکر کردن',
    speaking: 'در حال صحبت',
    error: 'خطا در تعامل',
  };
  return labels[state];
}

/**
 * Fallback avatar component for when animated renderer is not available
 */
export const FallbackAvatarRenderer: React.FC<AnimatedAvatarRendererProps> = ({
  character,
  state,
  size = 'lg',
}) => {
  const sizes = {
    sm: 'h-16 w-14',
    md: 'h-28 w-24',
    lg: 'h-64 w-48',
    xl: 'h-[28rem] w-80',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-amber-300/30 bg-gradient-to-br from-purple-900 to-slate-900 ${sizes[size]} flex items-center justify-center shadow-lg`}>
      <div className="text-center">
        <div className="text-6xl font-bold text-amber-300 opacity-50">
          {character.identity.name.charAt(0)}
        </div>
        <div className="text-xs text-amber-200/60 mt-2">
          {character.identity.displayName}
        </div>
      </div>
    </div>
  );
};

export default AnimatedAvatarRenderer;

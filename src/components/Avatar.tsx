import React, { useState } from 'react';
import { AvatarState, Character } from '../types';
import { avatarStateLabels } from '../services/avatar';

interface AvatarProps { character: Character; state: AvatarState; size?: 'sm' | 'md' | 'lg' | 'xl'; }

export function Avatar({ character, state, size = 'lg' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizes = { sm: 'h-16 w-14', md: 'h-28 w-24', lg: 'h-64 w-48', xl: 'h-[28rem] w-80' };
  const stateColors = { idle: 'border-amber-300/30', listening: 'border-sky-300', thinking: 'border-violet-300', speaking: 'border-amber-300', error: 'border-rose-400' };
  const source = character.avatar?.source || '';
  const initial = character.name.trim().charAt(0) || '?';

  return (
    <div className={['relative overflow-visible rounded-[2rem] border-4 bg-gradient-to-b from-[#5c416d] to-[#21142f] p-2 shadow-2xl transition-all duration-500', sizes[size], stateColors[state], state === 'speaking' ? 'scale-[1.03] shadow-amber-300/30' : '', state === 'thinking' ? 'shadow-violet-400/30' : '', state === 'listening' ? 'shadow-sky-300/30' : ''].join(' ')} data-avatar-state={state}>
      <div className="relative h-full w-full overflow-hidden rounded-[1.45rem] bg-[#160d24]">
        {!imageFailed && source ? <img src={source} alt={'تصویر ' + character.displayName} className="h-full w-full object-cover object-center transition-transform duration-700 data-[state=speaking]:scale-105" onError={() => setImageFailed(true)} referrerPolicy="no-referrer" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-600/30 via-purple-900 to-slate-950"><span className="font-serif text-8xl font-bold text-amber-200/80">{initial}</span></div>}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        {state === 'speaking' && <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm"><i className="h-3 w-1 animate-pulse rounded-full bg-amber-300" /><i className="h-6 w-1 animate-pulse rounded-full bg-amber-300 [animation-delay:120ms]" /><i className="h-4 w-1 animate-pulse rounded-full bg-amber-300 [animation-delay:240ms]" /><i className="h-7 w-1 animate-pulse rounded-full bg-amber-300 [animation-delay:360ms]" /></div>}
      </div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/20 bg-[#21142f]/95 px-4 py-1.5 text-xs text-amber-100 shadow-lg">{avatarStateLabels[state]}</div>
      {state === 'listening' && <div className="absolute -inset-3 -z-10 animate-ping rounded-[2.5rem] border border-sky-300/30" />}
      {state === 'thinking' && <div className="absolute -right-3 -top-4 rounded-full bg-violet-500 px-3 py-1 text-xs text-white shadow-lg">...</div>}
      {state === 'error' && <div className="absolute -right-3 -top-4 rounded-full bg-rose-500 px-3 py-1 text-xs text-white shadow-lg">!</div>}
    </div>
  );
}

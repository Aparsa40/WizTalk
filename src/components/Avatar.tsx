import React, { useEffect, useState } from 'react';
import { AvatarState, Character } from '../types';
import { getAvatarMotionClass } from '../services/avatar-motion';

interface AvatarProps {
  character: Character;
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mouthShape?: string;
  animationController?: unknown;
}

const sizes = {
  sm: 'h-44 w-36',
  md: 'h-64 w-52',
  lg: 'h-[28rem] w-72',
  xl: 'h-[min(48vh,34rem)] w-full max-w-[28rem] min-h-[17rem]',
};

const stateLabel: Record<AvatarState, string> = {
  idle: 'آماده',
  listening: 'گوش می‌دهد',
  thinking: 'در حال فکر',
  speaking: 'در حال صحبت',
  error: 'آماده',
};

function AnimatedWizardAvatar({ speaking, smiling, variant }: { speaking: boolean; smiling: boolean; variant: string }) {
  const illustrated = variant === 'illustrated-hall';

  return (
    <svg className="avatar-face h-full w-full drop-shadow-2xl" viewBox="0 0 600 760" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="wizard-bg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={illustrated ? '#38556d' : '#2d1a48'} />
          <stop offset="1" stopColor={illustrated ? '#080c13' : '#0b0a11'} />
        </linearGradient>
      </defs>
      <rect width="600" height="760" rx="48" fill="url(#wizard-bg)" />
      <circle cx="300" cy="285" r="150" fill="#dca27b" />
      <path d="M150 245 Q160 105 300 90 Q440 105 450 250 L405 205 Q360 155 300 170 Q230 150 180 225Z" fill="#17151b" />
      <g className="avatar-blink" fill="none" stroke="#1b1b22" strokeWidth="12">
        <rect x="157" y="250" width="125" height="64" rx="30" />
        <rect x="318" y="250" width="125" height="64" rx="30" />
        <path d="M282 278h36" />
      </g>
      <circle cx="222" cy="282" r="9" fill="#101015" />
      <circle cx="378" cy="282" r="9" fill="#101015" />
      <path d="M286 176 l-13 28 18 14 -16 24" fill="none" stroke="#7b2d35" strokeWidth="7" strokeLinecap="round" />
      <path
        className="avatar-mouth"
        d={smiling ? 'M286 326 Q300 344 314 326' : 'M286 326 Q300 340 314 326'}
        fill={speaking ? '#7f3038' : 'none'}
        stroke="#6e3e35"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {speaking && <ellipse cx="300" cy="334" rx="12" ry="5" fill="#f0a1a1" className="animate-pulse" />}
      <path d="M125 700 Q145 500 300 470 Q455 500 475 700Z" fill={illustrated ? '#222b45' : '#1c273b'} />
      <path d="M160 700 Q190 535 300 515 Q410 535 440 700" fill="none" stroke={illustrated ? '#8ab6d9' : '#caa85a'} strokeWidth="12" />
    </svg>
  );
}

export function Avatar({ character, state, size = 'lg' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const [smiling, setSmiling] = useState(false);
  const isAnimated2D = character.avatar.type === 'animated-2d';
  const source = character.avatar.source;
  const variant = character.avatar.presetId ?? 'classic-bedroom';
  const motionClass = getAvatarMotionClass(state);

  useEffect(() => setFailed(false), [character.identity.id, source]);

  useEffect(() => {
    if (!isAnimated2D) return;

    const smileTimer = window.setInterval(() => {
      setSmiling(true);
      window.setTimeout(() => setSmiling(false), 900);
    }, 8500);

    return () => window.clearInterval(smileTimer);
  }, [isAnimated2D]);

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-amber-200/25 bg-black/25 shadow-2xl ${sizes[size]}`}
      data-character-id={character.identity.id}
      data-avatar-state={state}
      role="img"
      aria-label={`آواتار ${character.identity.displayName}`}
    >
      <div className={`h-full w-full ${motionClass}`} data-avatar-motion={motionClass}>
        {isAnimated2D ? (
          <AnimatedWizardAvatar speaking={state === 'speaking'} smiling={smiling} variant={variant} />
        ) : source && !failed ? (
          <img
            src={source}
            alt={character.identity.displayName}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-amber-100/60">
            <div>
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/30 text-4xl">
                {character.identity.displayName.charAt(0)}
              </div>
              <p>{character.identity.displayName}</p>
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-amber-100 backdrop-blur">
        {stateLabel[state]}
      </div>
    </div>
  );
}

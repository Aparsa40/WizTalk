import React, { useEffect, useRef, useState } from 'react';
import { AvatarState, Character } from '../types';
import type { AvatarAnimationController } from '../services/avatar-animation';
import type { MouthShape } from '../services/avatar-animation';
import { Avatar2DAnimationAdapter } from '../services/avatar-animation-adapter';
import { getAvatarMotionClass } from '../services/avatar-motion';
import { VRMAvatar } from './VRMAvatar';

interface AvatarProps {
  character: Character;
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mouthShape?: string;
  animationController?: AvatarAnimationController;
}

const sizes = {
  sm: 'h-44 w-36',
  md: 'h-64 w-52',
  lg: 'h-[28rem] w-72',
  xl: 'h-[clamp(15rem,48vh,34rem)] w-[clamp(12rem,68vw,28rem)] max-w-full',
};

const stateLabel: Record<AvatarState, string> = {
  idle: 'آماده',
  listening: 'گوش می‌دهد',
  thinking: 'در حال فکر',
  speaking: 'در حال صحبت',
  error: 'آماده',
};

const mouthPaths: Record<MouthShape, string> = {
  closed: 'M286 326 Q300 340 314 326',
  'open-small': 'M284 324 Q300 344 316 324',
  'open-medium': 'M282 322 Q300 352 318 322',
  'open-large': 'M278 318 Q300 360 322 318',
  smile: 'M282 322 Q300 350 318 322',
  pursed: 'M289 326 Q300 342 311 326',
};

function AnimatedWizardAvatar({ speaking, smiling, variant, mouthShape }: { speaking: boolean; smiling: boolean; variant: string; mouthShape: MouthShape }) {
  const illustrated = variant === 'illustrated-hall';
  const resolvedMouthShape = smiling ? 'smile' : mouthShape;

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
      <path d="M142 252 Q128 190 158 132 Q185 86 236 102 Q270 72 310 98 Q355 70 382 108 Q438 95 456 154 Q474 207 454 266 L420 224 Q402 192 366 178 L390 138 Q350 166 322 132 Q294 171 262 132 Q235 170 198 154 Q206 198 177 229Z" fill="#111116" />
      <path d="M166 178 Q142 145 171 120 M208 148 Q194 112 224 94 M254 132 Q244 90 278 82 M302 132 Q308 88 338 91 M350 140 Q366 96 397 111 M396 170 Q426 137 444 168" fill="none" stroke="#25232b" strokeWidth="14" strokeLinecap="round" />
      <g className="avatar-blink" fill="none" stroke="#1b1b22" strokeWidth="12">
        <rect x="157" y="250" width="125" height="64" rx="30" />
        <rect x="318" y="250" width="125" height="64" rx="30" />
        <path d="M282 278h36" />
      </g>
      <circle cx="222" cy="282" r="9" fill="#101015" />
      <circle cx="378" cy="282" r="9" fill="#101015" />
      <g fill="none" stroke="#15151a" strokeWidth="7" opacity="0.98">
        <circle cx="219" cy="282" r="79" />
        <circle cx="381" cy="282" r="79" />
        <path d="M298 282h4" />
        <path d="M140 280 Q128 275 119 284" />
        <path d="M460 280 Q472 275 481 284" />
      </g>
      <path d="M286 176 l-13 28 18 14 -16 24" fill="none" stroke="#7b2d35" strokeWidth="7" strokeLinecap="round" />
      <path
        className={`avatar-mouth mouth-${resolvedMouthShape}`}
        d={mouthPaths[resolvedMouthShape]}
        fill={resolvedMouthShape === 'closed' ? 'none' : '#7f3038'}
        stroke="#6e3e35"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {speaking && resolvedMouthShape !== 'closed' && <ellipse cx="300" cy="338" rx="12" ry="5" fill="#f0a1a1" className="animate-pulse" />}
      <path d="M125 700 Q145 500 300 470 Q455 500 475 700Z" fill={illustrated ? '#222b45' : '#1c273b'} />
      <path d="M160 700 Q190 535 300 515 Q410 535 440 700" fill="none" stroke={illustrated ? '#8ab6d9' : '#caa85a'} strokeWidth="12" />
    </svg>
  );
}

export function Avatar({ character, state, size = 'lg', animationController }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const [smiling, setSmiling] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>('closed');
  const hasSpokenRef = useRef(false);
  const isAnimated2D = character.avatar.type === 'animated-2d';
  const isVrm = character.avatar.type === 'vrm';
  const source = character.avatar.source;
  const motionClass = getAvatarMotionClass(state);

  useEffect(() => setFailed(false), [character.identity.id, source]);

  useEffect(() => {
    if (!isAnimated2D || !animationController) {
      setMouthShape('closed');
      return undefined;
    }

    const adapter = new Avatar2DAnimationAdapter();
    const detach = animationController.attachAdapter(adapter);
    const sync = () => setMouthShape(adapter.getLipSync().mouthShape);
    const unsubscribe = animationController.subscribe((command) => {
      if (command.type === 'lip-sync' || command.type === 'reset') sync();
    });
    sync();

    return () => {
      unsubscribe();
      detach();
    };
  }, [isAnimated2D, animationController]);

  useEffect(() => {
    if (!isAnimated2D) return;
    if (state === 'speaking' && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      setSmiling(true);
      const timer = window.setTimeout(() => setSmiling(false), 1200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isAnimated2D, state]);

  useEffect(() => {
    hasSpokenRef.current = false;
    setSmiling(false);
  }, [character.identity.id, source]);

  return (
    <div
      className={`relative overflow-hidden rounded-4xl border border-amber-200/25 bg-black/25 shadow-2xl ${sizes[size]}`}
      data-character-id={character.identity.id}
      data-avatar-state={state}
      data-avatar-type={character.avatar.type}
      role="img"
      aria-label={`آواتار ${character.identity.displayName}`}
    >
      <div className={`avatar-entry ${isVrm ? 'avatar-entry--vrm' : ''} h-full w-full`}>
        <div className={`h-full w-full ${motionClass}`} data-avatar-motion={motionClass}>
          {isVrm ? (
            <VRMAvatar
              source={source}
              fallbackSource={character.avatar.fallbackSource ?? character.avatar.thumbnail}
              alt={character.identity.displayName}
              state={state}
              animationController={animationController}
            />
          ) : isAnimated2D ? (
            <AnimatedWizardAvatar
              speaking={state === 'speaking'}
              smiling={smiling}
              variant={character.avatar.presetId ?? 'classic-bedroom'}
              mouthShape={mouthShape}
            />
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
      </div>
      <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-amber-100 backdrop-blur">
        {stateLabel[state]}
      </div>
    </div>
  );
}

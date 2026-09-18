import React, { useEffect, useRef, useState } from 'react';
import { AvatarState, Character } from '../types';
import type { AvatarAnimationController, MouthShape } from '../services/avatar-animation';
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
  xl: 'h-[min(68vh,48rem)] w-[min(58vw,28rem)] max-h-[68vh] max-w-full min-w-0',
};

const stateLabel: Record<AvatarState, string> = {
  idle: 'آماده',
  listening: 'گوش می‌دهد',
  thinking: 'در حال فکر',
  speaking: 'در حال صحبت',
  error: 'آماده',
};

const mouthPaths: Record<MouthShape, string> = {
  closed: 'M43 70 Q50 73 57 70',
  'open-small': 'M42 70 Q50 76 58 70',
  'open-medium': 'M41 69 Q50 79 59 69',
  'open-large': 'M39 68 Q50 82 61 68',
  smile: 'M41 69 Q50 78 59 69',
  pursed: 'M45 70 Q50 75 55 70',
};

function AnimatedHarry2DAvatar({ state, mouthShape, smiling }: { state: AvatarState; mouthShape: MouthShape; smiling: boolean }) {
  const mouth = smiling ? 'smile' : mouthShape;
  const mouthPath = {
    closed: 'M278 344 Q300 350 322 344',
    'open-small': 'M274 343 Q300 357 326 343',
    'open-medium': 'M270 341 Q300 364 330 341',
    'open-large': 'M264 338 Q300 372 336 338',
    smile: 'M270 342 Q300 365 330 342',
    pursed: 'M282 344 Q300 354 318 344',
  }[mouth];

  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-transparent" data-avatar-state={state}>
      <svg className="h-full w-full select-none drop-shadow-2xl" viewBox="0 0 600 900" role="img" aria-label="آواتار دوبعدی هری پاتر">
        <defs>
          <linearGradient id="harry2d-coat" x1="0" x2="1"><stop offset="0" stopColor="#20293f"/><stop offset="1" stopColor="#0f1728"/></linearGradient>
          <linearGradient id="harry2d-skin"><stop stopColor="#f0bd98"/><stop offset="1" stopColor="#c98261"/></linearGradient>
        </defs>
        <ellipse cx="300" cy="850" rx="175" ry="24" fill="#000" opacity=".28"/>
        <path d="M112 850 Q120 620 205 555 Q300 520 395 555 Q480 620 488 850Z" fill="url(#harry2d-coat)"/>
        <path d="M210 575 L300 690 L390 575 L355 850 L245 850Z" fill="#26334e"/>
        <path d="M250 585 L300 680 L350 585 L330 850 L270 850Z" fill="#eeeae1"/>
        <path d="M260 600 L300 665 L340 600 L328 630 L300 655 L272 630Z" fill="#7f2331"/>
        <path d="M236 470 Q300 500 364 470" fill="none" stroke="#7e493d" strokeWidth="6" opacity=".55"/>
        <path d="M176 514 Q300 560 424 514 L400 590 Q300 625 200 590Z" fill="#6c1f2d"/>
        <ellipse cx="300" cy="350" rx="130" ry="148" fill="url(#harry2d-skin)"/>
        <path d="M170 350 Q158 190 224 130 Q302 62 380 126 Q444 182 430 350 Q392 278 348 245 Q300 212 242 250 Q205 278 170 350Z" fill="#12151d"/>
        <path d="M205 176 Q255 102 330 118 Q395 130 420 218 Q365 178 318 180 Q260 180 205 225Z" fill="#1b1d25"/>
        <path d="M220 245 Q250 225 280 244" fill="none" stroke="#2a2020" strokeWidth="10" strokeLinecap="round"/>
        <path d="M320 244 Q350 225 380 245" fill="none" stroke="#2a2020" strokeWidth="10" strokeLinecap="round"/>
        <g fill="none" stroke="#1a1b20" strokeWidth="10">
          <rect x="190" y="260" width="105" height="72" rx="30"/>
          <rect x="305" y="260" width="105" height="72" rx="30"/>
          <path d="M295 282 Q300 274 305 282"/>
          <path d="M190 282 Q162 276 154 264"/>
          <path d="M410 282 Q438 276 446 264"/>
        </g>
        <ellipse cx="242" cy="296" rx="8" ry="11" fill="#111">
          <animate attributeName="ry" values="11;11;1;11;11" keyTimes="0;.93;.96;.99;1" dur="4.6s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="358" cy="296" rx="8" ry="11" fill="#111">
          <animate attributeName="ry" values="11;11;1;11;11" keyTimes="0;.93;.96;.99;1" dur="4.6s" repeatCount="indefinite"/>
        </ellipse>
        <path d="M300 296 L286 352 Q298 362 312 352" fill="none" stroke="#9a5e4b" strokeWidth="7" strokeLinecap="round"/>
        <path d={mouthPath} fill={mouth === 'closed' ? 'none' : '#8f3f4a'} stroke="#6d3039" strokeWidth="7" strokeLinecap="round">
          <animate attributeName="d" values="M278 344 Q300 350 322 344;M274 343 Q300 357 326 343;M278 344 Q300 350 322 344" dur=".48s" repeatCount="indefinite"/>
        </path>
        <g fill="#e0a47b">
          <path d="M194 300 Q242 268 290 300 Q242 285 194 300Z"/>
          <path d="M306 300 Q358 268 406 300 Q358 285 306 300Z"/>
        </g>
        <path d="M175 700 Q185 620 230 585 M425 700 Q415 620 370 585" fill="none" stroke="#111827" strokeWidth="34" strokeLinecap="round"/>
        <path d="M236 735 Q300 760 364 735" fill="none" stroke="#0d1424" strokeWidth="18" strokeLinecap="round"/>
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] text-amber-50/80 backdrop-blur sm:bottom-3 sm:left-3 sm:text-xs">{stateLabel[state]}</div>
    </div>
  );
}
function StaticAvatar({ character }: { character: Character }) {
  const [failed, setFailed] = useState(false);
  const source = character.avatar.source;
  return source && !failed ? (
    <img src={source} alt={character.identity.displayName} className="h-full w-full object-contain drop-shadow-2xl" onError={() => setFailed(true)} />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-center text-amber-100/60"><div><div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/30 text-4xl">{character.identity.displayName.charAt(0)}</div><p>{character.identity.displayName}</p></div></div>
  );
}

export function Avatar({ character, state, size = 'lg', animationController }: AvatarProps) {
  const [smiling, setSmiling] = useState(false);
  const [mouthShape, setMouthShape] = useState<MouthShape>('closed');
  const hasSpokenRef = useRef(false);
  const isAnimated2D = character.avatar.type === 'animated-2d';
  const isVrm = character.avatar.type === 'vrm';
  const source = character.avatar.source;
  const motionClass = getAvatarMotionClass(state);

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
    return () => { unsubscribe(); detach(); };
  }, [isAnimated2D, animationController]);

  useEffect(() => {
    hasSpokenRef.current = false;
    setSmiling(false);
  }, [character.identity.id, source]);

  useEffect(() => {
    if (!isAnimated2D || state !== 'speaking' || hasSpokenRef.current) return undefined;
    hasSpokenRef.current = true;
    setSmiling(true);
    const timer = window.setTimeout(() => setSmiling(false), 1200);
    return () => window.clearTimeout(timer);
  }, [isAnimated2D, state]);

  return (
    <div className={`relative flex min-h-0 min-w-0 items-end justify-center overflow-hidden rounded-[2rem] border border-amber-200/20 bg-black/10 shadow-2xl ${sizes[size]}`} data-character-id={character.identity.id} data-avatar-state={state} data-avatar-type={character.avatar.type} role="img" aria-label={`آواتار ${character.identity.displayName}`}>
      <div className={`avatar-entry h-full w-full min-h-0 min-w-0 ${isVrm ? 'avatar-entry--vrm' : ''}`}>
        <div className={`h-full w-full min-h-0 min-w-0 ${motionClass}`} data-avatar-motion={motionClass}>
          {isVrm ? (
            <VRMAvatar source={source} fallbackSource={character.avatar.fallbackSource ?? character.avatar.thumbnail} alt={character.identity.displayName} state={state} animationController={animationController} />
          ) : isAnimated2D ? (
            <AnimatedHarry2DAvatar state={state} mouthShape={mouthShape} smiling={smiling} />
          ) : (
            <StaticAvatar character={character} />
          )}
        </div>
      </div>
    </div>
  );
}

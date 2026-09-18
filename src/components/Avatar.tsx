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

function ImageBasedHarryAvatar({ source, alt, state, mouthShape, smiling }: { source: string; alt: string; state: AvatarState; mouthShape: MouthShape; smiling: boolean }) {
  const resolved = smiling ? 'smile' : mouthShape;
  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden bg-transparent" data-avatar-state={state}>
      <img src={source} alt={alt} className="h-full w-full select-none object-contain object-bottom drop-shadow-2xl" draggable={false} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
        <g className="avatar-image-blink" fill="none" stroke="#1b1212" strokeWidth="1.15" strokeLinecap="round">
          <path d="M24 31 Q30 28 36 31" />
          <path d="M64 31 Q70 28 76 31" />
        </g>
        <path
          className={state === 'speaking' ? 'avatar-image-mouth avatar-image-mouth--speaking' : 'avatar-image-mouth'}
          d={mouthPaths[resolved]}
          fill={resolved === 'closed' ? 'none' : '#a54852'}
          stroke="#6e3038"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] text-amber-50/80 backdrop-blur sm:bottom-3 sm:left-3 sm:text-xs">
        {stateLabel[state]}
      </div>
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
            <ImageBasedHarryAvatar source={source} alt={character.identity.displayName} state={state} mouthShape={mouthShape} smiling={smiling} />
          ) : (
            <StaticAvatar character={character} />
          )}
        </div>
      </div>
    </div>
  );
}

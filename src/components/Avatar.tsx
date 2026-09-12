import React, { useEffect, useMemo, useState } from 'react';
import { AvatarState, Character } from '../types';
import { avatarStateLabels } from '../services/avatar';
import {
  AvatarAnimationController as RendererAnimationController,
  MouthShape,
} from '../services/avatar-animation';
import { createAvatar2DAnimationAdapter } from '../services/avatar-animation-adapter';

/**
 * Backward-compatible alias for callers that still use the old component type.
 * The actual mouth state is renderer-neutral and now comes from avatar-animation.
 */
export type AvatarMouthShape = MouthShape;

interface AvatarProps {
  character: Character;
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mouthShape?: AvatarMouthShape;
  /**
   * Renderer-neutral animation controller supplied by the chat/orchestration layer.
   * The Avatar component owns the 2D adapter so a future Live2D/3D component can
   * use the same controller without changing the voice or chat pipeline.
   */
  animationController?: RendererAnimationController;
}

const sizes = {
  sm: {
    width: 180,
    height: 230,
  },
  md: {
    width: 240,
    height: 310,
  },
  lg: {
    width: 360,
    height: 460,
  },
  xl: {
    width: 440,
    height: 560,
  },
};

const stateStyles: Record<
  AvatarState,
  {
    border: string;
    glow: string;
  }
> = {
  idle: {
    border: 'rgba(251,191,36,.35)',
    glow: 'rgba(251,191,36,.12)',
  },
  listening: {
    border: 'rgba(125,211,252,.8)',
    glow: 'rgba(56,189,248,.25)',
  },
  thinking: {
    border: 'rgba(196,181,253,.8)',
    glow: 'rgba(139,92,246,.25)',
  },
  speaking: {
    border: 'rgba(252,211,77,.9)',
    glow: 'rgba(245,158,11,.3)',
  },
  error: {
    border: 'rgba(251,113,133,.85)',
    glow: 'rgba(244,63,94,.22)',
  },
};

function HarryMouth({
  shape,
}: {
  shape: AvatarMouthShape;
}) {
  const mouth = useMemo(() => {
    switch (shape) {
      case 'open-large':
        return {
          d: 'M 133 245 Q 160 270 187 245 Q 160 290 133 245',
          fill: '#160b16',
        };

      case 'open-medium':
        return {
          d: 'M 139 246 Q 160 265 181 246 Q 160 276 139 246',
          fill: '#160b16',
        };

      case 'open-small':
        return {
          d: 'M 145 248 Q 160 258 175 248 Q 160 265 145 248',
          fill: '#160b16',
        };

      case 'pursed':
        return {
          d: 'M 151 248 Q 160 254 169 248 Q 160 260 151 248',
          fill: '#160b16',
        };

      case 'smile':
        return {
          d: 'M 140 247 Q 160 263 180 247',
          fill: 'none',
        };

      case 'closed':
      default:
        return {
          d: 'M 145 250 Q 160 254 175 250',
          fill: 'none',
        };
    }
  }, [shape]);

  return (
    <path
      d={mouth.d}
      fill={mouth.fill}
      stroke="#4a1f2d"
      strokeWidth="3"
      strokeLinecap="round"
    />
  );
}

function HarryAvatar({
  state,
  mouthShape,
  blink,
}: {
  state: AvatarState;
  mouthShape: AvatarMouthShape;
  blink: boolean;
}) {
  const speaking = state === 'speaking';
  const listening = state === 'listening';
  const thinking = state === 'thinking';

  return (
    <svg
      viewBox="0 0 320 420"
      width="100%"
      height="100%"
      role="img"
      aria-label="آواتار هری"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="harry-robe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#21152d" />
          <stop offset="100%" stopColor="#0c0914" />
        </linearGradient>

        <linearGradient id="harry-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c7a7" />
          <stop offset="100%" stopColor="#d99e7c" />
        </linearGradient>

        <radialGradient id="harry-background">
          <stop offset="0%" stopColor="#4c2b68" />
          <stop offset="100%" stopColor="#110b1b" />
        </radialGradient>

        <filter id="harry-shadow">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="12"
            floodOpacity=".45"
          />
        </filter>
      </defs>

      <rect
        x="8"
        y="8"
        width="304"
        height="404"
        rx="48"
        fill="url(#harry-background)"
      />

      {/* shoulders / robe */}
      <g
        style={{
          transformOrigin: '160px 360px',
          animation: 'harryBreathing 3.8s ease-in-out infinite',
        }}
      >
        <path
          d="M 66 420 Q 70 335 116 315 L 204 315 Q 250 335 254 420 Z"
          fill="url(#harry-robe)"
          stroke="#8a6aa8"
          strokeWidth="2"
        />

        <path
          d="M 126 319 L 160 366 L 194 319"
          fill="#3b1f52"
          stroke="#a58bb9"
          strokeWidth="2"
        />

        <path
          d="M 147 337 L 160 366 L 173 337"
          fill="#e7c54a"
          opacity=".9"
        />
      </g>

      {/* neck */}
      <path
        d="M 139 290 L 139 327 Q 160 340 181 327 L 181 290 Z"
        fill="url(#harry-skin)"
      />

      {/* head movement */}
      <g
        style={{
          transformOrigin: '160px 190px',
          animation:
            state === 'idle'
              ? 'harryHeadIdle 5s ease-in-out infinite'
              : state === 'thinking'
                ? 'harryThinking 2s ease-in-out infinite'
                : state === 'speaking'
                  ? 'harrySpeaking 1.8s ease-in-out infinite'
                  : 'none',
        }}
      >
        {/* face */}
        <ellipse
          cx="160"
          cy="190"
          rx="78"
          ry="105"
          fill="url(#harry-skin)"
          filter="url(#harry-shadow)"
        />

        {/* ears */}
        <ellipse
          cx="84"
          cy="198"
          rx="13"
          ry="23"
          fill="#dda582"
        />

        <ellipse
          cx="236"
          cy="198"
          rx="13"
          ry="23"
          fill="#dda582"
        />

        {/* hair */}
        <path
          d="
            M 82 174
            Q 77 92 112 78
            Q 128 45 157 62
            Q 184 43 205 72
            Q 236 83 238 173
            Q 218 139 201 128
            Q 183 112 160 128
            Q 139 108 119 132
            Q 101 144 82 174
          "
          fill="#241a19"
        />

        {/* hair fringe */}
        <path
          d="
            M 96 130
            Q 105 76 139 91
            Q 151 70 167 91
            Q 190 70 218 116
            Q 197 105 182 119
            Q 162 98 149 122
            Q 131 103 116 129
            Q 105 118 96 130
          "
          fill="#171112"
        />

        {/* glasses */}
        <g
          fill="none"
          stroke="#17131c"
          strokeWidth="6"
        >
          <circle
            cx="125"
            cy="190"
            r="29"
          />

          <circle
            cx="195"
            cy="190"
            r="29"
          />

          <path
            d="M 154 190 Q 160 184 166 190"
          />

          <path
            d="M 96 190 L 83 184"
          />

          <path
            d="M 224 190 L 237 184"
          />
        </g>

        {/* eyes */}
        <g>
          <ellipse
            cx="125"
            cy="190"
            rx="9"
            ry={blink ? 1.5 : 11}
            fill="#111"
            style={{
              transition: 'ry 70ms ease',
            }}
          />

          <ellipse
            cx="195"
            cy="190"
            rx="9"
            ry={blink ? 1.5 : 11}
            fill="#111"
            style={{
              transition: 'ry 70ms ease',
            }}
          />

          {!blink && (
            <>
              <circle
                cx="122"
                cy="187"
                r="2.5"
                fill="#fff"
              />

              <circle
                cx="192"
                cy="187"
                r="2.5"
                fill="#fff"
              />
            </>
          )}
        </g>

        {/* eyebrows */}
        <path
          d="M 105 166 Q 125 155 143 166"
          fill="none"
          stroke="#30201c"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <path
          d="M 177 166 Q 195 155 215 166"
          fill="none"
          stroke="#30201c"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* nose */}
        <path
          d="M 160 188 Q 151 221 160 225 Q 169 221 160 188"
          fill="none"
          stroke="#a96f5d"
          strokeWidth="3"
        />

        {/* mouth */}
        <HarryMouth shape={mouthShape} />

        {/* speaking glow */}
        {speaking && (
          <ellipse
            cx="160"
            cy="252"
            rx="37"
            ry="21"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity=".65"
            style={{
              animation:
                'harryMouthGlow .45s ease-in-out infinite',
            }}
          />
        )}
      </g>

      {/* magical particles */}
      {(speaking || listening || thinking) && (
        <g opacity=".75">
          <circle
            cx="45"
            cy="110"
            r="3"
            fill="#fbbf24"
            style={{
              animation:
                'harrySpark 1.7s ease-in-out infinite',
            }}
          />

          <circle
            cx="274"
            cy="135"
            r="3"
            fill="#a78bfa"
            style={{
              animation:
                'harrySpark 2.1s ease-in-out infinite',
            }}
          />

          <circle
            cx="262"
            cy="290"
            r="2"
            fill="#67e8f9"
            style={{
              animation:
                'harrySpark 1.9s ease-in-out infinite',
            }}
          />
        </g>
      )}
    </svg>
  );
}

export function Avatar({
  character,
  state,
  size = 'lg',
  mouthShape,
  animationController,
}: AvatarProps) {
  const [blink, setBlink] = useState(false);
  const [renderState, setRenderState] = useState<AvatarState>(state);
  const [renderMouthShape, setRenderMouthShape] =
    useState<AvatarMouthShape>(
      mouthShape ?? (state === 'speaking' ? 'open-medium' : 'closed'),
    );

  const dimension = sizes[size];
  const style = stateStyles[renderState];

  /**
   * Connect this concrete 2D renderer to the renderer-neutral animation stream.
   * The adapter owns the renderer-specific representation while the controller
   * remains independent from SVG/2D details.
   */
  useEffect(() => {
    if (!animationController) {
      setRenderState(state);
      setRenderMouthShape(
        mouthShape ?? (state === 'speaking' ? 'open-medium' : 'closed'),
      );
      return;
    }

    const adapter = createAvatar2DAnimationAdapter();
    const detachAdapter = animationController.attachAdapter(adapter);

    setRenderState(adapter.getState());
    setRenderMouthShape(adapter.getLipSync().mouthShape);

    const unsubscribe = animationController.subscribe((command) => {
      setRenderState(adapter.getState());
      setRenderMouthShape(adapter.getLipSync().mouthShape);

      if (command.type === 'reset') {
        setRenderState(adapter.getState());
        setRenderMouthShape(adapter.getLipSync().mouthShape);
      }
    });

    return () => {
      unsubscribe();
      detachAdapter();
    };
  }, [animationController, mouthShape, state]);

  useEffect(() => {
    let mounted = true;
    let blinkTimer: number | undefined;
    let closeTimer: number | undefined;

    const blinkLoop = () => {
      const delay = 2800 + Math.random() * 3000;

      blinkTimer = window.setTimeout(() => {
        if (!mounted) return;

        setBlink(true);

        closeTimer = window.setTimeout(() => {
          if (mounted) {
            setBlink(false);
          }
        }, 90);

        blinkLoop();
      }, delay);
    };

    blinkLoop();

    return () => {
      mounted = false;

      if (blinkTimer !== undefined) {
        window.clearTimeout(blinkTimer);
      }

      if (closeTimer !== undefined) {
        window.clearTimeout(closeTimer);
      }
    };
  }, []);

  return (
    <div
      className="relative select-none"
      style={{
        width: dimension.width,
        height: dimension.height,
        maxWidth: '100%',
      }}
      data-character-id={character.identity.id}
      data-avatar-state={renderState}
      data-mouth-shape={renderMouthShape}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-4xl border-4"
        style={{
          borderColor: style.border,
          boxShadow: `0 0 55px ${style.glow}`,
          background:
            'radial-gradient(circle at 50% 20%, rgba(124,58,237,.22), transparent 55%), #10091a',
          transition:
            'border-color .35s ease, box-shadow .35s ease',
        }}
      >
        <HarryAvatar
          state={renderState}
          mouthShape={renderMouthShape}
          blink={blink}
        />
      </div>

      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-200/20 bg-[#21142f]/95 px-4 py-1.5 text-xs text-amber-100 shadow-lg"
      >
        {avatarStateLabels[renderState]}
      </div>

      {renderState === 'listening' && (
        <div className="pointer-events-none absolute -inset-3 animate-ping rounded-[2.5rem] border border-sky-300/30" />
      )}

      {renderState === 'thinking' && (
        <div className="absolute -right-3 -top-4 rounded-full bg-violet-500 px-3 py-1 text-xs text-white shadow-lg">
          ...
        </div>
      )}

      {renderState === 'error' && (
        <div className="absolute -right-3 -top-4 rounded-full bg-rose-500 px-3 py-1 text-xs text-white shadow-lg">
          !
        </div>
      )}

      <style>
        {`
          @keyframes harryBreathing {
            0%, 100% {
              transform: translateY(0) scale(1);
            }

            50% {
              transform: translateY(-2px) scale(1.008);
            }
          }

          @keyframes harryHeadIdle {
            0%, 100% {
              transform: rotate(0deg) translateY(0);
            }

            50% {
              transform: rotate(1.2deg) translateY(-1px);
            }
          }

          @keyframes harryThinking {
            0%, 100% {
              transform: rotate(0deg) translateY(0);
            }

            50% {
              transform: rotate(-2deg) translateY(-2px);
            }
          }

          @keyframes harrySpeaking {
            0%, 100% {
              transform: rotate(0deg) translateY(0);
            }

            50% {
              transform: rotate(.8deg) translateY(-1px);
            }
          }

          @keyframes harryMouthGlow {
            0%, 100% {
              opacity: .35;
              transform: scale(.94);
            }

            50% {
              opacity: .8;
              transform: scale(1.04);
            }
          }

          @keyframes harrySpark {
            0%, 100% {
              opacity: .25;
              transform: translateY(0) scale(.8);
            }

            50% {
              opacity: 1;
              transform: translateY(-8px) scale(1.2);
            }
          }
        `}
      </style>
    </div>
  );
}

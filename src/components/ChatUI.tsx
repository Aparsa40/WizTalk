import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Send,
  Settings as SettingsIcon,
  Volume2,
} from 'lucide-react';

import {
  AppState,
  AvatarState,
  Character,
  Message,
  VoiceEvent,
} from '../types';

import { ApiService } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { MemoryService } from '../services/memory';
import { VoiceService } from '../services/voice-advanced';
import { LipSyncCoordinator } from '../services/lipsync-coordinator';

interface ChatUIProps {
  character: Character;
  appState: AppState;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ChatUI({
  character,
  appState,
  onBack,
  onOpenSettings,
}: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avatarState, setAvatarState] =
    useState<AvatarState>('idle');

  const controller =
    useRef<AvatarAnimationController>(
      new AvatarAnimationController(),
    );

  const lipSyncCoordinator =
    useRef<LipSyncCoordinator | null>(null);

  const speakingTimer =
    useRef<number | undefined>(undefined);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribe =
      controller.current.subscribe(setAvatarState);

    return () => {
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    const coordinator =
      new LipSyncCoordinator(
        character.identity.id,
      );

    lipSyncCoordinator.current = coordinator;

    coordinator.setAnimationController(
      controller.current,
    );

    return () => {
      coordinator.reset();

      if (
        lipSyncCoordinator.current === coordinator
      ) {
        lipSyncCoordinator.current = null;
      }
    };
  }, [character.identity.id]);


  useEffect(() => {
    const saved =
      MemoryService.getMessages(
        character.identity.id,
      );

    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const greeting: Message = {
        id:
          typeof crypto !== 'undefined' &&
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : String(Date.now()),

        sender: 'character',
        text: character.identity.greeting,
        timestamp: Date.now(),
      };

      MemoryService.saveMessage(
        character.identity.id,
        greeting,
      );

      setMessages([greeting]);
    }


    return () => {
      VoiceService.abortListening();
      VoiceService.stopSpeaking();

      if (speakingTimer.current) {
        window.clearTimeout(
          speakingTimer.current,
        );
      }

      lipSyncCoordinator.current?.reset();
    };
  }, [character.identity.id]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isTyping]);


  const setState = (
    state: AvatarState,
  ) => {
    controller.current.setState(state);
  };


  const finishSpeaking = () => {
    if (speakingTimer.current) {
      window.clearTimeout(
        speakingTimer.current,
      );
    }

    speakingTimer.current =
      window.setTimeout(() => {
        setState('idle');
      }, 700);
  };


  const handleVoiceEvent = (
    event: VoiceEvent,
  ) => {
    lipSyncCoordinator.current?.processVoiceEvent(
      event,
    );
  };


  const speak = async (
    text: string,
  ) => {
    setState('speaking');

    if (
      character.voiceModels.default.enabled
    ) {
      try {
        await VoiceService.speak(
          text,
          character,
          handleVoiceEvent,
        );

        finishSpeaking();
      } catch (error) {
        console.warn(
          'TTS unavailable',
          error,
        );

        finishSpeaking();
      }
    } else {
      finishSpeaking();
    }
  };


  const handleSend = async () => {
    const trimmedInput =
      input.trim();

    if (
      !trimmedInput ||
      isTyping
    ) {
      return;
    }


    const userMsg: Message = {
      id:
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : String(Date.now()),

      sender: 'user',
      text: trimmedInput,
      timestamp: Date.now(),
    };


    const nextMessages = [
      ...messages,
      userMsg,
    ];

    setMessages(nextMessages);

    MemoryService.saveMessage(
      character.identity.id,
      userMsg,
    );


    setInput('');
    setIsTyping(true);
    setState('thinking');


    try {
      const result =
        await ApiService.sendMessage(
          userMsg.text,
          character.identity.id,
          appState.provider,
          appState.model,
          nextMessages,
          character,
        );


      const characterMsg: Message = {
        id:
          typeof crypto !== 'undefined' &&
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : String(Date.now() + 1),

        sender: 'character',
        text: result.response,
        timestamp: Date.now(),
      };


      setMessages((current) => [
        ...current,
        characterMsg,
      ]);


      MemoryService.saveMessage(
        character.identity.id,
        characterMsg,
      );


      await speak(
        characterMsg.text,
      );

    } catch (error) {
      console.error(
        'Chat request failed',
        error,
      );

      setState('error');


      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'character',
        text:
          error instanceof Error
            ? error.message
            : 'ارتباط با سرویس پاسخ‌گو ناموفق بود.',
        timestamp: Date.now(),
      };


      setMessages((current) => [
        ...current,
        errorMsg,
      ]);


      window.setTimeout(() => {
        setState('idle');
      }, 2500);

    } finally {
      setIsTyping(false);
    }
  };


  const toggleListening = () => {
    if (isListening) {
      VoiceService.stopListening();

      setIsListening(false);
      setState('idle');

      return;
    }


    const recognition =
      VoiceService.initSpeechToText(
        character,
        (text) => {
          setInput((current) =>
            current
              ? `${current} ${text}`
              : text,
          );
        },
        (message) => {
          setIsListening(false);
          setState('error');

          console.warn(
            'Speech recognition error:',
            message,
          );

          window.setTimeout(() => {
            setState('idle');
          }, 2500);
        },
        () => {
          setIsListening(false);

          if (!isTyping) {
            setState('idle');
          }
        },
      );


    if (
      !recognition ||
      !VoiceService.startListening()
    ) {
      setIsListening(false);
      setState('error');

      window.setTimeout(() => {
        setState('idle');
      }, 2500);

      return;
    }


    setIsListening(true);
    setState('listening');
  };


  const repeatLast = async () => {
    const lastCharacterMessage =
      [...messages]
        .reverse()
        .find(
          (item) =>
            item.sender === 'character',
        );


    if (lastCharacterMessage) {
      await speak(
        lastCharacterMessage.text,
      );
    }
  };
  
 return (
    <div className="flex h-screen flex-col bg-[#12091f] text-amber-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#241437]/80 p-4 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full p-2 transition hover:bg-white/10"
          aria-label="بازگشت"
        >
          <ArrowRight className="h-6 w-6" />
        </button>

        <div className="text-center">
          <h2 className="font-serif text-xl font-bold text-amber-300">
            {character.identity.displayName}
          </h2>

          <span className="text-xs text-amber-50/50">
            {appState.provider === 'local'
              ? 'آفلاین'
              : `${appState.provider} · ${appState.model}`}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full p-2 transition hover:bg-white/10"
          aria-label="تنظیمات"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Main */}
      <main className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-10 top-1/4 h-72 w-72 rounded-full bg-violet-700 blur-3xl" />

          <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-amber-700 blur-3xl" />
        </div>

        {/* Avatar */}
        <aside className="z-10 flex shrink-0 flex-col items-center justify-center border-b border-white/10 bg-gradient-to-b from-[#1d1030] to-transparent p-5 md:w-[36%] md:border-b-0 md:border-l">
          <Avatar
            character={character}
            state={avatarState}
            size="xl"
            animationController={
              controller.current.getAnimationController()
            }
          />

          <div className="mt-10 max-w-xs text-center">
            <h3 className="text-lg font-bold text-amber-200">
              {character.identity.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-amber-50/60">
              {character.identity.description}
            </p>

            <p className="mt-4 text-xs text-amber-300/50">
              {character.identity.personality.tone}
            </p>
          </div>
        </aside>

        {/* Chat */}
        <section className="z-10 flex min-h-0 flex-1 flex-col bg-black/10">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  'flex ' +
                  (message.sender === 'user'
                    ? 'justify-end'
                    : 'justify-start')
                }
              >
                <div
                  className={
                    'max-w-[88%] rounded-2xl p-4 leading-7 shadow-lg sm:max-w-[72%] ' +
                    (message.sender === 'user'
                      ? 'rounded-tr-sm bg-amber-600 text-white'
                      : 'rounded-tl-sm border border-white/10 bg-[#2a1740]/90 text-amber-50')
                  }
                >
                  <p className="whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-[#2a1740] p-4">
                  <i className="h-2 w-2 animate-bounce rounded-full bg-amber-300" />
                  <i className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:150ms]" />
                  <i className="h-2 w-2 animate-bounce rounded-full bg-amber-300 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 bg-[#1b0e2b]/90 p-3 backdrop-blur-md sm:p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-2">

              <button
                type="button"
                onClick={toggleListening}
                className={
                  'shrink-0 rounded-full p-3 transition ' +
                  (isListening
                    ? 'bg-rose-500 text-white'
                    : 'bg-[#2a1740] text-amber-300 hover:bg-[#3a2550]')
                }
                aria-label={
                  isListening
                    ? 'توقف ضبط صدا'
                    : 'ضبط صدا'
                }
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>


              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="پیامت را اینجا بنویس..."
                  className="min-h-12 max-h-32 w-full resize-none rounded-2xl border border-white/10 bg-[#2a1740] px-4 py-3 pl-12 text-amber-50 outline-none focus:border-amber-300/70"
                  rows={1}
                  dir="auto"
                />

                <button
                  type="button"
                  onClick={() => void repeatLast()}
                  className="absolute bottom-3 left-3 text-amber-50/40 transition hover:text-amber-300"
                  title="پخش دوباره آخرین پاسخ"
                  aria-label="پخش دوباره آخرین پاسخ"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>


              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isTyping}
                className="shrink-0 rounded-full bg-amber-500 p-3 text-[#21102e] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="ارسال"
              >
                <Send className="h-5 w-5" />
              </button>

            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

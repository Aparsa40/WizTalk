import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, Send, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { AvatarState, Character, Message, VoiceEvent } from '../types';
import { ApiService } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { MemoryService } from '../services/memory';
import { VoiceService } from '../services/voice-advanced';
import { LipSyncCoordinator } from '../services/lipsync-coordinator';

interface ChatUIProps {
  character: Character;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ChatUI({ character, onBack, onOpenSettings }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');

  const controller = useRef<AvatarAnimationController>(new AvatarAnimationController());
  const lipSync = useRef<LipSyncCoordinator | null>(null);
  const end = useRef<HTMLDivElement>(null);
  // React's useRef type definitions require an initial value. Keeping null in
  // the type also makes the timer lifecycle explicit during mount/unmount.
  const timer = useRef<number | null>(null);

  useEffect(() => controller.current.subscribe(setAvatarState), []);

  useEffect(() => {
    const c = new LipSyncCoordinator(character.identity.id);
    lipSync.current = c;
    c.setAnimationController(controller.current);

    return () => {
      c.reset();
      lipSync.current = null;
    };
  }, [character.identity.id]);

  useEffect(() => {
    const saved = MemoryService.getMessages(character.identity.id);

    if (saved.length) {
      setMessages(saved);
    } else {
      const greeting = {
        id: crypto.randomUUID(),
        sender: 'character' as const,
        text: character.identity.greeting,
        timestamp: Date.now(),
      };
      MemoryService.saveMessage(character.identity.id, greeting);
      setMessages([greeting]);
    }

    return () => {
      VoiceService.abortListening();
      VoiceService.stopSpeaking();
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      lipSync.current?.reset();
    };
  }, [character.identity.id]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speak = async (text: string) => {
    controller.current.setState('speaking');

    if (character.voiceModels.default.enabled) {
      try {
        await VoiceService.speak(text, character, (e: VoiceEvent) =>
          lipSync.current?.processVoiceEvent(e)
        );
      } catch (error) {
        console.warn('TTS unavailable', error);
      }
    }

    timer.current = window.setTimeout(
      () => controller.current.setState('idle'),
      700
    );
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const user = {
      id: crypto.randomUUID(),
      sender: 'user' as const,
      text,
      timestamp: Date.now(),
    };
    const next = [...messages, user];

    setMessages(next);
    MemoryService.saveMessage(character.identity.id, user);
    setInput('');
    setIsTyping(true);
    controller.current.setState('thinking');

    try {
      const result = await ApiService.sendMessage(text, character.identity.id, next);
      const reply = {
        id: crypto.randomUUID(),
        sender: 'character' as const,
        text: result.response,
        timestamp: Date.now(),
      };
      setMessages((current) => [...current, reply]);
      MemoryService.saveMessage(character.identity.id, reply);
      await speak(reply.text);
    } catch (error) {
      console.error('Chat request failed', error);
      controller.current.setState('error');
      window.setTimeout(() => controller.current.setState('idle'), 1800);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      controller.current.setState('idle');
      return;
    }

    const recognition = VoiceService.initSpeechToText(
      character,
      (text) => setInput((value) => (value ? `${value} ${text}` : text)),
      (message) => {
        console.warn('Speech recognition error:', message);
        setIsListening(false);
        controller.current.setState('error');
      },
      () => {
        setIsListening(false);
        if (!isTyping) controller.current.setState('idle');
      }
    );

    if (!recognition || !VoiceService.startListening()) {
      setIsListening(false);
      controller.current.setState('error');
      return;
    }

    setIsListening(true);
    controller.current.setState('listening');
  };

  const repeatLast = async () => {
    const last = [...messages].reverse().find((m) => m.sender === 'character');
    if (last) await speak(last.text);
  };

  return (
    <div className="flex h-screen flex-col bg-[#12091f] text-amber-50">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#241437]/80 p-4">
        <button onClick={onBack} className="rounded-full p-2 hover:bg-white/10">
          <ArrowRight />
        </button>
        <div className="text-center">
          <h2 className="font-serif text-xl font-bold text-amber-300">{character.identity.displayName}</h2>
          <span className="text-xs text-amber-50/50">پاسخ‌گویی مستقل شخصیت</span>
        </div>
        <button onClick={onOpenSettings} className="rounded-full p-2 hover:bg-white/10">
          <SettingsIcon />
        </button>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="z-10 flex shrink-0 flex-col items-center justify-center border-b border-white/10 p-5 md:w-[36%]">
          <Avatar
            character={character}
            state={avatarState}
            size="xl"
            animationController={controller.current.getAnimationController()}
          />
          <div className="mt-6 max-w-xs text-center">
            <h3 className="text-lg font-bold text-amber-200">{character.identity.name}</h3>
            <p className="mt-2 text-sm leading-6 text-amber-50/60">{character.identity.description}</p>
          </div>
        </aside>

        <section className="z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl p-4 leading-7 shadow-lg ${
                    m.sender === 'user'
                      ? 'rounded-tr-sm bg-amber-600'
                      : 'rounded-tl-sm border border-white/10 bg-[#2a1740]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-[#2a1740] p-4">...</div>
              </div>
            )}

            <div ref={end} />
          </div>

          <div className="border-t border-white/10 bg-[#1b0e2b]/90 p-3">
            <div className="mx-auto flex max-w-4xl items-end gap-2">
              <button onClick={toggleListening} className="rounded-full bg-[#2a1740] p-3">
                {isListening ? <MicOff /> : <Mic />}
              </button>

              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="پیامت را اینجا بنویس..."
                  className="min-h-12 max-h-32 w-full resize-none rounded-2xl border border-white/10 bg-[#2a1740] px-4 py-3 pl-12"
                />
                <button onClick={() => void repeatLast()} className="absolute bottom-3 left-3">
                  <Volume2 />
                </button>
              </div>

              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || isTyping}
                className="rounded-full bg-amber-500 p-3 text-[#21102e] disabled:opacity-40"
              >
                <Send />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

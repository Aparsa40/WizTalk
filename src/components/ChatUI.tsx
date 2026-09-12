import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, Send, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { AvatarState, Character, Message, VoiceEvent } from '../types';
import { ApiService } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { MemoryService } from '../services/memory';
import { voiceManager } from '../services/voice-manager';
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
  const timer = useRef<number | null>(null);

  useEffect(() => controller.current.subscribe(setAvatarState), []);

  useEffect(() => {
    const coordinator = new LipSyncCoordinator(character.identity.id);
    lipSync.current = coordinator;
    coordinator.setAnimationController(controller.current);
    return () => {
      coordinator.reset();
      lipSync.current = null;
    };
  }, [character.identity.id]);

  useEffect(() => {
    const saved = MemoryService.getMessages(character.identity.id);
    if (saved.length) {
      setMessages(saved);
    } else {
      const greeting: Message = {
        id: crypto.randomUUID(),
        sender: 'character',
        text: character.identity.greeting,
        timestamp: Date.now(),
      };
      MemoryService.saveMessage(character.identity.id, greeting);
      setMessages([greeting]);
    }
    return () => {
      voiceManager.abortListening();
      voiceManager.stop();
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      lipSync.current?.reset();
    };
  }, [character.identity.id, character.identity.greeting]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const speak = async (text: string) => {
    controller.current.setState('speaking');
    const result = await voiceManager.speak(text, character, (event: VoiceEvent) => lipSync.current?.processVoiceEvent(event));
    if (!result.spoken && result.error) console.warn('Voice unavailable; keeping text response visible.', result.error);
    timer.current = window.setTimeout(() => controller.current.setState('idle'), 700);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    const user: Message = { id: crypto.randomUUID(), sender: 'user', text, timestamp: Date.now() };
    const next = [...messages, user];
    setMessages(next);
    MemoryService.saveMessage(character.identity.id, user);
    setInput('');
    setIsTyping(true);
    controller.current.setState('thinking');
    try {
      const result = await ApiService.sendMessage(text, character.identity.id, next);
      const reply: Message = { id: crypto.randomUUID(), sender: 'character', text: result.response, timestamp: Date.now() };
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
      voiceManager.stopListening();
      setIsListening(false);
      controller.current.setState('idle');
      return;
    }
    const recognition = voiceManager.initSpeechToText(
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
      },
    );
    if (!recognition || !voiceManager.startListening()) {
      setIsListening(false);
      controller.current.setState('error');
      return;
    }
    setIsListening(true);
    controller.current.setState('listening');
  };

  const repeatLast = async () => {
    const last = [...messages].reverse().find((message) => message.sender === 'character');
    if (last) await speak(last.text);
  };

  const lastCharacterMessage = [...messages].reverse().find((message) => message.sender === 'character');

  return (
    <div dir="rtl" className="flex min-h-[100dvh] flex-col bg-[#12091f] text-amber-50">
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#241437]/90 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
        <button type="button" onClick={onBack} aria-label="بازگشت به انتخاب شخصیت" className="rounded-full p-2 transition hover:bg-white/10">
          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <h2 className="truncate font-serif text-base font-bold text-amber-300 sm:text-xl">{character.identity.displayName}</h2>
          <span className="hidden text-xs text-amber-50/50 xs:inline sm:inline">گفت‌وگوی اختصاصی شخصیت</span>
        </div>
        <button type="button" onClick={onOpenSettings} aria-label="تنظیمات شخصیت" className="rounded-full p-2 transition hover:bg-white/10">
          <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative flex shrink-0 flex-col items-center justify-center border-b border-white/10 bg-[#170c26] px-3 py-4 sm:px-5 sm:py-5 lg:w-[42%] lg:border-b-0 lg:border-l lg:px-6 lg:py-8">
          <div className="w-full max-w-[30rem] text-center">
            <div className="mb-3 sm:mb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200/50 sm:text-xs sm:tracking-[0.22em]">Character</p>
              <h3 className="mt-1 text-xl font-bold text-amber-200 sm:text-2xl">{character.identity.name}</h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-amber-50/60 sm:mt-2 sm:text-sm sm:leading-6">{character.identity.description}</p>
            </div>
            <div className="mx-auto w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[22rem]">
              <Avatar character={character} state={avatarState} size="xl" animationController={controller.current.getAnimationController()} />
            </div>
            {lastCharacterMessage && (
              <div className="relative mx-auto mt-3 max-h-28 max-w-[30rem] overflow-y-auto rounded-2xl border border-amber-200/15 bg-[#2a1740]/95 px-4 py-3 text-right shadow-xl sm:mt-4 sm:rounded-3xl sm:px-5 sm:py-4 sm:max-h-36" aria-live="polite" aria-label="آخرین پاسخ شخصیت">
                <span className="absolute -top-2 right-8 h-4 w-4 rotate-45 border-l border-t border-amber-200/15 bg-[#2a1740]" />
                <p className="relative whitespace-pre-wrap text-xs leading-6 text-amber-50 sm:text-sm sm:leading-7">{lastCharacterMessage.text}</p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#12091f]">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8" aria-label="تاریخچه گفت‌وگو">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs leading-5 text-amber-50/60 sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
                <strong className="text-amber-200">{character.identity.displayName}</strong>
                <span className="mr-2">گفت‌وگو با این شخصیت به‌صورت مستقل نگهداری می‌شود.</span>
              </div>
              {messages.map((message) => {
                const isUser = message.sender === 'user';
                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`min-w-0 max-w-[94%] overflow-hidden rounded-3xl px-3.5 py-2.5 text-sm leading-6 shadow-lg sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-base sm:leading-7 ${isUser ? 'rounded-tr-md bg-amber-600 text-[#21102e]' : 'rounded-tl-md border border-white/10 bg-[#2a1740] text-amber-50'}`}>
                      <div className="mb-1 text-[10px] font-semibold opacity-60 sm:text-[11px]">{isUser ? 'تو' : character.identity.displayName}</div>
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  </div>
                );
              })}
              {isTyping && <div className="flex justify-end"><div className="rounded-3xl rounded-tl-md border border-white/10 bg-[#2a1740] px-5 py-4 text-amber-100/70"><span aria-label="شخصیت در حال فکر کردن">•••</span></div></div>}
              <div ref={end} />
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#1b0e2b]/95 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-3">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-1.5 sm:gap-2">
              <button type="button" onClick={toggleListening} aria-label={isListening ? 'توقف شنیدن' : 'شروع گفتار'} className={`shrink-0 rounded-full p-2.5 sm:p-3 transition ${isListening ? 'bg-amber-500 text-[#21102e]' : 'bg-[#2a1740] hover:bg-[#382050]'}`}>
                {isListening ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
              <div className="relative min-w-0 flex-1">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder={`با ${character.identity.displayName} صحبت کن...`} aria-label="پیام" className="min-h-11 max-h-32 w-full resize-none rounded-2xl border border-white/10 bg-[#2a1740] px-3 py-2.5 pl-10 text-sm outline-none transition placeholder:text-amber-50/35 focus:border-amber-300/40 sm:px-4 sm:py-3 sm:pl-12 sm:text-base" />
                <button type="button" onClick={() => void repeatLast()} aria-label="پخش دوباره آخرین پاسخ" className="absolute bottom-2.5 left-2.5 rounded-full p-1 text-amber-100/70 transition hover:bg-white/10 hover:text-amber-100 sm:bottom-3 sm:left-3"><Volume2 size={18} /></button>
              </div>
              <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isTyping} aria-label="ارسال پیام" className="shrink-0 rounded-full bg-amber-500 p-2.5 text-[#21102e] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"><Send className="h-5 w-5 sm:h-6 sm:w-6" /></button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

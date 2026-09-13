import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, Send, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { AvatarState, Character, Message, VoiceEvent } from '../types';
import { ApiService, type ChatMode } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { MemoryService } from '../services/memory';
import { voiceManager } from '../services/voice-manager';
import { LipSyncCoordinator } from '../services/lipsync-coordinator';

interface ChatUIProps { character: Character; onBack: () => void; onOpenSettings: () => void; }

export function ChatUI({ character, onBack, onOpenSettings }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const controller = useRef(new AvatarAnimationController());
  const lipSync = useRef<LipSyncCoordinator | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => controller.current.subscribe(setAvatarState), []);
  useEffect(() => {
    const coordinator = new LipSyncCoordinator(character.identity.id);
    lipSync.current = coordinator;
    coordinator.setAnimationController(controller.current);
    return () => { coordinator.reset(); lipSync.current = null; };
  }, [character.identity.id]);

  useEffect(() => {
    const saved = MemoryService.getMessages(character.identity.id);
    if (saved.length) setMessages(saved);
    else {
      const greeting: Message = { id: crypto.randomUUID(), sender: 'character', text: character.identity.greeting, timestamp: Date.now() };
      MemoryService.saveMessage(character.identity.id, greeting);
      setMessages([greeting]);
    }
    return () => {
      voiceManager.abortListening();
      voiceManager.stop();
      if (timer.current !== null) window.clearTimeout(timer.current);
      lipSync.current?.reset();
    };
  }, [character.identity.id, character.identity.greeting]);

  const speak = async (text: string) => {
    controller.current.setState('speaking');
    const result = await voiceManager.speak(text, character, (event: VoiceEvent) => lipSync.current?.processVoiceEvent(event));
    if (!result.spoken && result.error) console.warn('Voice output unavailable; keeping text response visible.');
    timer.current = window.setTimeout(() => controller.current.setState('idle'), 700);
  };

  const submitMessage = async (rawText: string, mode: ChatMode) => {
    const text = rawText.trim();
    if (!text || isTyping) return;
    const user: Message = { id: crypto.randomUUID(), sender: 'user', text, timestamp: Date.now() };
    const next = [...messages, user];
    setMessages(next);
    MemoryService.saveMessage(character.identity.id, user);
    setInput('');
    setIsTyping(true);
    controller.current.setState('thinking');
    try {
      const result = await ApiService.sendMessage(text, character.identity.id, next, mode);
      const reply: Message = { id: crypto.randomUUID(), sender: 'character', text: result.response, timestamp: Date.now() };
      setMessages((current) => [...current, reply]);
      MemoryService.saveMessage(character.identity.id, reply);
      await speak(reply.text);
    } catch (error) {
      console.error('Chat request failed', error);
      controller.current.setState('idle');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => { await submitMessage(input, 'text'); };

  const toggleListening = async () => {
    if (isListening) {
      voiceManager.stopListening();
      setIsListening(false);
      controller.current.setState('idle');
      return;
    }
    if (isTyping) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('microphone permission is not supported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      const recognition = voiceManager.initSpeechToText(character, (text) => {
        setIsListening(false);
        voiceManager.stopListening();
        void submitMessage(text, 'voice');
      }, (message) => {
        console.warn('Speech recognition error:', message);
        setIsListening(false);
        controller.current.setState('idle');
      }, () => {
        setIsListening(false);
        if (!isTyping) controller.current.setState('idle');
      });
      if (!recognition || !voiceManager.startListening()) {
        setIsListening(false);
        controller.current.setState('idle');
        return;
      }
      setIsListening(true);
      controller.current.setState('listening');
    } catch (error) {
      console.warn('Microphone permission failed:', error);
      setIsListening(false);
      controller.current.setState('idle');
    }
  };

  const repeatLast = async () => {
    const last = [...messages].reverse().find((message) => message.sender === 'character');
    if (last) await speak(last.text);
  };

  const lastCharacterMessage = [...messages].reverse().find((message) => message.sender === 'character');
  const lastUserMessage = [...messages].reverse().find((message) => message.sender === 'user');
  const background = character.backgrounds.assets.find((asset) => asset.id === character.backgrounds.selectedId) ?? character.backgrounds.assets[0];
  const backgroundStyle = background ? {
    backgroundImage: `linear-gradient(180deg, rgba(8,8,14,.16), rgba(8,8,14,.48)), url(${background.source})`,
    backgroundSize: background.size ?? 'cover',
    backgroundPosition: background.position ?? 'center',
  } : undefined;

  return <div dir="rtl" className="flex min-h-[100dvh] flex-col overflow-hidden bg-[#0d0b12] text-amber-50" style={backgroundStyle}>
    <header className="z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/35 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <button type="button" onClick={onBack} aria-label="بازگشت به انتخاب شخصیت" className="rounded-full p-2 transition hover:bg-white/10"><ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" /></button>
      <div className="min-w-0 px-2 text-center"><h2 className="truncate font-serif text-base font-bold text-amber-200 sm:text-xl">{character.identity.displayName}</h2><span className="hidden text-xs text-amber-50/60 sm:inline">گفت‌وگوی اختصاصی شخصیت</span></div>
      <button type="button" onClick={onOpenSettings} aria-label="تنظیمات شخصیت" className="rounded-full p-2 transition hover:bg-white/10"><SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" /></button>
    </header>
    <main className="relative flex min-h-0 flex-1 flex-col">
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 pb-28 pt-5 sm:px-6 sm:pb-32 sm:pt-7">
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[.24em] text-amber-100/60 sm:text-xs">{character.identity.role}</p>
          <div className="w-[min(78vw,28rem)] sm:w-[min(55vw,31rem)]"><Avatar character={character} state={avatarState} size="xl" animationController={controller.current.getAnimationController()} /></div>
          <div className="relative -mt-2 w-[min(90vw,38rem)] sm:-mt-3" aria-live="polite" aria-label="پاسخ شخصیت">
            {lastCharacterMessage && <div className="relative mx-auto max-h-44 overflow-y-auto rounded-[2rem] border border-white/20 bg-white/90 px-5 py-4 text-right text-[#21172a] shadow-2xl backdrop-blur-md sm:px-7 sm:py-5"><span className="absolute -top-3 right-1/2 h-6 w-6 translate-x-1/2 rotate-45 border-l border-t border-white/20 bg-white/90" aria-hidden="true" /><p className="relative whitespace-pre-wrap break-words text-sm leading-7 sm:text-base sm:leading-8">{lastCharacterMessage.text}</p></div>}
            {isTyping && <div className="mx-auto mt-3 w-fit rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs text-amber-50/80 backdrop-blur">{character.identity.displayName} در حال فکر کردن...</div>}
          </div>
          {lastUserMessage && <p className="mt-4 max-h-20 max-w-lg overflow-hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-amber-50/70 backdrop-blur">پیام شما: {lastUserMessage.text}</p>}
        </div>
      </section>
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/55 p-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-1.5 sm:gap-2">
          <button type="button" onClick={() => void repeatLast()} aria-label="پخش دوباره آخرین پاسخ" className="shrink-0 rounded-full bg-black/40 p-2.5 text-amber-100 transition hover:bg-black/60 sm:p-3"><Volume2 className="h-5 w-5 sm:h-6 sm:w-6" /></button>
          <div className="relative min-w-0 flex-1">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder={`با ${character.identity.displayName} صحبت کن...`} aria-label="پیام" className="min-h-11 max-h-32 w-full resize-none rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 pl-11 text-sm text-[#21172a] outline-none transition placeholder:text-[#21172a]/40 focus:border-amber-300/70 sm:px-4 sm:py-3 sm:pl-12 sm:text-base" />
            <button type="button" onClick={() => void toggleListening()} aria-label={isListening ? 'توقف شنیدن' : 'شروع گفتار'} className={`absolute bottom-2.5 left-2.5 rounded-full p-1.5 transition sm:bottom-3 sm:left-3 ${isListening ? 'bg-amber-500 text-[#21102e]' : 'text-[#21172a]/65 hover:bg-black/5 hover:text-[#21172a]'}`}>{isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
          </div>
          <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isTyping} aria-label="ارسال پیام" className="shrink-0 rounded-full bg-amber-500 p-2.5 text-[#21102e] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"><Send className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        </div>
      </div>
    </main>
  </div>;
}

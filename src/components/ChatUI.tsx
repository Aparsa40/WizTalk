import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, Send, Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';
import { AvatarState, Character, Message, VoiceEvent } from '../types';
import { ApiService, type ChatMode } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { MemoryService } from '../services/memory';
import { voiceManager } from '../services/voice-manager';
import { LipSyncCoordinator } from '../services/lipsync-coordinator';

interface ChatUIProps { character: Character; onBack: () => void; onOpenSettings: () => void; }

type SpeechResultEvent = {
  resultIndex?: number;
  results?: ArrayLike<ArrayLike<{ transcript?: string; isFinal?: boolean }>>;
};

type SpeechErrorEvent = { error?: string };

type RecognitionController = {
  continuous?: boolean;
  interimResults?: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};

export function ChatUI({ character, onBack, onOpenSettings }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveVoiceText, setLiveVoiceText] = useState('');
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);
  const controller = useRef(new AvatarAnimationController());
  const lipSync = useRef<LipSyncCoordinator | null>(null);
  const timer = useRef<number | null>(null);
  const recognitionFinalText = useRef('');
  const recognitionActive = useRef(false);
  const stoppingRecognition = useRef(false);
  const pendingVoiceSubmit = useRef('');
  const messagesRef = useRef<Message[]>([]);
  const readSession = useRef(0);
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [bubbleOffset, setBubbleOffset] = useState({ x: 0, y: 0 });

  useEffect(() => controller.current.subscribe(setAvatarState), []);

  useEffect(() => {
    setBubbleOffset({ x: 0, y: 0 });
    const coordinator = new LipSyncCoordinator(character.identity.id);
    lipSync.current = coordinator;
    coordinator.setAnimationController(controller.current);
    return () => { coordinator.reset(); lipSync.current = null; };
  }, [character.identity.id]);

  useEffect(() => {
    const saved = MemoryService.getMessages(character.identity.id);
    const initial = saved.length
      ? saved
      : [{ id: crypto.randomUUID(), sender: 'character' as const, text: character.identity.greeting, timestamp: Date.now() }];
    if (!saved.length) MemoryService.saveMessage(character.identity.id, initial[0]);
    messagesRef.current = initial;
    setMessages(initial);

    return () => {
      recognitionActive.current = false;
      stoppingRecognition.current = false;
      voiceManager.abortListening();
      voiceManager.stop();
      if (timer.current !== null) window.clearTimeout(timer.current);
      lipSync.current?.reset();
    };
  }, [character.identity.id, character.identity.greeting]);

  useEffect(() => {
    if (isTyping || !pendingVoiceSubmit.current) return;
    const text = pendingVoiceSubmit.current;
    pendingVoiceSubmit.current = '';
    void submitMessage(text, 'text');
  }, [isTyping]);

  const speak = async (text: string, messageId?: string) => {
    controller.current.setState('speaking');
    if (messageId) setReadingMessageId(messageId);
    const result = await voiceManager.speak(text, character, (event: VoiceEvent) => {
      lipSync.current?.processVoiceEvent(event);
    });
    if (!result.spoken && result.error) console.warn('Voice output unavailable; keeping text response visible.');
    if (!isReadingAll) timer.current = window.setTimeout(() => controller.current.setState('idle'), 700);
    return result;
  };

  const submitMessage = async (rawText: string, mode: ChatMode) => {
    const text = rawText.trim();
    if (!text || isTyping) return false;

    const user: Message = { id: crypto.randomUUID(), sender: 'user', text, timestamp: Date.now() };
    const next = [...messagesRef.current, user];
    messagesRef.current = next;
    setMessages(next);
    MemoryService.saveMessage(character.identity.id, user);
    setInput('');
    setLiveVoiceText('');
    recognitionFinalText.current = '';
    setIsTyping(true);
    controller.current.setState('thinking');

    try {
      const result = await ApiService.sendMessage(text, character.identity.id, next, mode);
      const reply: Message = { id: crypto.randomUUID(), sender: 'character', text: result.response, timestamp: Date.now() };
      const withReply = [...messagesRef.current, reply];
      messagesRef.current = withReply;
      setMessages(withReply);
      MemoryService.saveMessage(character.identity.id, reply);
      await speak(reply.text, reply.id);
      return true;
    } catch (error) {
      console.error('Chat request failed', error);
      controller.current.setState('idle');
      return false;
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => { await submitMessage(input, 'text'); };

  const finalizeStoppedVoiceTurn = () => {
    recognitionActive.current = false;
    stoppingRecognition.current = false;
    setIsListening(false);
    setLiveVoiceText('');
    controller.current.setState('idle');

    const finalText = recognitionFinalText.current.trim();
    recognitionFinalText.current = '';
    if (!finalText) return;

    // The microphone toggle ends the user turn. If a previous response is
    // still being generated, keep the voice turn queued instead of dropping it.
    if (isTyping) {
      pendingVoiceSubmit.current = finalText;
      return;
    }
    void submitMessage(finalText, 'text');
  };

  const finishListening = () => {
    if (!recognitionActive.current || stoppingRecognition.current) return;

    // Do not mark recognition inactive before stop(). SpeechRecognition.stop()
    // may deliver one last final result asynchronously; onresult must be able
    // to collect that result before onend finalizes the voice turn.
    stoppingRecognition.current = true;
    setIsListening(false);
    voiceManager.stopListening();
  };

  const toggleListening = async () => {
    if (isListening) {
      finishListening();
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('microphone permission is not supported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      recognitionFinalText.current = '';
      pendingVoiceSubmit.current = '';
      setLiveVoiceText('');
      stoppingRecognition.current = false;
      recognitionActive.current = true;
      const recognition = voiceManager.initSpeechToText(
        character,
        () => {},
        (message) => console.warn('Speech recognition error:', message),
        () => {
          // A recognition session can end because of silence or a browser
          // service timeout. That does NOT end the user's Voice Chat turn.
          if (stoppingRecognition.current) {
            finalizeStoppedVoiceTurn();
            return;
          }
          if (!recognitionActive.current) return;
          window.setTimeout(() => {
            if (recognitionActive.current && !stoppingRecognition.current) voiceManager.startListening();
          }, 60);
        },
      );

      if (!recognition) {
        recognitionActive.current = false;
        setIsListening(false);
        controller.current.setState('idle');
        return;
      }

      const controllerRecognition = recognition as unknown as RecognitionController;
      controllerRecognition.continuous = true;
      controllerRecognition.interimResults = true;

      // VoiceService owns the recognition instance, but ChatUI needs the raw
      // interim/final stream so the user can SEE that the app is listening.
      controllerRecognition.onresult = (event: unknown) => {
        // During an explicit stop, accept the final result that the browser may
        // emit before onend. Silence/session endings while the mic is still ON
        // never reach this finalization path.
        if (!recognitionActive.current && !stoppingRecognition.current) return;
        const resultEvent = event as SpeechResultEvent;
        const results = resultEvent.results;
        if (!results) return;

        let finalPart = '';
        let interimPart = '';
        const startIndex = typeof resultEvent.resultIndex === 'number' ? resultEvent.resultIndex : 0;

        for (let index = startIndex; index < results.length; index += 1) {
          const result = results[index]?.[0];
          const transcript = result?.transcript?.trim() ?? '';
          if (!transcript) continue;
          if (result?.isFinal) finalPart = `${finalPart} ${transcript}`.trim();
          else interimPart = `${interimPart} ${transcript}`.trim();
        }

        if (finalPart) recognitionFinalText.current = `${recognitionFinalText.current} ${finalPart}`.trim();
        const visibleText = `${recognitionFinalText.current} ${interimPart}`.trim();
        setLiveVoiceText(visibleText);
      };

      controllerRecognition.onerror = (event) => {
        const error = event.error ?? '';
        console.warn('Speech recognition error:', error);
        // no-speech/aborted are normal lifecycle events for this persistent
        // Voice Chat. They must not submit text or turn the mic off.
        if (error === 'no-speech' || error === 'aborted') return;
        if (stoppingRecognition.current) return;
        recognitionActive.current = false;
        setIsListening(false);
        setLiveVoiceText('');
        controller.current.setState('idle');
      };

      controllerRecognition.onend = () => {
        if (stoppingRecognition.current) {
          finalizeStoppedVoiceTurn();
          return;
        }
        if (!recognitionActive.current) return;
        window.setTimeout(() => {
          if (recognitionActive.current && !stoppingRecognition.current) voiceManager.startListening();
        }, 60);
      };

      if (!voiceManager.startListening()) {
        recognitionActive.current = false;
        setIsListening(false);
        controller.current.setState('idle');
        return;
      }

      setIsListening(true);
      controller.current.setState('listening');
    } catch (error) {
      console.warn('Microphone permission failed:', error);
      recognitionActive.current = false;
      stoppingRecognition.current = false;
      setIsListening(false);
      setLiveVoiceText('');
      controller.current.setState('idle');
    }
  };

  const startBubbleDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: bubbleOffset.x, originY: bubbleOffset.y };
  };

  const moveBubbleDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) return;
    const nextX = dragState.current.originX + event.clientX - dragState.current.startX;
    const nextY = dragState.current.originY + event.clientY - dragState.current.startY;
    setBubbleOffset({ x: Math.max(-140, Math.min(140, nextX)), y: Math.max(-120, Math.min(120, nextY)) });
  };

  const endBubbleDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  };

  const readAllResponses = async () => {
    if (isReadingAll) {
      readSession.current += 1;
      setIsReadingAll(false);
      setReadingMessageId(null);
      voiceManager.stop();
      controller.current.setState('idle');
      return;
    }
    const responses = messagesRef.current.filter((message) => message.sender === 'character');
    if (!responses.length) return;
    const session = ++readSession.current;
    setIsReadingAll(true);
    for (const message of responses) {
      if (session !== readSession.current) break;
      setReadingMessageId(message.id);
      await speak(message.text, message.id);
    }
    if (session === readSession.current) {
      setIsReadingAll(false);
      setReadingMessageId(null);
      controller.current.setState('idle');
    }
  };

  const lastCharacterMessage = [...messages].reverse().find((message) => message.sender === 'character');
  const lastUserMessage = [...messages].reverse().find((message) => message.sender === 'user');
  const background = character.backgrounds.assets.find((asset) => asset.id === character.backgrounds.selectedId) ?? character.backgrounds.assets[0];
  const backgroundStyle = background ? {
    backgroundImage: `linear-gradient(180deg, rgba(8,8,14,.16), rgba(8,8,14,.48)), url(${background.source})`,
    backgroundSize: background.size ?? 'cover',
    backgroundPosition: background.position ?? 'center',
  } : undefined;

  return <div dir="rtl" className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#0d0b12] text-amber-50" style={backgroundStyle}>
    <header className="z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/35 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <button type="button" onClick={onBack} aria-label="بازگشت به انتخاب شخصیت" className="rounded-full p-2 transition hover:bg-white/10"><ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" /></button>
      <div className="min-w-0 px-2 text-center"><h2 className="truncate font-serif text-base font-bold text-amber-200 sm:text-xl">{character.identity.displayName}</h2><span className="hidden text-xs text-amber-50/60 sm:inline">گفت‌وگوی اختصاصی شخصیت</span></div>
      <button type="button" onClick={onOpenSettings} aria-label="تنظیمات شخصیت" className="rounded-full p-2 transition hover:bg-white/10"><SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" /></button>
    </header>
    <main className="relative flex min-h-0 flex-1 flex-col">
      <section className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-6">
        <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-start">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[.24em] text-amber-100/60 sm:text-xs">{character.identity.role}</p>
          <div className="w-[min(68vw,27rem)] sm:w-[min(48vw,30rem)]"><Avatar character={character} state={avatarState} size="xl" animationController={controller.current.getAnimationController()} /></div>

          {liveVoiceText && <div className="mt-4 w-[min(94vw,40rem)] rounded-[2rem] border border-sky-200/35 bg-sky-950/65 px-5 py-4 text-right shadow-xl backdrop-blur-md" aria-live="polite" aria-label="متن زنده گفتار شما">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-sky-200"><span className="h-2 w-2 animate-pulse rounded-full bg-sky-300" />در حال شنیدن...</div>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white sm:text-base sm:leading-8">{liveVoiceText}</p>
          </div>}

          <div className="relative mt-2 w-[min(94vw,40rem)] sm:mt-3" aria-live="polite" aria-label="پاسخ شخصیت">
            {lastCharacterMessage && <div
              className="relative mx-auto max-h-[min(30vh,16rem)] touch-none overflow-y-auto rounded-[2.2rem] border border-white/35 bg-white/90 px-5 py-4 text-right text-[#21172a] shadow-2xl backdrop-blur-md sm:px-7 sm:py-5"
              style={{ transform: `translate(${bubbleOffset.x}px, ${bubbleOffset.y}px)` }}
              onPointerDown={startBubbleDrag}
              onPointerMove={moveBubbleDrag}
              onPointerUp={endBubbleDrag}
              onPointerCancel={endBubbleDrag}
            >
              <span className="absolute -top-3 right-1/2 h-6 w-6 translate-x-1/2 rotate-45 border-l border-t border-white/35 bg-white/90" aria-hidden="true" />
              <span className="pointer-events-none absolute right-6 top-3 h-2 w-2 rounded-full bg-white/70" aria-hidden="true" />
              <span className="pointer-events-none absolute right-10 top-1 h-1.5 w-1.5 rounded-full bg-white/60" aria-hidden="true" />
              <p className="relative whitespace-pre-wrap break-words text-sm leading-7 sm:text-base sm:leading-8">{lastCharacterMessage.text}</p>
            </div>}
            {isTyping && <div className="mx-auto mt-3 w-fit rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs text-amber-50/80 backdrop-blur">{character.identity.displayName} در حال فکر کردن...</div>}
          </div>
          {lastUserMessage && <p className="mt-4 max-h-20 max-w-lg overflow-hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-amber-50/70 backdrop-blur">پیام شما: {lastUserMessage.text}</p>}
        </div>
      </section>
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/55 p-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-3">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-1.5 sm:gap-2">
          <button type="button" onClick={() => void readAllResponses()} aria-label={isReadingAll ? 'توقف خواندن پاسخ‌ها' : 'خواندن پاسخ‌های شخصیت'} className={`shrink-0 rounded-full p-2.5 transition sm:p-3 ${isReadingAll ? 'bg-amber-500 text-[#21102e]' : 'bg-black/40 text-amber-100 hover:bg-black/60'}`}>{isReadingAll ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />}</button>
          <div className="relative min-w-0 flex-1">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder={`با ${character.identity.displayName} صحبت کن...`} aria-label="پیام" className="min-h-11 max-h-32 w-full resize-y rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 pl-11 text-sm text-[#21172a] outline-none transition placeholder:text-[#21172a]/40 focus:border-amber-300/70 sm:px-4 sm:py-3 sm:pl-12 sm:text-base" />
            <button type="button" onClick={() => void toggleListening()} aria-label={isListening ? 'توقف شنیدن' : 'شروع گفتار'} className={`absolute bottom-2.5 left-2.5 rounded-full p-1.5 transition sm:bottom-3 sm:left-3 ${isListening ? 'bg-sky-500 text-white ring-2 ring-sky-200/50' : 'text-[#21172a]/65 hover:bg-black/5 hover:text-[#21172a]'}`}>{isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
          </div>
          <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isTyping || isListening} aria-label="ارسال پیام" className="shrink-0 rounded-full bg-amber-500 p-2.5 text-[#21102e] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"><Send className="h-5 w-5 sm:h-6 sm:w-6" /></button>
        </div>
      </div>
    </main>
  </div>;
}

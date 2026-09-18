import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, History, Mic, MicOff, Send, Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';
import { AvatarState, Character, Message, VoiceEvent } from '../types';
import { ApiService, type ChatMode } from '../services/api';
import { Avatar } from './Avatar';
import { AvatarAnimationController } from '../services/avatar-controller';
import { voiceManager } from '../services/voice-manager';
import { LipSyncCoordinator } from '../services/lipsync-coordinator';
import { ChatSessionsPanel } from './ChatSessionsPanel';

interface ChatUIProps { character: Character; onBack: () => void; onOpenSettings: () => void; }

type SpeechResultEvent = { resultIndex?: number; results?: ArrayLike<ArrayLike<{ transcript?: string; isFinal?: boolean }>>; };
type SpeechErrorEvent = { error?: string; };
type RecognitionController = { continuous?: boolean; interimResults?: boolean; onresult: ((event: unknown) => void) | null; onerror: ((event: SpeechErrorEvent) => void) | null; onend: (() => void) | null; };

export function ChatUI({ character, onBack, onOpenSettings }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('گفت‌وگوی جدید');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveVoiceText, setLiveVoiceText] = useState('');
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => controller.current.subscribe(setAvatarState), []);

  useEffect(() => {
    const coordinator = new LipSyncCoordinator(character.identity.id);
    lipSync.current = coordinator;
    coordinator.setAnimationController(controller.current);
    return () => { coordinator.reset(); lipSync.current = null; };
  }, [character.identity.id]);

  const startNewSession = async () => {
    try {
      const result = await ApiService.createSession(character.identity.id);
      setSessionId(result.session.id);
      messagesRef.current = result.messages;
      setMessages(result.messages);
      controller.current.setState('idle');
      setShowSessions(false);
    } catch (error) {
      console.error('Could not create chat session', error);
    }
  };

  const selectSession = async (id: string) => {
    try {
      const result = await ApiService.getSession(id);
      setSessionId(result.session.id);
      messagesRef.current = result.messages;
      setMessages(result.messages);
      setShowSessions(false);
      controller.current.setState('idle');
    } catch (error) {
      console.error('Could not load chat session', error);
    }
  };

  useEffect(() => {
    void startNewSession();
    return () => {
      recognitionActive.current = false;
      stoppingRecognition.current = false;
      pendingVoiceSubmit.current = '';
      voiceManager.abortListening();
      voiceManager.stop();
      if (timer.current !== null) window.clearTimeout(timer.current);
      lipSync.current?.reset();
    };
  }, [character.identity.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, liveVoiceText]);

  const speak = async (text: string, messageId?: string) => {
    controller.current.setState('speaking');
    if (messageId) setReadingMessageId(messageId);
    const result = await voiceManager.speak(text, character, (event: VoiceEvent) => lipSync.current?.processVoiceEvent(event));
    if (!result.spoken && result.error) console.warn('Voice output unavailable; keeping text response visible.');
    if (!isReadingAll) timer.current = window.setTimeout(() => controller.current.setState('idle'), 700);
    return result;
  };

  const submitMessage = async (rawText: string, mode: ChatMode) => {
    const text = rawText.trim();
    if (!text || isTyping || !sessionId) return false;

    const user: Message = { id: crypto.randomUUID(), sender: 'user', text, timestamp: Date.now() };
    const next = [...messagesRef.current, user];
    messagesRef.current = next;
    setMessages(next);
    setInput('');
    setLiveVoiceText('');
    recognitionFinalText.current = '';
    setIsTyping(true);
    controller.current.setState('thinking');

    try {
      const result = await ApiService.sendMessage(text, sessionId, mode);
      const reply = result.message;
      const withReply = [...messagesRef.current, reply];
      messagesRef.current = withReply;
      setMessages(withReply);
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

  const finalizeStoppedVoiceTurn = () => {
    recognitionActive.current = false;
    stoppingRecognition.current = false;
    setIsListening(false);
    setLiveVoiceText('');
    controller.current.setState('idle');
    const finalText = recognitionFinalText.current.trim();
    recognitionFinalText.current = '';
    if (!finalText) return;
    if (isTyping) { pendingVoiceSubmit.current = finalText; return; }
    void submitMessage(finalText, 'text');
  };

  useEffect(() => {
    if (isTyping || !pendingVoiceSubmit.current) return;
    const text = pendingVoiceSubmit.current;
    pendingVoiceSubmit.current = '';
    void submitMessage(text, 'text');
  }, [isTyping]);

  const finishListening = () => {
    if (!recognitionActive.current || stoppingRecognition.current) return;
    stoppingRecognition.current = true;
    setIsListening(false);
    voiceManager.stopListening();
  };

  const toggleListening = async () => {
    if (isListening) { finishListening(); return; }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('microphone permission is not supported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      recognitionFinalText.current = '';
      pendingVoiceSubmit.current = '';
      stoppingRecognition.current = false;
      setLiveVoiceText('');
      recognitionActive.current = true;

      const recognition = voiceManager.initSpeechToText(
        character,
        () => {},
        (message) => console.warn('Speech recognition error:', message),
        () => {
          if (!recognitionActive.current || stoppingRecognition.current) return;
          window.setTimeout(() => {
            if (recognitionActive.current && !stoppingRecognition.current) voiceManager.startListening();
          }, 60);
        },
      );

      if (!recognition) { recognitionActive.current = false; setIsListening(false); controller.current.setState('idle'); return; }

      const recognitionController = recognition as unknown as RecognitionController;
      recognitionController.continuous = true;
      recognitionController.interimResults = true;
      recognitionController.onresult = (event: unknown) => {
        if (!recognitionActive.current || stoppingRecognition.current) return;
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
        setLiveVoiceText(`${recognitionFinalText.current} ${interimPart}`.trim());
      };
      recognitionController.onerror = (event) => {
        const error = event.error ?? '';
        if (error === 'no-speech' || error === 'aborted') return;
        recognitionActive.current = false;
        stoppingRecognition.current = false;
        setIsListening(false);
        setLiveVoiceText('');
        controller.current.setState('idle');
      };
      recognitionController.onend = () => {
        if (stoppingRecognition.current) { finalizeStoppedVoiceTurn(); return; }
        if (!recognitionActive.current) return;
        window.setTimeout(() => {
          if (recognitionActive.current && !stoppingRecognition.current) voiceManager.startListening();
        }, 60);
      };

      if (!voiceManager.startListening()) { recognitionActive.current = false; setIsListening(false); controller.current.setState('idle'); return; }
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
    const current = ++readSession.current;
    setIsReadingAll(true);
    for (const message of responses) {
      if (current !== readSession.current) break;
      setReadingMessageId(message.id);
      await speak(message.text, message.id);
    }
    if (current === readSession.current) {
      setIsReadingAll(false);
      setReadingMessageId(null);
      controller.current.setState('idle');
    }
  };

  const background = character.backgrounds.assets.find((asset) => asset.id === character.backgrounds.selectedId) ?? character.backgrounds.assets[0];
  const backgroundStyle = background ? { backgroundImage: `linear-gradient(180deg, rgba(8,8,14,.16), rgba(8,8,14,.56)), url(${background.source})`, backgroundSize: background.size ?? 'cover', backgroundPosition: background.position ?? 'center' } : undefined;
  const lastCharacterMessage = [...messages].reverse().find((message) => message.sender === 'character');

  return <div dir="rtl" className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#0d0b12] text-amber-50" style={backgroundStyle}>
    <header className="z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/35 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <button type="button" onClick={onBack} aria-label="بازگشت به انتخاب شخصیت" className="rounded-full p-2 hover:bg-white/10"><ArrowRight className="h-5 w-5 sm:h-6 sm:w-6"/></button>
      <button type="button" onClick={()=>setShowSessions(true)} className="min-w-0 max-w-[58vw] px-2 text-center"><h2 className="truncate font-serif text-base font-bold text-amber-200 sm:text-xl">{character.identity.displayName}</h2><span className="block truncate text-[10px] text-amber-50/60 sm:text-xs">{sessionTitle}</span></button>
      <div className="flex items-center gap-1"><button type="button" onClick={()=>setShowSessions(true)} aria-label="جلسه‌های گفتگو" className="rounded-full p-2 hover:bg-white/10"><History className="h-5 w-5 sm:h-6 sm:w-6"/></button><button type="button" onClick={onOpenSettings} aria-label="تنظیمات شخصیت" className="rounded-full p-2 hover:bg-white/10"><SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6"/></button></div>
    </header>

    <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <section className="relative min-h-full px-3 pb-32 pt-3 sm:px-6 sm:pb-36 sm:pt-5">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[.24em] text-amber-100/60 sm:text-xs">{character.identity.role}</p>
          <div className="flex w-full min-h-0 justify-center"><Avatar character={character} state={avatarState} size="xl" animationController={controller.current.getAnimationController()}/></div>

          {liveVoiceText && <div className="mt-3 w-[min(94vw,42rem)] rounded-[1.5rem] border border-sky-200/35 bg-sky-950/65 px-4 py-3 text-right shadow-xl backdrop-blur-md" aria-live="polite"><div className="mb-1 flex items-center gap-2 text-xs font-semibold text-sky-200"><span className="h-2 w-2 animate-pulse rounded-full bg-sky-300"/>در حال شنیدن...</div><p className="whitespace-pre-wrap break-words text-sm leading-7 text-white">{liveVoiceText}</p></div>}

          <div className="mt-3 w-full max-w-3xl" aria-live="polite">
            {lastCharacterMessage && <div className="relative mx-auto max-h-[min(30vh,17rem)] overflow-y-auto rounded-[2rem] border border-white/35 bg-white/90 px-5 py-4 text-right text-[#21172a] shadow-2xl backdrop-blur-md sm:px-7 sm:py-5">
              <span className="absolute -top-3 right-1/2 h-6 w-6 translate-x-1/2 rotate-45 border-l border-t border-white/35 bg-white/90" aria-hidden="true"/>
              <p className="relative whitespace-pre-wrap break-words text-sm leading-7 sm:text-base sm:leading-8">{lastCharacterMessage.text}</p>
              {readingMessageId === lastCharacterMessage.id && <span className="absolute bottom-2 left-3 rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] text-[#21102e]">در حال خواندن</span>}
            </div>}
            {isTyping && <div className="mx-auto mt-3 w-fit rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs text-amber-50/80 backdrop-blur">{character.identity.displayName} در حال فکر کردن...</div>}
          </div>

          <div className="mt-4 flex w-full max-w-3xl flex-col gap-2">
            {messages.filter((message) => message.sender === 'user').slice(-3).map((message) => <div key={message.id} className="self-start max-w-[88%] rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-xs leading-6 text-amber-50/70 backdrop-blur"><span className="text-amber-200/70">شما:</span> {message.text}</div>)}
          </div>
          <div ref={bottomRef}/>
        </div>
      </section>
    </main>

    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/60 p-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-1.5 sm:gap-2">
        <button type="button" onClick={()=>void readAllResponses()} aria-label={isReadingAll?'توقف خواندن':'خواندن پاسخ‌ها'} className={`shrink-0 rounded-full p-2.5 sm:p-3 ${isReadingAll?'bg-amber-500 text-[#21102e]':'bg-black/40 text-amber-100 hover:bg-black/60'}`}>{isReadingAll?<VolumeX className="h-5 w-5 sm:h-6 sm:w-6"/>:<Volume2 className="h-5 w-5 sm:h-6 sm:w-6"/>}</button>
        <div className="relative min-w-0 flex-1">
          <textarea value={input} onChange={(event)=>setInput(event.target.value)} onKeyDown={(event)=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void submitMessage(input,'text');}}} placeholder={`با ${character.identity.displayName} صحبت کن...`} aria-label="پیام" className="min-h-11 max-h-32 w-full resize-y rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 pl-11 text-sm text-[#21172a] outline-none placeholder:text-[#21172a]/40 focus:border-amber-300/70 sm:px-4 sm:py-3 sm:pl-12 sm:text-base"/>
          <button type="button" onClick={()=>void toggleListening()} aria-label={isListening?'توقف شنیدن':'شروع گفتار'} className={`absolute bottom-2.5 left-2.5 rounded-full p-1.5 sm:bottom-3 sm:left-3 ${isListening?'bg-sky-500 text-white ring-2 ring-sky-200/50':'text-[#21172a]/65 hover:bg-black/5'}`}>{isListening?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}</button>
        </div>
        <button type="button" onClick={()=>void submitMessage(input,'text')} disabled={!input.trim()||isTyping||isListening||!sessionId} aria-label="ارسال پیام" className="shrink-0 rounded-full bg-amber-500 p-3 text-[#21102e] shadow-lg disabled:opacity-40"><Send className="h-5 w-5 sm:h-6 sm:w-6"/></button>
      </div>
    </div>

    {showSessions && <ChatSessionsPanel characterId={character.identity.id} activeSessionId={sessionId} onSelect={(id)=>void selectSession(id)} onNew={()=>void startNewSession()} onClose={()=>setShowSessions(false)}/>}
  </div>;
}

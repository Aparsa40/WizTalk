import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, MicOff, Send, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { AppState, AvatarState, Character, Message } from '../types';
import { ApiService } from './api';
import { Avatar } from '../components/Avatar';
import { createAvatarController } from './avatar-controller';
import { MemoryService } from './memory';
import { VoiceService } from './voice-advanced';
import { createLipSyncCoordinator } from './lipsync-coordinator';

interface ChatUIProps {
  character: Character;
  appState: AppState;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ChatUI({ character, appState, onBack, onOpenSettings }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [error, setError] = useState('');

  const controller = useRef(createAvatarController());
  const lipSyncCoordinator = useRef(createLipSyncCoordinator(character));
  const speakingTimer = useRef<number | undefined>(undefined);
  const voiceEventUnsub = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up avatar animation controller
  useEffect(() => {
    const controller_instance = controller.current;
    const unsubscribe = controller_instance.subscribe(setAvatarState);
    
    // Load saved messages for this character
    const saved = MemoryService.getMessages(character.id);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // Show greeting only for new conversations
      const greeting: Message = {
        id: crypto.randomUUID?.() || String(Date.now()),
        sender: 'character',
        text: character.greeting,
        timestamp: Date.now(),
      };
      setMessages([greeting]);
      MemoryService.saveMessage(character.id, greeting);
    }

    // Subscribe to voice events for lip-sync coordination
    voiceEventUnsub.current = VoiceService.subscribeToVoiceEvents((event) => {
      lipSyncCoordinator.current.processVoiceEvent(event);
    });

    // Set up lip-sync coordinator with animation controller
    lipSyncCoordinator.current.setAnimationController(controller_instance);

    return () => {
      unsubscribe();
      voiceEventUnsub.current?.();
    };
  }, [character.id, character.greeting]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Finish speaking after delay
  const finishSpeaking = () => {
    if (speakingTimer.current) window.clearTimeout(speakingTimer.current);
    speakingTimer.current = window.setTimeout(() => {
      if (controller.current.getState() === 'speaking') {
        controller.current.setState('idle');
      }
    }, 500);
  };

  // Speak response using character-specific voice
  const speak = async (text: string) => {
    if (!appState.voiceEnabled || !character.voice.enabled) return;

    try {
      controller.current.setState('speaking');
      await VoiceService.speak(text, character, (event) => {
        lipSyncCoordinator.current.processVoiceEvent(event);
      });
      finishSpeaking();
    } catch (err) {
      console.error('Speech error:', err);
      controller.current.setState('error');
      setTimeout(() => controller.current.setState('idle'), 1000);
    }
  };

  // Send message and get AI response
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID?.() || String(Date.now()),
      sender: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMsg]);
    MemoryService.saveMessage(character.id, userMsg);
    setError('');
    setIsTyping(true);
    controller.current.setState('thinking');

    try {
      const response = await ApiService.chat({
        message: userMsg.text,
        characterId: character.id,
        provider: appState.provider,
        model: appState.model,
        history: messages,
        character,
      });

      const characterMsg: Message = {
        id: crypto.randomUUID?.() || String(Date.now()),
        sender: 'character',
        text: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, characterMsg]);
      MemoryService.saveMessage(character.id, characterMsg);

      // Speak response with character-specific voice
      await speak(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطایی رخ داد';
      setError(errorMessage);
      controller.current.setState('error');
      setTimeout(() => controller.current.setState('idle'), 1500);
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle speech recognition with character-specific language
  const toggleListening = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      controller.current.setState('idle');
      return;
    }

    const recognition = VoiceService.initSpeechToText(
      character,
      (text) => {
        setInput((prev) => prev + (prev ? ' ' : '') + text);
        controller.current.setState('idle');
      },
      (message) => {
        setError(message);
        controller.current.setState('error');
        setTimeout(() => controller.current.setState('idle'), 1500);
      },
      () => {
        setIsListening(false);
        controller.current.setState('idle');
      }
    );

    if (recognition) {
      setError('');
      setIsListening(true);
      controller.current.setState('listening');
      VoiceService.startListening();
    }
  };

  // Repeat last character message with speaking
  const repeatLast = async () => {
    const last = [...messages].reverse().find((item) => item.sender === 'character');
    if (last) {
      await speak(last.text);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-amber-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur-sm">
        <button
          onClick={onBack}
          className="rounded-lg p-2 hover:bg-white/10 transition-colors"
          aria-label="رفتن به انتخاب شخصیت"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">{character.displayName}</h1>
          <p className="text-xs text-amber-200/60">{character.role}</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="rounded-lg p-2 hover:bg-white/10 transition-colors"
          aria-label="تنظیمات"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Main chat area */}
      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center justify-center">
          <Avatar character={character} state={avatarState} size="lg" />
        </div>

        {/* Messages and input section */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-amber-600/40 text-amber-50'
                      : 'bg-purple-700/40 text-amber-50'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-purple-700/40 px-4 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-300 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="پیام خود را بنویسید..."
              disabled={isTyping}
              className="flex-1 rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-amber-50 placeholder-amber-200/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            />
            <button
              onClick={toggleListening}
              className={`rounded-lg p-2 transition-colors ${
                isListening
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={isListening ? 'توقف گوش دادن' : 'شروع گوش دادن'}
            >
              {isListening ? (
                <Mic className="h-5 w-5 text-white" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={repeatLast}
              className="rounded-lg bg-slate-700 p-2 hover:bg-slate-600 transition-colors"
              aria-label="تکرار پیام آخر"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="rounded-lg bg-amber-600 p-2 hover:bg-amber-700 transition-colors disabled:opacity-50"
              aria-label="ارسال پیام"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

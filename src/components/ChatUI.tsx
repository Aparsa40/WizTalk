import React, { useState, useEffect, useRef } from 'react';
import { Character, Message, AppState } from '../types';
import { ApiService } from '../services/api';
import { VoiceService } from '../services/voice';
import { MemoryService } from '../services/memory';
import { Avatar } from './Avatar';
import { Mic, MicOff, Send, Settings as SettingsIcon, Volume2, ArrowRight } from 'lucide-react';

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
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages from memory
    const savedMessages = MemoryService.getMessages(character.id);
    if (savedMessages.length === 0) {
      // Add greeting
      const greetingMsg: Message = {
        id: Date.now().toString(),
        sender: 'character',
        text: character.greeting,
        timestamp: Date.now()
      };
      MemoryService.saveMessage(character.id, greetingMsg);
      setMessages([greetingMsg]);
    } else {
      setMessages(savedMessages);
    }
  }, [character.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    MemoryService.saveMessage(character.id, userMsg);
    setInput('');
    setIsTyping(true);
    setAvatarState('thinking');

    try {
      const response = await ApiService.sendMessage(
        userMsg.text,
        character.id,
        appState.provider,
        appState.model,
        appState.openAiKey
      );

      const charMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'character',
        text: response.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, charMsg]);
      MemoryService.saveMessage(character.id, charMsg);
      
      setAvatarState('speaking');
      VoiceService.speak(charMsg.text, 'fa-IR');
      
      // Reset avatar after speaking (rough estimate based on text length)
      setTimeout(() => {
        setAvatarState('idle');
      }, charMsg.text.length * 100 + 1000);

    } catch (err: any) {
      console.error(err);
      setAvatarState('error');
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'character',
        text: `خطا در ارتباط: ${err.message || 'مشکلی پیش آمد'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      setTimeout(() => setAvatarState('idle'), 3000);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      setAvatarState('idle');
    } else {
      setIsListening(true);
      setAvatarState('listening');
      VoiceService.initSpeechToText(
        (text) => setInput(prev => prev + ' ' + text),
        (err) => {
          console.error(err);
          setIsListening(false);
          setAvatarState('error');
          setTimeout(() => setAvatarState('idle'), 2000);
        },
        () => {
          setIsListening(false);
          setAvatarState('idle');
        }
      );
      VoiceService.startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a0f2e] text-amber-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-[#2a1b42]/80 backdrop-blur-md border-b border-[#4a3b62] z-10 shadow-md">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-amber-400 font-serif">{character.displayName}</h2>
          <span className="text-xs opacity-70">
            {appState.provider === 'local' ? 'آفلاین' : appState.provider}
          </span>
        </div>
        <button onClick={onOpenSettings} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <SettingsIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Magical Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
           <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-amber-600 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Avatar Sidebar (Desktop) / Top section (Mobile) */}
        <div className="md:w-1/3 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-l border-[#4a3b62]/50 bg-gradient-to-b from-[#1a0f2e] to-transparent z-10 relative">
          <Avatar imageUrl={character.avatar} state={avatarState} size="xl" />
          <div className="mt-6 text-center max-w-xs">
            <p className="opacity-80 text-sm leading-relaxed hidden md:block">{character.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col h-full bg-black/20 z-10">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-amber-600/90 text-white rounded-tr-sm shadow-[0_4px_15px_rgba(217,119,6,0.3)]' 
                      : 'bg-[#2a1b42]/90 border border-[#4a3b62] text-amber-50 rounded-tl-sm shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#2a1b42]/90 border border-[#4a3b62] p-4 rounded-2xl rounded-tl-sm flex space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#1a0f2e]/90 backdrop-blur-md border-t border-[#4a3b62]">
            <div className="flex items-end space-x-2 space-x-reverse max-w-4xl mx-auto">
              <button 
                onClick={toggleVoiceInput}
                className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2a1b42] text-amber-400 hover:bg-[#3a2b52]'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="پیام خود را بنویسید..."
                  className="w-full bg-[#2a1b42] border border-[#4a3b62] rounded-2xl pl-12 pr-4 py-3 text-amber-50 focus:outline-none focus:border-amber-500 resize-none max-h-32 min-h-[48px]"
                  rows={1}
                  dir="auto"
                />
                <button 
                  onClick={() => VoiceService.speak(messages[messages.length - 1]?.text || '')}
                  className="absolute left-3 bottom-3 text-amber-50/50 hover:text-amber-400 transition-colors"
                  title="تکرار آخرین پیام"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-amber-600 text-white rounded-full flex-shrink-0 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

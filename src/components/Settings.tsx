import React, { useState } from 'react';
import { AppState, Provider } from '../types';

interface SettingsProps {
  appState: AppState;
  onUpdateState: (newState: Partial<AppState>) => void;
  onClose: () => void;
}

export function Settings({ appState, onUpdateState, onClose }: SettingsProps) {
  const [openAiKey, setOpenAiKey] = useState(appState.openAiKey);
  const [provider, setProvider] = useState<Provider>(appState.provider);
  const [model, setModel] = useState(appState.model);

  const handleSave = () => {
    onUpdateState({
      openAiKey,
      provider,
      model: model || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : '')
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#2a1b42] border border-[#4a3b62] rounded-2xl w-full max-w-md p-6 text-amber-50 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-amber-50/50 hover:text-amber-50"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-amber-400">تنظیمات هوش مصنوعی</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 opacity-80">مدل پاسخ‌گو (Provider)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setProvider('local')}
                className={`py-2 rounded-lg text-sm border ${provider === 'local' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-[#4a3b62] opacity-70 hover:opacity-100'}`}
              >
                آفلاین (Local)
              </button>
              <button
                onClick={() => setProvider('gemini')}
                className={`py-2 rounded-lg text-sm border ${provider === 'gemini' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-[#4a3b62] opacity-70 hover:opacity-100'}`}
              >
                Gemini
              </button>
              <button
                onClick={() => setProvider('openai')}
                className={`py-2 rounded-lg text-sm border ${provider === 'openai' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-[#4a3b62] opacity-70 hover:opacity-100'}`}
              >
                OpenAI
              </button>
            </div>
            {provider === 'local' && <p className="text-xs mt-2 text-amber-50/50">پاسخ‌های از پیش آماده آفلاین.</p>}
            {provider === 'gemini' && <p className="text-xs mt-2 text-amber-50/50">Gemini نیاز به کلید دارد که در سرور پیکربندی شده است.</p>}
          </div>

          {provider === 'openai' && (
            <div>
              <label className="block text-sm font-medium mb-2 opacity-80">کلید API OpenAI</label>
              <input
                type="password"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#1a0f2e] border border-[#4a3b62] rounded-lg px-4 py-2 text-left focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
            </div>
          )}

          {(provider === 'gemini' || provider === 'openai') && (
            <div>
              <label className="block text-sm font-medium mb-2 opacity-80">مدل</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                className="w-full bg-[#1a0f2e] border border-[#4a3b62] rounded-lg px-4 py-2 text-left focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
            </div>
          )}

          <div className="pt-4 border-t border-[#4a3b62]">
            <button
              onClick={handleSave}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

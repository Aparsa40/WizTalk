import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { ApiService } from '../services/api';

interface AuthScreenProps { onAuthenticated: () => void; }

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (mode === 'register' && password !== confirm) { setError('تکرار رمز عبور یکسان نیست.'); return; }
    setBusy(true);
    try {
      if (mode === 'register') await ApiService.register(username, password);
      else await ApiService.login(username, password);
      onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'عملیات ناموفق بود.');
    } finally {
      setBusy(false);
    }
  };

  return <main dir="rtl" className="min-h-[100dvh] overflow-y-auto bg-[#12091f] px-4 py-8 text-amber-50 sm:px-6">
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md items-center py-4"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 text-3xl">✦</div>
        <p className="mt-4 text-xs uppercase tracking-[.25em] text-amber-300/60">WizTalk</p>
        <h1 className="mt-2 text-2xl font-bold text-amber-200 sm:text-3xl">{mode === 'login' ? 'ورود به حساب' : 'ساخت حساب'}</h1>
        <p className="mt-2 text-sm leading-6 text-amber-50/55">حساب محلی تو، گفتگوها و جلسات چتت را نگه می‌دارد.</p>
      </div>
      <div className="mt-6 space-y-4">
        <label className="block text-sm">نام کاربری<input value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none focus:border-amber-300/50" /></label>
        <label className="block text-sm">رمز عبور<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none focus:border-amber-300/50" /></label>
        {mode === 'register' && <label className="block text-sm">تکرار رمز عبور<input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none focus:border-amber-300/50" /></label>}
        {error && <p className="rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm leading-6 text-red-100">{error}</p>}
        <button type="button" disabled={busy || !username.trim() || password.length < 8} onClick={()=>void submit()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-[#21102e] disabled:opacity-50">
          {mode === 'login' ? <LogIn className="h-5 w-5"/> : <UserPlus className="h-5 w-5"/>}
          {busy ? 'لطفاً صبر کن…' : mode === 'login' ? 'ورود' : 'ساخت حساب و ورود'}
        </button>
        <button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}} className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-amber-100/75 hover:bg-white/5">
          {mode === 'login' ? 'حساب ندارم؛ ساخت حساب' : 'قبلاً حساب ساخته‌ام؛ ورود'}
        </button>
      </div>
    </div></div>
  </main>;
}

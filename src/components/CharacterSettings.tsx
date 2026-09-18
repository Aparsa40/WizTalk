import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Image, UserRound, X } from 'lucide-react';
import { AvatarAsset, BackgroundAsset, Character } from '../types';
import { KnowledgeManager } from './KnowledgeManager';

interface CharacterSettingsProps { character: Character; onSave: (character: Character) => void; onClose: () => void; }

export function CharacterSettings({ character, onSave, onClose }: CharacterSettingsProps) {
  const output = character.voiceModels.output;
  const [displayName, setDisplayName] = useState(character.identity.displayName);
  const [description, setDescription] = useState(character.identity.description);
  const [greeting, setGreeting] = useState(character.identity.greeting);
  const [selectedAvatarId, setSelectedAvatarId] = useState(character.avatar.selectedId ?? character.avatar.assets?.[0]?.id ?? '');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(character.backgrounds.selectedId ?? character.backgrounds.assets[0]?.id ?? '');
  const [voiceEnabled, setVoiceEnabled] = useState(output.enabled);
  const [voiceLanguage, setVoiceLanguage] = useState(output.language);
  const [speechRate, setSpeechRate] = useState(output.speechRate ?? output.rate ?? 1);
  const [pitch, setPitch] = useState(output.pitch ?? 1);
  const [volume, setVolume] = useState(output.volume ?? 1);

  const avatarAssets = character.avatar.assets ?? [];
  const backgroundAssets = character.backgrounds.assets ?? [];
  const activeAvatarIndex = Math.max(0, avatarAssets.findIndex((asset) => asset.id === selectedAvatarId));
  const activeBackgroundIndex = Math.max(0, backgroundAssets.findIndex((asset) => asset.id === selectedBackgroundId));
  const activeAvatar = avatarAssets[activeAvatarIndex];
  const activeBackground = backgroundAssets[activeBackgroundIndex];
  const avatarPreviewSource = activeAvatar?.thumbnail ?? (activeAvatar?.type === 'vrm' ? activeAvatar.fallbackSource : activeAvatar?.source);

  const moveAvatar = (direction: -1 | 1) => {
    if (!avatarAssets.length) return;
    setSelectedAvatarId(avatarAssets[(activeAvatarIndex + direction + avatarAssets.length) % avatarAssets.length].id);
  };

  const moveBackground = (direction: -1 | 1) => {
    if (!backgroundAssets.length) return;
    setSelectedBackgroundId(backgroundAssets[(activeBackgroundIndex + direction + backgroundAssets.length) % backgroundAssets.length].id);
  };

  const save = () => {
    const selectedAvatar = avatarAssets.find((asset) => asset.id === selectedAvatarId) ?? activeAvatar;
    const selectedBackground = backgroundAssets.find((asset) => asset.id === selectedBackgroundId) ?? activeBackground;

    onSave({
      ...character,
      identity: {
        ...character.identity,
        displayName: displayName.trim() || character.identity.displayName,
        description: description.trim(),
        greeting: greeting.trim() || character.identity.greeting,
      },
      avatar: selectedAvatar
        ? { ...character.avatar, selectedId: selectedAvatar.id, type: selectedAvatar.type, source: selectedAvatar.source, thumbnail: selectedAvatar.thumbnail, fallbackSource: selectedAvatar.fallbackSource }
        : character.avatar,
      backgrounds: selectedBackground
        ? { ...character.backgrounds, selectedId: selectedBackground.id }
        : character.backgrounds,
      voiceModels: {
        ...character.voiceModels,
        output: { ...character.voiceModels.output, enabled: voiceEnabled, language: voiceLanguage.trim() || character.voiceModels.output.language, speechRate, rate: speechRate, pitch, volume },
      },
    });
    onClose();
  };

  const previewStyle = activeBackground ? {
    backgroundImage: `linear-gradient(180deg, rgba(8,8,14,.18), rgba(8,8,14,.48)), url(${activeBackground.source})`,
    backgroundSize: activeBackground.size ?? 'cover',
    backgroundPosition: activeBackground.position ?? 'center',
  } : undefined;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="character-settings-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#21152f] p-5 text-amber-50 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[.2em] text-amber-300/60">Character Settings</p><h2 id="character-settings-title" className="mt-1 text-2xl font-bold text-amber-200">تنظیمات {character.identity.displayName}</h2><p className="mt-2 text-sm leading-6 text-amber-50/55">Avatar و Background کاملاً مستقل انتخاب می‌شوند و تغییر یکی، دیگری را تغییر نمی‌دهد.</p></div>
        <button type="button" onClick={onClose} aria-label="بستن تنظیمات" className="rounded-full p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>

      <div className="mt-6 space-y-5">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
          <h3 className="font-semibold text-amber-200">شخصیت</h3>
          <label className="block text-sm">نام نمایشی<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 outline-none focus:border-amber-300/40" /></label>
          <label className="block text-sm">توضیحات<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 outline-none focus:border-amber-300/40" /></label>
          <label className="block text-sm">پیام خوش‌آمدگویی<textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={2} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 outline-none focus:border-amber-300/40" /></label>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-amber-300"/><div><h3 className="font-semibold text-amber-200">Avatar</h3><p className="mt-1 text-xs text-amber-50/50">فقط ظاهر شخصیت را انتخاب کن؛ Background هیچ وابستگی به این انتخاب ندارد.</p></div></div>
          {activeAvatar ? <div className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-black/20 p-3">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black/25">
              {avatarPreviewSource ? <img src={avatarPreviewSource} alt={activeAvatar.name} className="h-[88%] w-auto max-w-[72%] object-contain drop-shadow-2xl" onError={(event) => { if (activeAvatar.fallbackSource) event.currentTarget.src = activeAvatar.fallbackSource; }} /> : <div className="text-sm text-amber-50/50">پیش‌نمایش Avatar در دسترس نیست.</div>}
              <button type="button" onClick={() => moveAvatar(-1)} aria-label="آواتار قبلی" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 backdrop-blur hover:bg-black/75"><ChevronRight className="h-5 w-5" /></button>
              <button type="button" onClick={() => moveAvatar(1)} aria-label="آواتار بعدی" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 backdrop-blur hover:bg-black/75"><ChevronLeft className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3"><div><p className="font-semibold text-amber-100">{activeAvatar.name}</p><p className="text-xs text-amber-50/50">{activeAvatarIndex + 1} از {avatarAssets.length} · {activeAvatar.type}</p></div><button type="button" onClick={() => setSelectedAvatarId(activeAvatar.id)} className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-[#21102e] hover:bg-amber-400"><Check className="h-4 w-4"/>انتخاب</button></div>
          </div> : <p className="rounded-xl border border-white/10 p-4 text-sm text-amber-50/55">برای این شخصیت Avatar ثبت نشده است.</p>}
          {avatarAssets.length > 1 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{avatarAssets.map((asset: AvatarAsset) => { const preview = asset.thumbnail ?? (asset.type === 'vrm' ? asset.fallbackSource : asset.source); return <button key={asset.id} type="button" onClick={() => setSelectedAvatarId(asset.id)} className={`overflow-hidden rounded-xl border text-right transition ${selectedAvatarId === asset.id ? 'border-amber-300/60 ring-2 ring-amber-300/20' : 'border-white/10 hover:border-white/25'}`}><div className="flex aspect-4/3 items-center justify-center bg-black/20">{preview ? <img src={preview} alt={asset.name} className="h-full w-full object-contain" /> : <span className="text-xs text-amber-50/50">No preview</span>}</div><div className="px-3 py-2 text-xs font-semibold">{asset.name}</div></button>; })}</div>}
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-2"><Image className="h-5 w-5 text-amber-300"/><div><h3 className="font-semibold text-amber-200">Background</h3><p className="mt-1 text-xs text-amber-50/50">فضای Chat را جداگانه انتخاب کن؛ می‌توانی هر Background را با هر Avatar ترکیب کنی.</p></div></div>
          {activeBackground ? <div className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-black/20 p-3">
            <div className="relative aspect-video overflow-hidden rounded-xl" style={previewStyle}><button type="button" onClick={() => moveBackground(-1)} aria-label="پس‌زمینه قبلی" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 backdrop-blur hover:bg-black/75"><ChevronRight className="h-5 w-5" /></button><button type="button" onClick={() => moveBackground(1)} aria-label="پس‌زمینه بعدی" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 backdrop-blur hover:bg-black/75"><ChevronLeft className="h-5 w-5" /></button></div>
            <div className="mt-3 flex items-center justify-between gap-3"><div><p className="font-semibold text-amber-100">{activeBackground.name}</p><p className="text-xs text-amber-50/50">{activeBackgroundIndex + 1} از {backgroundAssets.length}</p></div><button type="button" onClick={() => setSelectedBackgroundId(activeBackground.id)} className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-[#21102e] hover:bg-amber-400"><Check className="h-4 w-4"/>انتخاب</button></div>
          </div> : <p className="rounded-xl border border-white/10 p-4 text-sm text-amber-50/55">برای این شخصیت Background ثبت نشده است.</p>}
          {backgroundAssets.length > 1 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{backgroundAssets.map((asset: BackgroundAsset) => <button key={asset.id} type="button" onClick={() => setSelectedBackgroundId(asset.id)} className={`overflow-hidden rounded-xl border text-right transition ${selectedBackgroundId === asset.id ? 'border-amber-300/60 ring-2 ring-amber-300/20' : 'border-white/10 hover:border-white/25'}`}><div className="aspect-4/3 overflow-hidden bg-black/20"><img src={asset.source} alt={asset.name} className="h-full w-full object-cover" /></div><div className="px-3 py-2 text-xs font-semibold">{asset.name}</div></button>)}</div>}
        </section>

        <KnowledgeManager characterId={character.identity.id} />

        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4"><h3 className="font-semibold text-amber-200">Voice</h3><label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#130d1d] p-3 text-sm"><span>خواندن پاسخ‌ها با صدا</span><input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} className="h-5 w-5"/></label><label className="block text-sm">زبان<input value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2 outline-none focus:border-amber-300/40"/></label><div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm">سرعت<input type="number" min="0.5" max="2" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2"/></label><label className="block text-sm">زیر و بمی<input type="number" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2"/></label><label className="block text-sm">بلندی صدا<input type="number" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#130d1d] px-3 py-2"/></label></div></section>
        <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5">انصراف</button><button type="button" onClick={save} className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-bold text-[#21102e] hover:bg-amber-400">ذخیره</button></div>
      </div>
    </div>
  </div>;
}

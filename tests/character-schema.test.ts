import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCharacter } from '../src/types';

test('normalizes legacy data into isolated character configuration', () => {
  const harry = normalizeCharacter({ id:'harry', name:'Harry', displayName:'هری', description:'brave', role:'student', personality:'loyal', greeting:'سلام', systemInstructions:'stay in character', avatar:'harry.png', ai:{provider:'local',model:'faq-keyword-v1'}, voice:{provider:'browser',language:'fa-IR',enabled:true} });
  const hermione = normalizeCharacter({ id:'hermione', name:'Hermione', displayName:'هرماینی', description:'smart', role:'student', personality:{description:'precise'}, greeting:'سلام', systemInstructions:'be precise', avatar:{type:'portrait',source:'hermione.png'}, knowledge:{faq:{entries:[{keywords:['کتاب'],response:'کتاب‌ها عالی‌اند.'}]},raw:{content:'library lore'},sources:{lore:{type:'lore',collection:'library'}}}, textModels:{default:{provider:'gemini',model:'gemini-2.5-flash'}}, voiceModels:{default:{provider:'browser',language:'en-GB',enabled:false}}, settings:{enabled:true} });
  assert.equal(harry.identity.systemInstructions,'stay in character'); assert.equal(hermione.textModels.default.provider,'gemini'); hermione.knowledge.raw.content='changed'; assert.equal(harry.knowledge.raw.content,''); assert.notEqual(harry.avatar.source,hermione.avatar.source); assert.notEqual(harry.identity.id,hermione.identity.id);
});

test('character identity data stays independent after normalization', () => {
  const a = normalizeCharacter({id:'a',name:'A',displayName:'A',personality:{description:'one'},avatar:'a.png'});
  const b = normalizeCharacter({id:'b',name:'B',displayName:'B',personality:{description:'two'},avatar:'b.png'});
  a.identity.personality.description='changed'; a.avatar.source='changed.png'; assert.equal(b.identity.personality.description,'two'); assert.equal(b.avatar.source,'b.png');
});

test('avatar presets preserve character-local avatar/background pairs', () => {
  const harry = normalizeCharacter({ id:'harry', name:'Harry', displayName:'هری', avatar:{ type:'animated-2d', source:'/avatars/harry-classic.svg', backgroundSource:'/avatars/harry-bedroom.svg', presetId:'classic-bedroom', presets:[ {id:'classic-bedroom',name:'Classic',avatarSource:'/avatars/harry-classic.svg',backgroundSource:'/avatars/harry-bedroom.svg'}, {id:'illustrated-hall',name:'Illustrated',avatarSource:'/avatars/harry-illustrated.svg',backgroundSource:'/avatars/harry-hall.svg'} ] } });
  assert.equal(harry.avatar.presets?.length,2); assert.equal(harry.avatar.presets?.[0].avatarSource,'/avatars/harry-classic.svg'); assert.equal(harry.avatar.presets?.[0].backgroundSource,'/avatars/harry-bedroom.svg'); assert.equal(harry.avatar.presets?.[1].backgroundSource,'/avatars/harry-hall.svg');
});

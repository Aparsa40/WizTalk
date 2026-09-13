import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCharacter } from '../src/types';

test('normalizes legacy data into isolated character configuration', () => {
  const harry = normalizeCharacter({ id:'harry', name:'Harry', displayName:'هری', description:'brave', role:'student', personality:'loyal', greeting:'سلام', systemInstructions:'stay in character', avatar:'harry.png', ai:{provider:'local',model:'faq-keyword-v1'}, voice:{provider:'browser',language:'fa-IR',enabled:true} });
  const hermione = normalizeCharacter({ id:'hermione', name:'Hermione', displayName:'هرماینی', description:'smart', role:'student', personality:{description:'precise'}, greeting:'سلام', systemInstructions:'be precise', avatar:{type:'portrait',source:'hermione.png'}, knowledge:{faq:{entries:[{keywords:['کتاب'],response:'کتاب‌ها عالی‌اند.'}]},raw:{content:'library lore'},sources:{lore:{type:'lore',collection:'library'}}}, textModels:{primary:{provider:'openrouter',model:'minimax/minimax-m2.7:free'},secondary:{provider:'huggingface',model:'Qwen/Qwen3.8-27B:fastest'}}, voiceModels:{primary:{provider:'openrouter',model:'minimax/minimax-m2.7:free'},secondary:{provider:'huggingface',model:'Qwen/Qwen3.8-27B:fastest'},output:{provider:'browser',language:'en-GB',enabled:false}}, settings:{enabled:true} });
  assert.equal(harry.identity.systemInstructions,'stay in character');
  assert.equal(hermione.textModels.primary.provider,'openrouter');
  assert.equal(hermione.voiceModels.output.provider,'browser');
  assert.equal(harry.backgrounds.assets.length, 0);
  hermione.knowledge.raw.content='changed';
  assert.equal(harry.knowledge.raw.content,'');
  assert.notEqual(harry.avatar.source,hermione.avatar.source);
  assert.notEqual(harry.identity.id,hermione.identity.id);
});

test('character identity data stays independent after normalization', () => {
  const a = normalizeCharacter({id:'a',name:'A',displayName:'A',personality:{description:'one'},avatar:'a.png'});
  const b = normalizeCharacter({id:'b',name:'B',displayName:'B',personality:{description:'two'},avatar:'b.png'});
  a.identity.personality.description='changed'; a.avatar.source='changed.png'; assert.equal(b.identity.personality.description,'two'); assert.equal(b.avatar.source,'b.png');
});

test('avatar and background assets are independent selectable collections', () => {
  const harry = normalizeCharacter({
    id:'harry', name:'Harry', displayName:'هری',
    avatar:{ type:'animated-2d', selectedId:'illustrated', source:'/avatars/harry-classic.svg', assets:[
      {id:'classic',name:'Classic',type:'animated-2d',source:'/avatars/harry-classic.svg'},
      {id:'illustrated',name:'Illustrated',type:'animated-2d',source:'/avatars/harry-illustrated.svg'},
    ]},
    backgrounds:{ selectedId:'hall', assets:[
      {id:'bedroom',name:'Bedroom',source:'/avatars/harry-bedroom.svg'},
      {id:'hall',name:'Great Hall',source:'/avatars/harry-hall.svg'},
    ]},
  });
  assert.equal(harry.avatar.selectedId, 'illustrated');
  assert.equal(harry.avatar.source, '/avatars/harry-illustrated.svg');
  assert.equal(harry.backgrounds.selectedId, 'hall');
  assert.equal(harry.backgrounds.assets[1].source, '/avatars/harry-hall.svg');
  assert.notEqual(harry.avatar.selectedId, harry.backgrounds.selectedId);
});

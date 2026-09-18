#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { addKnowledge } from '../server/services/knowledge.ts';

const args = process.argv.slice(2);
const get = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const character = get('--character');
const file = get('--file');
const titleArg = get('--title');

if (!character || !file) {
  console.error('Usage: node scripts/import-knowledge.mjs --character <harry|hermione|ron> --file <path> [--title <title>]');
  process.exit(1);
}
if (!new Set(['harry','hermione','ron']).has(character)) throw new Error('Unknown character. Use harry, hermione, or ron.');

const absolute = path.resolve(file);
const extension = path.extname(absolute).toLowerCase();
if (!['.txt','.md','.markdown'].includes(extension)) {
  throw new Error('For this phase the offline importer accepts .txt/.md/.markdown. PDF ingestion will be added to the future admin ingestion flow, not exposed to normal users.');
}
const content = fs.readFileSync(absolute, 'utf8').trim();
if (!content) throw new Error('The selected file is empty.');

const title = titleArg?.trim() || path.basename(absolute, extension);
console.log(JSON.stringify(addKnowledge(character, title, content), null, 2));

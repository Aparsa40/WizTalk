import fs from 'fs';
import path from 'path';
import { ServerCharacter } from './characters';

export interface CharacterTopic {
  id: string;
  category?: string;
  keywords: string[];
  facts: string[];
  templates: string[];
}

export interface CharacterKnowledge {
  characterId: string;
  characterName: string;
  identity?: {
    house?: string;
    patronus?: string;
    wand?: string;
    closestFriends?: string[];
    roles?: string[];
  };
  personality?: {
    traits?: string[];
    tone?: string;
    greetingStyle?: string;
  };
  topics: CharacterTopic[];
  defaultResponses: {
    greetings: string[];
    inquiries: string[];
    unknown: string[];
  };
}

export interface WorldTopic {
  id: string;
  keywords: string[];
  facts: string[];
  perspectives?: Record<string, string>;
}

export interface WorldKnowledge {
  category: string;
  name: string;
  topics: WorldTopic[];
}

export interface KnowledgeMatch {
  source: 'character-topic' | 'world-topic' | 'legacy-faq' | 'intent';
  score: number;
  text: string;
  topicId?: string;
}

/**
 * Robust Persian text normalization utility.
 * Handles Persian/Arabic glyph variations, ZWNJ, diacritics, and punctuation.
 */
export function normalizePersianText(input: string): string {
  if (!input) return '';

  return (
    input
      // Convert Arabic Yeh to Persian Yeh
      .replace(/[\u0649\u064A]/g, '\u06CC')
      // Convert Arabic Kaf to Persian Kaf
      .replace(/\u0643/g, '\u06A9')
      // Convert Arabic numbers to English or standard numerals
      .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
      // Remove Arabic diacritics / Tashdid / Tanwin
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Replace ZWNJ (\u200C) with a space for uniform tokenization
      .replace(/\u200C/g, ' ')
      // Remove punctuation and special symbols
      .replace(/[،؛؟?!.,;:()\[\]{}"'«»—\-_/\\#@$%^&*+=|~`]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

/**
 * Tokenizes normalized text into non-empty tokens.
 */
export function tokenizePersian(input: string): string[] {
  const normalized = normalizePersianText(input);
  if (!normalized) return [];
  return normalized.split(' ').filter((token) => token.length > 0);
}

export class LocalKnowledgeEngine {
  private characterKnowledge = new Map<string, CharacterKnowledge>();
  private worldKnowledge: WorldKnowledge[] = [];
  private legacyFaqs: Array<{ question: string; answer: string; keywords?: string[] }> = [];
  private initialized = false;

  constructor() {
    this.reloadKnowledge();
  }

  /**
   * Loads or reloads all knowledge files dynamically from disk.
   * Content managers can add new JSON files without code changes.
   */
  public reloadKnowledge(): void {
    const cwd = process.cwd();
    const charactersDir = path.join(cwd, 'data', 'knowledge', 'characters');
    const worldDir = path.join(cwd, 'data', 'knowledge', 'world');
    const legacyFaqFile = path.join(cwd, 'data', 'faq', 'faqs.json');

    // 1. Load character knowledge files
    this.characterKnowledge.clear();
    if (fs.existsSync(charactersDir)) {
      try {
        const files = fs.readdirSync(charactersDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const fullPath = path.join(charactersDir, file);
              const content = fs.readFileSync(fullPath, 'utf8');
              const data = JSON.parse(content) as CharacterKnowledge;
              if (data && data.characterId && Array.isArray(data.topics)) {
                this.characterKnowledge.set(data.characterId.toLowerCase(), data);
              }
            } catch (err) {
              console.warn(`[KnowledgeEngine] Failed to parse character knowledge file: ${file}`, err);
            }
          }
        }
      } catch (err) {
        console.warn(`[KnowledgeEngine] Error reading characters directory: ${charactersDir}`, err);
      }
    }

    // 2. Load world knowledge files
    this.worldKnowledge = [];
    if (fs.existsSync(worldDir)) {
      try {
        const files = fs.readdirSync(worldDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const fullPath = path.join(worldDir, file);
              const content = fs.readFileSync(fullPath, 'utf8');
              const data = JSON.parse(content) as WorldKnowledge;
              if (data && Array.isArray(data.topics)) {
                this.worldKnowledge.push(data);
              }
            } catch (err) {
              console.warn(`[KnowledgeEngine] Failed to parse world knowledge file: ${file}`, err);
            }
          }
        }
      } catch (err) {
        console.warn(`[KnowledgeEngine] Error reading world knowledge directory: ${worldDir}`, err);
      }
    }

    // 3. Load legacy FAQs for backward compatibility
    this.legacyFaqs = [];
    if (fs.existsSync(legacyFaqFile)) {
      try {
        const rawFaq = fs.readFileSync(legacyFaqFile, 'utf8');
        const parsed = JSON.parse(rawFaq);
        if (Array.isArray(parsed)) {
          this.legacyFaqs = parsed;
        }
      } catch (err) {
        console.warn(`[KnowledgeEngine] Error reading legacy FAQs from ${legacyFaqFile}`, err);
      }
    }

    this.initialized = true;
  }

  /**
   * Generates a character-authentic response using local knowledge.
   */
  public generateResponse(params: {
    message: string;
    character: ServerCharacter;
    history?: Array<{ sender: 'user' | 'character'; text: string }>;
  }): string {
    if (!this.initialized) {
      this.reloadKnowledge();
    }

    const { message, character } = params;
    const normQuery = normalizePersianText(message);
    const tokens = tokenizePersian(message);
    const charId = (character.id || '').toLowerCase();

    // Check if we have specific knowledge for this character
    const charKnowledge = this.characterKnowledge.get(charId);

    // 1. Check direct character topics
    let bestMatch: KnowledgeMatch | null = null;

    if (charKnowledge) {
      bestMatch = this.findBestCharacterTopicMatch(tokens, normQuery, charKnowledge);
    }

    // 2. Check world knowledge topics (if character match wasn't strong enough or not found)
    if (!bestMatch || bestMatch.score < 6) {
      const worldMatch = this.findBestWorldTopicMatch(tokens, normQuery, charId);
      if (worldMatch && (!bestMatch || worldMatch.score > bestMatch.score)) {
        bestMatch = worldMatch;
      }
    }

    // 3. Check legacy FAQs if no strong match yet (specifically for Harry or general questions)
    if (!bestMatch || bestMatch.score < 5) {
      const faqMatch = this.findLegacyFaqMatch(tokens, normQuery);
      if (faqMatch && (!bestMatch || faqMatch.score > bestMatch.score)) {
        bestMatch = faqMatch;
      }
    }

    // 4. Check conversational intents (greetings, general inquiries)
    if (!bestMatch || bestMatch.score < 3) {
      const intentMatch = this.detectConversationalIntent(tokens, normQuery, charKnowledge, character);
      if (intentMatch) {
        bestMatch = intentMatch;
      }
    }

    // Return the matched response or fallback
    if (bestMatch && bestMatch.text) {
      return bestMatch.text;
    }

    return this.synthesizeDefaultResponse(charKnowledge, character, 'unknown');
  }

  private findBestCharacterTopicMatch(
    tokens: string[],
    normQuery: string,
    knowledge: CharacterKnowledge,
  ): KnowledgeMatch | null {
    let topMatch: KnowledgeMatch | null = null;
    let highestScore = 0;

    for (const topic of knowledge.topics) {
      const score = this.calculateTopicScore(tokens, normQuery, topic.keywords);
      if (score > highestScore) {
        highestScore = score;
        // Pick template randomly or based on query hash for natural variation
        const template = this.pickTemplate(topic.templates, normQuery);
        topMatch = {
          source: 'character-topic',
          score,
          text: template || topic.facts[0] || '',
          topicId: topic.id,
        };
      }
    }

    return topMatch;
  }

  private findBestWorldTopicMatch(
    tokens: string[],
    normQuery: string,
    characterId: string,
  ): KnowledgeMatch | null {
    let topMatch: KnowledgeMatch | null = null;
    let highestScore = 0;

    for (const world of this.worldKnowledge) {
      for (const topic of world.topics) {
        const score = this.calculateTopicScore(tokens, normQuery, topic.keywords);
        if (score > highestScore) {
          highestScore = score;

          // If character has a specific perspective on this world topic, use it!
          let text = '';
          if (topic.perspectives && topic.perspectives[characterId]) {
            text = topic.perspectives[characterId];
          } else if (topic.facts.length > 0) {
            text = topic.facts[0];
          }

          if (text) {
            topMatch = {
              source: 'world-topic',
              score,
              text,
              topicId: topic.id,
            };
          }
        }
      }
    }

    return topMatch;
  }

  private findLegacyFaqMatch(tokens: string[], normQuery: string): KnowledgeMatch | null {
    if (this.legacyFaqs.length === 0) return null;

    let bestScore = 0;
    let bestAnswer = '';

    for (const item of this.legacyFaqs) {
      const normQ = normalizePersianText(item.question);
      const qTokens = tokenizePersian(item.question);

      let score = 0;
      if (normQuery.includes(normQ) || normQ.includes(normQuery)) {
        score = 8;
      } else {
        const commonTokens = tokens.filter((t) => qTokens.includes(t) && t.length > 2);
        score = commonTokens.length * 2.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAnswer = item.answer;
      }
    }

    if (bestScore >= 3 && bestAnswer) {
      return {
        source: 'legacy-faq',
        score: bestScore,
        text: bestAnswer,
      };
    }

    return null;
  }

  private detectConversationalIntent(
    tokens: string[],
    normQuery: string,
    knowledge: CharacterKnowledge | undefined,
    character: ServerCharacter,
  ): KnowledgeMatch | null {
    // 1. Greeting intent
    const greetingKeywords = ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'شب بخیر', 'چطوری', 'خوبی', 'حالت چطوره', 'سلامت باشی', 'hi', 'hello', 'hey'];
    const isGreeting = greetingKeywords.some((kw) => normQuery.includes(normalizePersianText(kw)));

    if (isGreeting) {
      const response = this.synthesizeDefaultResponse(knowledge, character, 'greeting');
      return {
        source: 'intent',
        score: 4,
        text: response,
      };
    }

    // 2. Inquiry / general question intent
    const questionKeywords = ['چرا', 'چطور', 'چگونه', 'نظرت', 'فکر میکنی', 'دیدگاهت', 'توضیح بده', 'تعریف کن'];
    const isQuestion = questionKeywords.some((kw) => normQuery.includes(normalizePersianText(kw)));

    if (isQuestion) {
      const response = this.synthesizeDefaultResponse(knowledge, character, 'inquiry');
      return {
        source: 'intent',
        score: 3.5,
        text: response,
      };
    }

    return null;
  }

  private calculateTopicScore(tokens: string[], normQuery: string, keywords: string[]): number {
    let score = 0;

    for (const rawKw of keywords) {
      const normKw = normalizePersianText(rawKw);
      if (!normKw) continue;

      // Exact substring match in query
      if (normQuery.includes(normKw)) {
        // Multi-word phrase match is very strong
        score += normKw.includes(' ') ? 8 : 4;
      } else {
        // Token match
        const kwTokens = tokenizePersian(rawKw);
        const matchCount = tokens.filter((t) => kwTokens.includes(t) && t.length > 1).length;
        score += matchCount * 1.5;
      }
    }

    return score;
  }

  private pickTemplate(templates: string[], seed: string): string {
    if (!templates || templates.length === 0) return '';
    // Use character code sum of seed for consistent yet varied template selection
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash + seed.charCodeAt(i)) % templates.length;
    }
    return templates[hash] || templates[0];
  }

  private synthesizeDefaultResponse(
    knowledge: CharacterKnowledge | undefined,
    character: ServerCharacter,
    type: 'greeting' | 'inquiry' | 'unknown',
  ): string {
    // 1. From structured character knowledge if available
    if (knowledge && knowledge.defaultResponses) {
      const list =
        type === 'greeting'
          ? knowledge.defaultResponses.greetings
          : type === 'inquiry'
            ? knowledge.defaultResponses.inquiries
            : knowledge.defaultResponses.unknown;

      if (list && list.length > 0) {
        return list[Math.floor(Math.random() * list.length)];
      }
    }

    // 2. From character.greeting if greeting
    if (type === 'greeting' && character.greeting) {
      return character.greeting;
    }

    // 3. From character system instructions / role if available
    const name = character.displayName || character.name || 'هم‌صحبت';
    if (type === 'greeting') {
      return `سلام! من ${name} هستم. خوشحالم که با هم صحبت می‌کنیم. چطور می‌تونم کمکت کنم؟`;
    }

    if (type === 'inquiry') {
      return `پرسش جالبیه! از دیدگاه من به عنوان ${character.role || name}، باید جوانب مختلف این موضوع رو بررسی کرد. نظرت چیه؟`;
    }

    return `موضوع جالبی رو مطرح کردی! راستش چیز زیادی در این مورد نشنیدم، اما خوشحال میشم بیشتر برام دربارش بگی.`;
  }
}

export const knowledgeEngine = new LocalKnowledgeEngine();

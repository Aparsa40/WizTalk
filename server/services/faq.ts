import type { ServerCharacter } from './characters';
import { searchKnowledge } from './knowledge';

export interface FAQItem {
  question?: string;
  keywords: string[];
  response: string;
  answer?: string;
  category?: string;
}

export async function getFAQs(character?: ServerCharacter): Promise<FAQItem[]> {
  return character?.knowledge.faq.entries ?? [];
}

export async function findLocalAnswer(message: string, character?: ServerCharacter): Promise<string> {
  const normalized = message.toLocaleLowerCase('fa-IR').trim();
  const faqs = await getFAQs(character);
  const match = faqs.find((faq) =>
    (faq.keywords || []).some((keyword) =>
      normalized.includes(keyword.toLocaleLowerCase('fa-IR'))
    )
  );

  if (match) return match.response || match.answer || '';

  if (character) {
    const knowledge = searchKnowledge(character.identity.id, message);
    if (knowledge) {
      return `بر اساس دانشی که برای ${character.identity.displayName} ذخیره شده:\n\n${knowledge}`;
    }
  }

  return '';
}

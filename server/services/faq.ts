import type { ServerCharacter } from './characters';

export interface FAQItem {
  question?: string;
  keywords: string[];
  response: string;
  answer?: string;
  category?: string;
}

/**
 * Offline knowledge is intentionally owned by the selected Character.
 * There is no shared/global FAQ fallback, so Harry can never answer from
 * another Character's local database.
 */
export async function getFAQs(character?: ServerCharacter): Promise<FAQItem[]> {
  return character?.knowledge.faq.entries ?? [];
}

export async function findLocalAnswer(
  message: string,
  character?: ServerCharacter
): Promise<string> {
  const normalized = message.toLocaleLowerCase('fa-IR').trim();
  const faqs = await getFAQs(character);
  const match = faqs.find((faq) =>
    (faq.keywords || []).some((keyword) =>
      normalized.includes(keyword.toLocaleLowerCase('fa-IR'))
    )
  );

  return match?.response || match?.answer || '';
}

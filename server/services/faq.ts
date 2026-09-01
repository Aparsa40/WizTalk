import fs from 'fs/promises';
import path from 'path';

export interface FAQItem { question?: string; keywords: string[]; response: string; answer?: string; category?: string; }

export async function getFAQs(): Promise<FAQItem[]> {
  try {
    const raw = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/faq/faqs.json'), 'utf8')) as unknown;
    if (!Array.isArray(raw)) throw new Error('FAQ data must be an array');
    return raw.filter((item): item is FAQItem => Boolean(item && typeof item === 'object' && typeof (item as FAQItem).response === 'string'));
  } catch (error) {
    console.error('Could not load local FAQ data', error);
    return [];
  }
}

export async function findLocalAnswer(message: string): Promise<string> {
  const normalized = message.toLocaleLowerCase('fa-IR').trim();
  const faqs = await getFAQs();
  const match = faqs.find((faq) => (faq.keywords || []).some((keyword) => normalized.includes(keyword.toLocaleLowerCase('fa-IR'))));
  return match?.response || match?.answer || 'متاسفم، پاسخ مناسبی در دانش محلی پیدا نکردم. می‌شود پرسشت را جور دیگری بگویی؟';
}

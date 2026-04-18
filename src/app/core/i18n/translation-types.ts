export type TranslationDictionary = Record<string, string>;

const MOJIBAKE_PATTERN = /(?:Ã.|Â.|à.|Ø.|Ù.|â.)/;
const BROKEN_TEXT_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]|(?:Ã.|Â.|à.|Ø.|Ù.|â.)/;

function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .normalize('NFC')
    .trim();
}

function normalizeText(value: string): string {
  if (!BROKEN_TEXT_PATTERN.test(value)) {
    return sanitizeText(value);
  }

  try {
    let current = value;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const decoded = new TextDecoder('utf-8').decode(
        Uint8Array.from(current, (char) => char.charCodeAt(0) & 0xff)
      );

      if (!decoded || decoded === current) {
        break;
      }

      current = decoded;

      if (!MOJIBAKE_PATTERN.test(current)) {
        break;
      }
    }

    return sanitizeText(current);
  } catch {
    return sanitizeText(value);
  }
}

export function normalizeTranslationDictionary<T extends TranslationDictionary>(dictionary: T): T {
  return Object.fromEntries(
    Object.entries(dictionary).map(([key, value]) => [key, normalizeText(value)])
  ) as T;
}

export function normalizeTranslationRecord<T extends Record<string, TranslationDictionary>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, dictionary]) => [key, normalizeTranslationDictionary(dictionary)])
  ) as T;
}

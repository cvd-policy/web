import { en } from "./dict/en.js";
import { de } from "./dict/de.js";

export const LANGS = ["en", "de"] as const;
export type Lang = (typeof LANGS)[number];

const DICTS: Record<Lang, Record<string, string>> = { en, de };
const STORAGE_KEY = "cvd-policy.lang";

const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

function initial(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage can be blocked; English is the default anyway.
  }
  return "en";
}

let current = $state<Lang>(initial());

export const i18n = {
  get lang(): Lang {
    return current;
  },
  set(lang: Lang) {
    current = lang;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // A rejected write only costs the preference on the next visit.
    }
  },
};

function fill(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Looks up a key, falling back to English and then to the key itself. */
export function t(key: string, params?: Record<string, string | number>): string {
  return fill(DICTS[current][key] ?? DICTS.en[key] ?? key, params);
}

const PLURAL_RULES: Record<Lang, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  de: new Intl.PluralRules("de"),
};

/**
 * Picks the form that agrees with the count, so nothing reads "1 errors".
 * Expects keys named `<key>_one` and `<key>_other`.
 */
export function plural(key: string, count: number, params?: Record<string, string | number>): string {
  const category = PLURAL_RULES[current].select(count);
  const dict = DICTS[current];
  const template =
    dict[`${key}_${category}`] ??
    dict[`${key}_other`] ??
    DICTS.en[`${key}_${category}`] ??
    DICTS.en[`${key}_other`] ??
    key;
  return fill(template, { n: count, ...params });
}

/** True when a key has plural forms rather than a single text. */
export function hasPlural(key: string): boolean {
  return `${key}_other` in DICTS[current] || `${key}_other` in DICTS.en;
}

/** True when a key exists in either dictionary. */
export function has(key: string): boolean {
  return key in DICTS[current] || key in DICTS.en;
}

/** Formats a date or date-time value for display. */
export function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(current === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

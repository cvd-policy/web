import { defaultAnswers } from "@cvd-policy/core";
import type { WizardAnswers } from "@cvd-policy/core";

const STORAGE_KEY = "cvd-policy.wizard";
const SECURITY_TXT_KEY = "cvd-policy.security-txt";

function load(): WizardAnswers {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultAnswers(), ...(JSON.parse(stored) as WizardAnswers) };
  } catch {
    // A broken or blocked store just means starting from the defaults.
  }
  return defaultAnswers();
}

function loadSecurityTxt(): string {
  try {
    return sessionStorage.getItem(SECURITY_TXT_KEY) ?? "";
  } catch {
    return "";
  }
}

let answers = $state<WizardAnswers>(load());
let securityTxt = $state<string>(loadSecurityTxt());
let mode = $state<"quick" | "full">("quick");

/** Wizard answers, held in this tab only. */
export const wizard = {
  get answers(): WizardAnswers {
    return answers;
  },
  get mode(): "quick" | "full" {
    return mode;
  },
  setMode(next: "quick" | "full") {
    mode = next;
  },
  replace(next: WizardAnswers) {
    answers = next;
  },
  /** The security.txt the organisation already publishes, if one was read in. */
  get securityTxt(): string {
    return securityTxt;
  },
  setSecurityTxt(raw: string) {
    securityTxt = raw;
  },
  save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      if (securityTxt) sessionStorage.setItem(SECURITY_TXT_KEY, securityTxt);
      else sessionStorage.removeItem(SECURITY_TXT_KEY);
    } catch {
      // Nothing to do: the answers stay in memory for this tab.
    }
  },
  clear() {
    answers = defaultAnswers();
    securityTxt = "";
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SECURITY_TXT_KEY);
    } catch {
      // Already gone.
    }
  },
};

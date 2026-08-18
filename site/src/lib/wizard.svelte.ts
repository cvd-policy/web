import { defaultAnswers } from "@cvd-policy/core";
import type { WizardAnswers } from "@cvd-policy/core";

const STORAGE_KEY = "cvd-policy.wizard";

function load(): WizardAnswers {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultAnswers(), ...(JSON.parse(stored) as WizardAnswers) };
  } catch {
    // A broken or blocked store just means starting from the defaults.
  }
  return defaultAnswers();
}

let answers = $state<WizardAnswers>(load());
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
  save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Nothing to do: the answers stay in memory for this tab.
    }
  },
  clear() {
    answers = defaultAnswers();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Already gone.
    }
  },
};

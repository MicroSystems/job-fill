import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  setNativeValue,
  uploadFile,
  FIELD_MAPPINGS,
  resolveProfileValue,
} from "../filler";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Labels to skip — company-specific questions with no profile field. */
const SKIP_LABEL_PATTERNS = [
  /hybrid/i,
  /can you commit/i,
  /awareness of/i,
  /how did you hear/i,
];

/** Try to match a profile value against an option text. */
function optionMatches(optionText: string, value: string): boolean {
  const a = optionText.toLowerCase().trim();
  const b = value.toLowerCase().trim();
  return a === b || a.startsWith(b) || b.startsWith(a) || a.includes(b) || b.includes(a);
}

/** Common gender-option mappings (profile value → likely option text). */
const GENDER_ALIASES: Record<string, string[]> = {
  male: ["man", "male"],
  female: ["woman", "female"],
};

/** Build a list of candidate search strings for a profile key + value. */
function getSearchValues(profileKey: string, value: string): string[] {
  const candidates = [value];
  if (profileKey === "gender") {
    const lower = value.toLowerCase();
    for (const [alias, variations] of Object.entries(GENDER_ALIASES)) {
      if (lower === alias) candidates.push(...variations);
    }
  }
  return candidates;
}

/** Poll for .select__option elements up to `timeout` ms. */
async function waitForOptions(
  timeout: number,
  interval = 200,
): Promise<HTMLElement[]> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const opts = document.querySelectorAll<HTMLElement>(".select__option");
    if (opts.length > 0) return Array.from(opts);
    await delay(interval);
  }
  return [];
}

/** Find an option that matches one of the search values. */
function findMatchingOption(
  options: HTMLElement[],
  searchValues: string[],
): HTMLElement | null {
  for (const sv of searchValues) {
    for (const opt of options) {
      const text = opt.textContent?.trim() || "";
      if (optionMatches(text, sv)) return opt;
    }
  }
  return null;
}

/**
 * Fill a single React-Select combobox by:
 * 1. Typing the value into the search input (triggers async autocomplete)
 * 2. Waiting for the filtered option menu to appear
 * 3. Clicking the matching option via mouseDown
 */
async function fillReactSelect(
  shell: HTMLElement,
  value: string,
  searchValues: string[],
): Promise<boolean> {
  const input = shell.querySelector<HTMLElement>(".select__input");
  const control = shell.querySelector<HTMLElement>(".select__control");
  if (!input || !control) return false;

  // Step 1: Type the value into the search input
  setNativeValue(input, value);
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  await delay(400);

  // Step 2: Wait for the option menu to appear (from typing or async load)
  let options = await waitForOptions(2000, 250);
  if (options.length === 0) {
    // Try opening the menu manually
    control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    options = await waitForOptions(1500, 250);
  }
  if (options.length === 0) return false;

  // Step 3: Find and click the matching option
  const target = findMatchingOption(options, searchValues);
  if (!target) return false;

  // React-Select listens for mousedown on options, not click
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  target.click();
  await delay(250);
  return true;
}

export const mygreenhouseDriver: FillDriver = {
  submitSelector: '#application-form button[type="submit"]',

  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // Give SPA time to fully render
    await delay(1500);

    // ── 1. Standard text inputs ────────────────────────────────────────────
    const textFields: { id: string; key: string }[] = [
      { id: "first_name", key: "name.given" },
      { id: "last_name", key: "name.family" },
      { id: "preferred_name", key: "name.given" },
      { id: "email", key: "email" },
      { id: "question_36029759002", key: "social.linkedin" },
      { id: "question_36029760002", key: "social.portfolio" },
    ];

    for (const f of textFields) {
      const el = document.getElementById(f.id);
      if (!el) continue;
      const val = resolveProfileValue(profileRaw, f.key);
      if (!val) continue;
      setNativeValue(el, val);
      result.filled++;
    }

    // ── 2. Phone number ────────────────────────────────────────────────────
    const phoneEl = document.getElementById("phone") as HTMLInputElement | null;
    if (phoneEl) {
      const phoneVal = resolveProfileValue(profileRaw, "phone.national");
      if (phoneVal) {
        setNativeValue(phoneEl, phoneVal);
        result.filled++;
      }
    }

    // ── 3. React-Select comboboxes ─────────────────────────────────────────
    const selectShells = document.querySelectorAll<HTMLElement>(".select-shell");

    for (const shell of selectShells) {
      const selectInput = shell.querySelector<HTMLElement>(".select__input");
      if (!selectInput || !selectInput.id) continue;

      const label = document.querySelector(`label[for="${selectInput.id}"]`);
      if (!label) continue;
      const labelText = label.textContent?.trim() || "";
      if (!labelText) continue;

      // Skip company-specific questions
      if (SKIP_LABEL_PATTERNS.some((p) => p.test(labelText))) {
        result.skipped++;
        continue;
      }

      // Skip disabled controls
      const control = shell.querySelector<HTMLElement>(".select__control");
      if (!control || control.getAttribute("aria-disabled") === "true") continue;

      // Find matching field mapping by label
      const mapping = FIELD_MAPPINGS.find((m) =>
        m.labelPatterns.some((p) => p.test(labelText)),
      );
      if (!mapping) continue;

      const value = resolveProfileValue(profileRaw, mapping.profileKey);
      if (!value) continue;

      const searchValues = getSearchValues(mapping.profileKey, value);
      const ok = await fillReactSelect(shell, value, searchValues);

      if (ok) {
        result.filled++;
      } else {
        result.errors.push(
          `react-select "${labelText.slice(0, 50)}": no option for "${value}"`,
        );
      }
    }

    // ── 4. File uploads ────────────────────────────────────────────────────
    const resume = profileRaw?.resume;
    if (resume?.data) {
      const resumeInput = document.getElementById("resume") as HTMLInputElement | null;
      if (resumeInput) {
        try {
          uploadFile(resumeInput, resume.data, resume.filename);
          result.filled++;
        } catch (e) {
          result.errors.push(`resume upload: ${(e as Error).message}`);
        }
      }
    }

    return result;
  },
};

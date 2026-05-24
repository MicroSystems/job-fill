import type { FillResponse } from "../types";
import { EEO_FIELD_MAPPINGS } from "../patterns";

// ── Field Mapping ──────────────────────────────────────────────────────────

export interface FieldMapping {
  labelPatterns: RegExp[];
  profileKey: string;
  type?: "text" | "select" | "checkbox" | "radio" | "file" | "textarea";
  /** Custom transform: given the profile object, return the value to fill. */
  transform?: (profile: Record<string, any>) => string;
}

/**
 * Canonical field mappings used by every driver.
 * Order matters: "full name" is checked BEFORE separate first/last so that
 * a single "Full Name" field gets the combined value.
 */
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Name
  {
    labelPatterns: [/full.?name/i, /full.?legal.?name/i, /legal.?name/i, /your.?name/i, /^name$/i],
    profileKey: "name.full",
    transform: (p) => `${p.name.given} ${p.name.family}`.trim(),
  },
  {
    labelPatterns: [/first.?name/i, /given.?name/i, /fname/i],
    profileKey: "name.given",
  },
  {
    labelPatterns: [/last.?name/i, /family.?name/i, /surname/i, /lname/i],
    profileKey: "name.family",
  },
  // Contact
  { labelPatterns: [/email/i, /e[-\s]?mail/i], profileKey: "email" },
  { labelPatterns: [/phone/i, /mobile/i, /telephone/i, /cell/i, /contact.?number/i], profileKey: "phone.national" },
  // Address
  { labelPatterns: [/address/i, /street/i, /^address$/i], profileKey: "address.line1" },
  { labelPatterns: [/city/i, /town/i], profileKey: "address.city" },
  { labelPatterns: [/state/i, /province/i, /region/i], profileKey: "address.state" },
  { labelPatterns: [/zip/i, /postal/i, /post.?code/i, /zip.?code/i], profileKey: "address.zip" },
  { labelPatterns: [/country/i, /nation/i], profileKey: "address.country" },
  // Social
  { labelPatterns: [/linkedin/i, /linked.?in/i], profileKey: "social.linkedin" },
  { labelPatterns: [/github/i], profileKey: "social.github" },
  { labelPatterns: [/portfolio/i, /personal.?website/i, /^website$/i], profileKey: "social.portfolio" },
  { labelPatterns: [/twitter/i, /x\.com/i, /profiletwitter/i], profileKey: "social.twitter" },
  // Pronouns
  { labelPatterns: [/pronoun/i, /they\/them/i], profileKey: "pronouns" },
  // Skills
  { labelPatterns: [/skill/i, /language/i, /languageskills/i], profileKey: "skills" },
  // Work / Experience
  { labelPatterns: [/current.?company/i, /current.?employer/i], profileKey: "currentCompany" },
  { labelPatterns: [/company/i, /employer/i, /organisation/i, /organization/i], profileKey: "experience.0.company" },
  { labelPatterns: [/title/i, /position/i, /job.?title/i], profileKey: "experience.0.title" },
  // Other
  { labelPatterns: [/cover.?letter/i], profileKey: "coverLetter", type: "textarea" },
  { labelPatterns: [/resume/i, /cv/i, /upload.?resume/i], profileKey: "resume", type: "file" },
  { labelPatterns: [/compensation/i, /salary.?expect/i, /desired.?comp/i], profileKey: "desiredCompensation" },
  { labelPatterns: [/current.?location/i, /where.*(you|are).*locat/i], profileKey: "currentLocation" },
  { labelPatterns: [/notice.?period/i, /notice.?duration/i], profileKey: "noticePeriod" },
  // Work Auth & EEO (shared patterns)
  ...EEO_FIELD_MAPPINGS,
];

// ── Profile Resolution ─────────────────────────────────────────────────────

/** Resolve a dot-path value from the profile (e.g. "name.given" → "John"). */
export function resolveProfileValue(profile: Record<string, any>, key: string): string {
  const parts = key.split(".");
  let v: any = profile;
  for (const p of parts) {
    if (v == null) return "";
    if (/^\d+$/.test(p)) {
      v = Array.isArray(v) ? v[parseInt(p)] : undefined;
    } else {
      v = v[p];
    }
  }
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

// ── Label Extraction ───────────────────────────────────────────────────────

/**
 * Extract the label text for an input element using a multi-step fallback chain.
 * Works across all platforms.
 */
export function getLabelText(el: HTMLElement): string {
  // 1) label[for="<id>"]
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() ?? "";
  }
  // 2) parent <label>
  const parent = el.closest("label");
  if (parent) return parent.textContent?.trim() ?? "";
  // 3) placeholder
  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder) return placeholder;
  // 4) aria-label
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  // 5) aria-labelledby (resolve referenced element)
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const ref = document.getElementById(labelledBy);
    if (ref) return ref.textContent?.trim() ?? "";
  }
  // 6) nearest form-group container's label/span
  const container = el.closest('[class*="field"], [class*="form-group"], [class*="input"]');
  if (container) {
    const inner = container.querySelector(
      "label, span[class*='label'], [class*='label'], [class*='question-title'], [class*='field-label']",
    );
    if (inner) return inner.textContent?.trim() ?? "";
  }
  // 7) for radio/checkbox, look for fieldset > legend (the question text)
  if ((el as HTMLInputElement).type === "radio" || (el as HTMLInputElement).type === "checkbox") {
    const fieldset = el.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend) return legend.textContent?.trim() ?? "";
    }
  }
  // 8) name attribute (React/Next.js apps like RecruitCRM)
  const nameAttr = el.getAttribute("name");
  if (nameAttr && nameAttr.length >= 2 && !nameAttr.startsWith("_")) return nameAttr;
  // 9) preceding sibling label (React forms without for/id)
  if (el.previousElementSibling?.matches("label")) {
    return el.previousElementSibling.textContent?.trim() ?? "";
  }
  // 10) walk up to find a container with a label (React forms with nested wrappers)
  let walk = el.parentElement;
  let depth = 0;
  while (walk && walk !== document.body && depth < 5) {
    const nearLabel = walk.querySelector(":scope > label");
    if (nearLabel) return nearLabel.textContent?.trim() ?? "";
    walk = walk.parentElement;
    depth++;
  }
  return "";
}

// ── Input Filling ──────────────────────────────────────────────────────────

export function setNativeValue(element: HTMLElement, value: string): void {
  // contentEditable div — set textContent instead of .value
  if (element.isContentEditable || element.getAttribute("role") === "textbox") {
    element.textContent = value;
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
    return;
  }

  // Standard input/textarea — use native value setter for React detection
  let setter: Function | undefined;
  if (element instanceof HTMLTextAreaElement) {
    setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  } else if (element instanceof HTMLInputElement && element.type !== "file") {
    setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  }
  if (setter) {
    setter.call(element, value);
  } else {
    (element as any).value = value;
  }
  // React listens for InputEvent with inputType, not just generic Event
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

export function selectOption(element: HTMLElement, value: string): void {
  const select = element as HTMLSelectElement;
  for (const opt of select.options) {
    if (opt.value.toLowerCase() === value.toLowerCase() || opt.text.toLowerCase().includes(value.toLowerCase())) {
      select.value = opt.value;
      break;
    }
  }
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

export function setCheckbox(element: HTMLElement, checked: boolean): void {
  const cb = element as HTMLInputElement;
  if (cb.checked !== checked) {
    cb.checked = checked;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

export function uploadFile(element: HTMLElement, fileData: string, filename: string): void {
  const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
  const file = new File([bytes], filename, { type: "application/pdf" });
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = element as HTMLInputElement;
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const w = window as any;
  if (w.jQuery) {
    w.jQuery(input).trigger("change");
  }
}

export function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
}

export function clickElement(el: HTMLElement): void {
  el.scrollIntoView({ behavior: "instant", block: "center" });
  el.click();
}

export function findButton(textPattern: RegExp): HTMLElement | null {
  const buttons = document.querySelectorAll<HTMLElement>(
    "button, input[type=submit], a[role=button], [role=button]",
  );
  for (const btn of buttons) {
    if (textPattern.test(btn.textContent ?? "")) return btn;
  }
  return null;
}

// ── Universal Fill ─────────────────────────────────────────────────────────

/**
 * Fill all matching fields on the page using the shared FIELD_MAPPINGS.
 * This is the baseline fill that every driver should call first.
 *
 * @param profile     The full profile object.
 * @param root        The container to search within (default: document).
 * @param skipKeys    Profile keys to skip (used when a driver handles them differently).
 * @returns           FillResponse with counts.
 */
export function fillAllFields(
  profile: Record<string, any>,
  root: Document | Element = document,
  skipKeys: Set<string> = new Set(),
): FillResponse {
  const result: FillResponse = { filled: 0, skipped: 0, errors: [] };
  const inputs = root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea",
  );

  // Build a quick lookup: input element → matching mapping
  const filledKeys = new Set<string>();

  for (const input of inputs) {
    if (!isVisible(input) || input.disabled) continue;
    if (input.type === "file") continue; // handled separately

    const labelText = getLabelText(input);
    if (!labelText) continue;

    const mapping = FIELD_MAPPINGS.find((m) =>
      m.labelPatterns.some((p) => p.test(labelText)),
    );
    if (!mapping) continue;
    if (skipKeys.has(mapping.profileKey)) continue;
    if (filledKeys.has(mapping.profileKey)) continue; // already filled this field

    // Resolve value
    let value = mapping.transform ? mapping.transform(profile) : resolveProfileValue(profile, mapping.profileKey);
    if (!value) continue;

    fillInputElement(input, value);
    filledKeys.add(mapping.profileKey);
    result.filled++;
  }

  // Also handle contentEditable divs (React frameworks like Chakra UI)
  const editableDivs = root.querySelectorAll<HTMLElement>(
    '[contenteditable="true"]:not([disabled]), [contenteditable=""]:not([disabled])',
  );
  for (const div of editableDivs) {
    if (!isVisible(div)) continue;
    const labelText = getLabelText(div);
    if (!labelText) continue;
    const mapping = FIELD_MAPPINGS.find((m) => m.labelPatterns.some((p) => p.test(labelText)));
    if (!mapping) continue;
    if (skipKeys.has(mapping.profileKey)) continue;
    if (filledKeys.has(mapping.profileKey)) continue;
    const value = mapping.transform
      ? mapping.transform(profile)
      : resolveProfileValue(profile, mapping.profileKey);
    if (!value) continue;
    setNativeValue(div, value);
    filledKeys.add(mapping.profileKey);
    result.filled++;
  }

  return result;
}

function fillInputElement(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): void {
  if (input.tagName === "SELECT") {
    selectOption(input as HTMLSelectElement, value);
  } else if (input.tagName === "TEXTAREA" || input.type === "textarea") {
    setNativeValue(input as HTMLElement, value);
  } else if (input.type === "checkbox" || input.type === "radio") {
    // For checkbox/radio, only check if the value matches the input's value
    if (input.value.toLowerCase() === value.toLowerCase()) {
      setCheckbox(input as HTMLInputElement, true);
    }
  } else {
    setNativeValue(input as HTMLElement, value);
  }
}

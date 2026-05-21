import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  fillAllFields,
  selectOption,
  uploadFile,
  isVisible,
  getLabelText,
  resolveProfileValue,
} from "../filler";

export const ashbyDriver: FillDriver = {
  submitSelector: '[data-test-id*="submit"], [data-test-id*="Submit"], button[type="submit"]',
  nextSelector: '[data-test-id*="next"], [data-test-id*="Next"], [data-test-id*="continue"], [data-test-id*="Continue"]',
  successSelector: '[data-test-id*="success"], [data-test-id*="confirmation"], [class*="success"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // Ashby embed (React SPA) needs time to render
    const FORM_SELECTOR = '[data-test-id="ashby-application-form"], [data-testid="ashby-application-form"], .ashby-application-form, .ashby-application-form-container, #ashby-app-embed';
    let form = document.querySelector<HTMLElement>(FORM_SELECTOR);
    console.log("[ashby] initial form search:", form ? "found" : "not found");
    if (!form) {
      for (let i = 0; i < 16; i++) {
        await new Promise((r) => setTimeout(r, 500));
        form = document.querySelector<HTMLElement>(FORM_SELECTOR);
        if (form) {
          console.log("[ashby] form found after poll", i + 1);
          break;
        }
      }
    }
    if (!form) {
      console.log("[ashby] form NOT found after 8s poll, trying fallback selectors");
      // Fallback 1: any element with ashby-application in its class
      form = document.querySelector<HTMLElement>('[class*="ashby-application"]');
    }
    if (!form) {
      console.log("[ashby] fallback 1 failed, trying document-wide search");
      // Fallback 2: just use document.body
      form = document.body;
    }

    const inputs = form.querySelectorAll("input, select, textarea, [contenteditable]");
    console.log(`[ashby] form found. Inputs inside: ${inputs.length}`);
    for (const inp of inputs) {
      const tag = inp.tagName;
      const type = (inp as HTMLInputElement).type;
      const id = inp.id;
      const placeholder = (inp as HTMLInputElement).placeholder;
      const ariaLabel = inp.getAttribute("aria-label");
      const name = inp.getAttribute("name");
      console.log(`[ashby] input: ${tag} type=${type} id=${id} placeholder=${placeholder} aria-label=${ariaLabel} name=${name} visible=${(inp as HTMLElement).offsetParent !== null}`);
    }

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const baseline = fillAllFields(profileRaw, form);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);
    console.log(`[ashby] fillAllFields result: filled=${baseline.filled} skipped=${baseline.skipped} errors=${JSON.stringify(baseline.errors)}`);

    // ── Ashby-specific overrides ───────────────────────────────────────────

    // Resume upload
    if (profileRaw.resume?.data) {
      const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput && isVisible(fileInput)) {
        try {
          uploadFile(fileInput, profileRaw.resume.data, profileRaw.resume.filename);
          result.filled++;
        } catch (e) {
          result.errors.push(`Resume upload: ${(e as Error).message}`);
        }
      }
    }

    // ── Yes/No button groups (Ashby uses hidden checkbox + visible buttons) ──
    const yesNoFields = [
      // Sponsorship must be checked BEFORE workAuthorization because "visa sponsorship"
      // questions often also contain "work authorization" in their text.
      { pattern: /visa.?sponsor|sponsorship/i, key: "requiredVisaSponsorship" },
      { pattern: /authorized.*work|work.?auth|entitled.*work|eligible.*work|legally.*work|legally.*authoriz/i, key: "workAuthorization" },
      { pattern: /gender/i, key: "gender" },
      { pattern: /race|ethnicity/i, key: "race" },
      { pattern: /veteran/i, key: "veteranStatus" },
      { pattern: /disability/i, key: "disabilityStatus" },
    ];
    console.log("[ashby] searching for yes/no groups");
    const yesNoGroups = form.querySelectorAll<HTMLElement>('[class*="_yesno_"]');
    console.log(`[ashby] found ${yesNoGroups.length} yes/no groups`);
    for (const group of yesNoGroups) {
      const entry = group.closest('[class*="ashby-application-form-field-entry"]');
      if (!entry) {
        console.log("[ashby] yes/no group has no field-entry parent");
        continue;
      }
      const labelEl = entry.querySelector<HTMLElement>('[class*="question-title"], label');
      if (!labelEl) {
        console.log("[ashby] yes/no group has no label element");
        continue;
      }
      const label = labelEl.textContent?.trim() ?? "";
      console.log(`[ashby] yes/no label: "${label}"`);
      if (!label) continue;

      for (const yf of yesNoFields) {
        if (yf.pattern.test(label)) {
          console.log(`[ashby] yes/no matched pattern for key=${yf.key}`);
          let val = resolveProfileValue(profileRaw, yf.key);
          console.log(`[ashby] yes/no resolved value for ${yf.key}: "${val}"`);
          if (!val) {
            console.log(`[ashby] yes/no no value for ${yf.key}, skipping`);
            continue;
          }
          // Handle boolean stored as boolean in profile
          const rawVal = profileRaw[yf.key];
          if (rawVal === true) val = "Yes";
          if (rawVal === false) val = "No";
          console.log(`[ashby] yes/no final value: "${val}"`);
          // Find the matching button and click it
          const buttons = group.querySelectorAll("button");
          console.log(`[ashby] yes/no buttons found: ${buttons.length}`);
          for (const btn of buttons) {
            const btnText = btn.textContent?.trim() ?? "";
            console.log(`[ashby] yes/no button text: "${btnText}"`);
            if (btnText.toLowerCase() === val.toLowerCase()) {
              btn.scrollIntoView({ behavior: "instant", block: "center" });
              btn.click();
              console.log(`[ashby] yes/no clicked: "${btnText}"`);
              result.filled++;
              break;
            }
          }
          break;
        } else {
          console.log(`[ashby] yes/no label "${label}" did not match pattern ${yf.pattern}`);
        }
      }
    }

    // EEO selects (standard <select> dropdowns)
    const selects = form.querySelectorAll<HTMLSelectElement>("select");
    for (const sel of selects) {
      if (!isVisible(sel)) continue;
      const label = getLabelText(sel);
      if (!label) continue;

      const eeoFields = [
        { pattern: /authorized.*work|work.?auth|visa|sponsor/i, key: "workAuthorization" },
        { pattern: /gender/i, key: "gender" },
        { pattern: /race|ethnicity/i, key: "race" },
        { pattern: /veteran/i, key: "veteranStatus" },
        { pattern: /disability/i, key: "disabilityStatus" },
      ];
      for (const eeo of eeoFields) {
        if (eeo.pattern.test(label)) {
          const val = resolveProfileValue(profileRaw, eeo.key);
          if (val) {
            selectOption(sel, val);
            result.filled++;
          }
          break;
        }
      }
    }

    console.log(`[ashby] total filled: ${result.filled}, errors: ${JSON.stringify(result.errors)}`);
    return result;
  },
};

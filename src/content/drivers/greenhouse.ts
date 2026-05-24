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

export const greenhouseDriver: FillDriver = {
  submitSelector: '#greenhouse_form input[type="submit"], button[type="submit"], input[value*="Submit"], input[value*="Apply"]',
  nextSelector: '#greenhouse_form button:not([type="submit"]):not([type="reset"]), .greenhouse-form .next, input[value*="Next"], input[value*="Continue"]',
  successSelector: '.application-confirmation, [class*="success"], [class*="thank"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    const form = document.querySelector("#greenhouse_form, .greenhouse-form");
    if (!form) {
      result.errors.push("Greenhouse form not found");
      return result;
    }

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    // Greenhouse uses label-based matching, so fillAllFields works well here.
    const baseline = fillAllFields(profileRaw, form);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Greenhouse-specific overrides ──────────────────────────────────────

    // Resume upload (file input may not be matched by label)
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

    // EEO selects — Greenhouse often has these in a separate section
    const selects = form.querySelectorAll<HTMLSelectElement>("select");
    for (const sel of selects) {
      if (!isVisible(sel)) continue;
      const label = getLabelText(sel);
      if (!label) continue;

      const eeoFields = [
        { pattern: /work.?auth|visa|sponsor/i, key: "workAuthorization" },
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

    return result;
  },
};

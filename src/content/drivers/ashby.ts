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

    const form = document.querySelector(
      '[data-test-id="ashby-application-form"], .ashby-application-form',
    );
    if (!form) {
      result.errors.push("Ashby form not found");
      return result;
    }

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const baseline = fillAllFields(profileRaw, form);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

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

    // EEO selects
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

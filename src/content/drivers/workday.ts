import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  fillAllFields,
  setNativeValue,
  selectOption,
  isVisible,
  resolveProfileValue,
  uploadFile,
} from "../filler";

export const workdayDriver: FillDriver = {
  submitSelector: '[data-automation-id*="submit"], [data-automation-id*="Submit"], button[type="submit"]',
  nextSelector: '[data-automation-id*="next"], [data-automation-id*="Next"], [data-automation-id*="continue"], [data-automation-id*="Continue"]',
  reviewSelector: '[data-automation-id*="review"], [data-automation-id*="Review"]',
  successSelector: '[data-automation-id*="success"], [data-automation-id*="confirmation"], [class*="success"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // Workday is a React SPA — wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    // Skip keys that Workday handles via data-automation-id selectors
    const wdKeys = new Set([
      "name.given", "name.family", "name.full",
      "email", "phone.national",
      "address.line1", "address.city", "address.state", "address.zip", "address.country",
      "social.linkedin",
      "workAuthorization",
      "gender", "race", "veteranStatus", "disabilityStatus",
    ]);
    const baseline = fillAllFields(profileRaw, document, wdKeys);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Workday-specific: data-automation-id based fields ──────────────────

    function findWdField(attrPattern: string): HTMLElement | null {
      return document.querySelector<HTMLElement>(
        `[data-automation-id*="${attrPattern}"], [data-automation-label*="${attrPattern}"]`,
      );
    }

    function fillIfFound(attrPattern: string, value: string): boolean {
      const el = findWdField(attrPattern);
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, value);
        } else {
          setNativeValue(el, value);
        }
        return true;
      }
      return false;
    }

    const fields: [string, string][] = [
      ["first", "name.given"],
      ["givenName", "name.given"],
      ["last", "name.family"],
      ["familyName", "name.family"],
      ["email", "email"],
      ["phone", "phone.national"],
      ["address", "address.line1"],
      ["street", "address.line1"],
      ["city", "address.city"],
      ["state", "address.state"],
      ["province", "address.state"],
      ["region", "address.state"],
      ["zip", "address.zip"],
      ["postal", "address.zip"],
      ["country", "address.country"],
      ["linkedin", "social.linkedin"],
      ["work", "workAuthorization"],
      ["authoriz", "workAuthorization"],
      ["visa", "visa"],
      ["sponsor", "requiredVisaSponsorship"],
      ["gender", "gender"],
      ["race", "race"],
      ["ethnicity", "race"],
      ["disability", "disabilityStatus"],
      ["veteran", "veteranStatus"],
      ["compensation", "desiredCompensation"],
      ["salary", "desiredCompensation"],
      ["location", "currentLocation"],
      ["notice", "noticePeriod"],
    ];

    const filledAttrs = new Set<string>();
    for (const [attr, key] of fields) {
      if (filledAttrs.has(key)) continue;
      const value = resolveProfileValue(profileRaw, key);
      if (!value) continue;
      if (fillIfFound(attr, value)) {
        filledAttrs.add(key);
        result.filled++;
      }
    }

    // ── Resume upload ──────────────────────────────────────────────────────
    if (profileRaw.resume?.data) {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"], [data-automation-id*="resume"], [data-automation-id*="file"]',
      );
      if (fileInput && isVisible(fileInput)) {
        try {
          uploadFile(fileInput, profileRaw.resume.data, profileRaw.resume.filename);
          result.filled++;
        } catch (e) {
          result.errors.push(`Resume upload: ${(e as Error).message}`);
        }
      }
    }

    return result;
  },
};

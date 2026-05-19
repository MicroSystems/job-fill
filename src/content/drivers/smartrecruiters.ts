import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  fillAllFields,
  uploadFile,
  isVisible,
} from "../filler";

export const smartrecruitersDriver: FillDriver = {
  submitSelector: 'button[type="submit"], input[type="submit"], [data-sr-apply-form] button[type="submit"]',
  nextSelector: 'button:not([type="submit"]):not([type="reset"]), input[value*="Next"], input[value*="Continue"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const baseline = fillAllFields(profileRaw);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Resume upload ──────────────────────────────────────────────────────
    if (profileRaw.resume?.data) {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
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

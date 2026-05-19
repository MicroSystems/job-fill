import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  findField,
  setNativeValue,
  selectOption,
  setCheckbox,
  uploadFile,
  isVisible,
  getLabelTextForElement,
} from "../filler";

function getValue(profile: Record<string, any>, key: string): string | undefined {
  const parts = key.split(".");
  let val: any = profile;
  for (const part of parts) {
    if (val == null) return undefined;
    if (/^\d+$/.test(part)) {
      const idx = parseInt(part);
      val = Array.isArray(val) ? val[idx] : undefined;
    } else {
      val = val[part];
    }
  }
  return val != null ? String(val) : undefined;
}

export const smartrecruitersDriver: FillDriver = {
  submitSelector: 'button[type="submit"], input[type="submit"], [data-sr-apply-form] button[type="submit"]',
  nextSelector: 'button:not([type="submit"]):not([type="reset"]), input[value*="Next"], input[value*="Continue"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    const nameGiven = getValue(profile, "name.given");
    const nameFamily = getValue(profile, "name.family");
    if (nameGiven || nameFamily) {
      const firstInput = findField(/first.?name|given.?name/i, "input");
      if (firstInput && isVisible(firstInput) && nameGiven) {
        setNativeValue(firstInput, nameGiven);
        result.filled++;
      }
      const lastInput = findField(/last.?name|family.?name|surname/i, "input");
      if (lastInput && isVisible(lastInput) && nameFamily) {
        setNativeValue(lastInput, nameFamily);
        result.filled++;
      }
    }

    const emailVal = getValue(profile, "email");
    if (emailVal) {
      const el = findField(/email/i, "input");
      if (el && isVisible(el)) {
        setNativeValue(el, emailVal);
        result.filled++;
      }
    }

    const phoneVal = getValue(profile, "phone.national");
    if (phoneVal) {
      const el = findField(/phone|mobile|telephone/i, "input");
      if (el && isVisible(el)) {
        setNativeValue(el, phoneVal);
        result.filled++;
      }
    }

    const linkedinVal = getValue(profile, "social.linkedin");
    if (linkedinVal) {
      const el = findField(/linkedin/i, "input");
      if (el && isVisible(el)) {
        setNativeValue(el, linkedinVal);
        result.filled++;
      }
    }

    const coverLetterVal = getValue(profile, "coverLetter");
    if (coverLetterVal) {
      const el = findField(/cover.?letter/i, "textarea");
      if (el && isVisible(el)) {
        setNativeValue(el, coverLetterVal);
        result.filled++;
      }
    }

    if (profileRaw.resume?.data) {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"], [data-sr-apply-form] input[type="file"]',
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

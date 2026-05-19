import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  setNativeValue,
  selectOption,
  uploadFile,
  isVisible,
} from "../filler";

function findFieldWithAttr(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

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

export const leverDriver: FillDriver = {
  submitSelector: '[data-qa*="submit"], [data-qa*="Submit"], button[type="submit"]',
  nextSelector: '[data-qa*="next"], [data-qa*="Next"], [data-qa*="continue"], [data-qa*="Continue"]',
  successSelector: '[class*="success"], [class*="confirmation"], [class*="thank"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    const nameGiven = getValue(profile, "name.given");
    const nameFamily = getValue(profile, "name.family");
    if (nameGiven) {
      const el = findFieldWithAttr('[data-qa="name-input"], [name="name"], [id*="name"]');
      if (el) {
        setNativeValue(el, `${nameGiven} ${nameFamily ?? ""}`.trim());
        result.filled++;
      }
    }

    const emailVal = getValue(profile, "email");
    if (emailVal) {
      const el = findFieldWithAttr('[data-qa="email-input"], [name="email"], [id*="email"]');
      if (el) {
        setNativeValue(el, emailVal);
        result.filled++;
      }
    }

    const phoneVal = getValue(profile, "phone.national");
    if (phoneVal) {
      const el = findFieldWithAttr('[data-qa="phone-input"], [name="phone"], [id*="phone"]');
      if (el) {
        setNativeValue(el, phoneVal);
        result.filled++;
      }
    }

    const linkedinVal = getValue(profile, "social.linkedin");
    if (linkedinVal) {
      const el = findFieldWithAttr('[data-qa="linkedin-input"], [name*="linkedin"], [id*="linkedin"]');
      if (el) {
        setNativeValue(el, linkedinVal);
        result.filled++;
      }
    }

    const portfolioVal = getValue(profile, "social.portfolio");
    if (portfolioVal) {
      const el = findFieldWithAttr('[data-qa="website-input"], [name*="website"], [id*="portfolio"]');
      if (el) {
        setNativeValue(el, portfolioVal);
        result.filled++;
      }
    }

    if (profileRaw.resume?.data) {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"], [data-qa="resume-input"]',
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

    const coverLetterVal = getValue(profile, "coverLetter");
    if (coverLetterVal) {
      const el = findFieldWithAttr(
        '[data-qa="cover-letter-input"], textarea[name*="cover"], textarea[id*="cover"]',
      );
      if (el) {
        setNativeValue(el, coverLetterVal);
        result.filled++;
      }
    }

    const selects = document.querySelectorAll<HTMLSelectElement>(
      'select[data-qa], select[name]',
    );
    for (const sel of selects) {
      if (!isVisible(sel)) continue;
      const name = (sel.name ?? sel.id).toLowerCase();
      if (/gender/i.test(name) && getValue(profile, "gender")) {
        selectOption(sel, getValue(profile, "gender")!);
        result.filled++;
      }
      if (/race|ethnicity/i.test(name) && getValue(profile, "race")) {
        selectOption(sel, getValue(profile, "race")!);
        result.filled++;
      }
      if (/veteran/i.test(name) && getValue(profile, "veteranStatus")) {
        selectOption(sel, getValue(profile, "veteranStatus")!);
        result.filled++;
      }
      if (/disability/i.test(name) && getValue(profile, "disabilityStatus")) {
        selectOption(sel, getValue(profile, "disabilityStatus")!);
        result.filled++;
      }
    }

    return result;
  },
};

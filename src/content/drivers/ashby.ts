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

    const nameGiven = getValue(profile, "name.given");
    const nameFamily = getValue(profile, "name.family");
    if (nameGiven || nameFamily) {
      const fullNameInput = findField(/full name|your name|^name$/i, "input");
      if (fullNameInput && isVisible(fullNameInput)) {
        setNativeValue(fullNameInput, `${nameGiven ?? ""} ${nameFamily ?? ""}`.trim());
        result.filled++;
      } else {
        const firstInput = findField(/first name|given name/i, "input");
        if (firstInput && isVisible(firstInput) && nameGiven) {
          setNativeValue(firstInput, nameGiven);
          result.filled++;
        }
        const lastInput = findField(/last name|family name|surname/i, "input");
        if (lastInput && isVisible(lastInput) && nameFamily) {
          setNativeValue(lastInput, nameFamily);
          result.filled++;
        }
      }
    }

    const emailVal = getValue(profile, "email");
    if (emailVal) {
      const el = findField(/email|e.?mail/i, "input");
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

    const portfolioVal = getValue(profile, "social.portfolio");
    if (portfolioVal) {
      const el = findField(/portfolio|website|personal website/i, "input");
      if (el && isVisible(el)) {
        setNativeValue(el, portfolioVal);
        result.filled++;
      }
    }

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

    const coverLetterVal = getValue(profile, "coverLetter");
    if (coverLetterVal) {
      const el = findField(/cover letter/i, "textarea");
      if (el && isVisible(el)) {
        setNativeValue(el, coverLetterVal);
        result.filled++;
      }
    }

    const selects = form.querySelectorAll<HTMLSelectElement>("select");
    for (const sel of selects) {
      if (!isVisible(sel)) continue;
      const label = getLabelTextForElement(sel);
      if (/work auth|visa|sponsor/i.test(label) && getValue(profile, "workAuthorization")) {
        selectOption(sel, getValue(profile, "workAuthorization")!);
        result.filled++;
      }
      if (/gender/i.test(label) && getValue(profile, "gender")) {
        selectOption(sel, getValue(profile, "gender")!);
        result.filled++;
      }
      if (/race|ethnicity/i.test(label) && getValue(profile, "race")) {
        selectOption(sel, getValue(profile, "race")!);
        result.filled++;
      }
      if (/veteran/i.test(label) && getValue(profile, "veteranStatus")) {
        selectOption(sel, getValue(profile, "veteranStatus")!);
        result.filled++;
      }
      if (/disability/i.test(label) && getValue(profile, "disabilityStatus")) {
        selectOption(sel, getValue(profile, "disabilityStatus")!);
        result.filled++;
      }
    }

    return result;
  },
};

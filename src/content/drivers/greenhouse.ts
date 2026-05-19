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

    const nameVal = getValue(profile, "name.given");
    const familyVal = getValue(profile, "name.family");
    if (nameVal || familyVal) {
      const nameInput = findField(/first.?name|given.?name/i, "input");
      if (nameInput && isVisible(nameInput) && nameVal) {
        setNativeValue(nameInput, nameVal);
        result.filled++;
      }
      const lastInput = findField(/last.?name|family.?name|surname/i, "input");
      if (lastInput && isVisible(lastInput) && familyVal) {
        setNativeValue(lastInput, familyVal);
        result.filled++;
      }
    }

    const emailVal = getValue(profile, "email");
    if (emailVal) {
      const emailInput = findField(/email/i, "input");
      if (emailInput && isVisible(emailInput)) {
        setNativeValue(emailInput, emailVal);
        result.filled++;
      }
    }

    const phoneVal = getValue(profile, "phone.national");
    if (phoneVal) {
      const phoneInput = findField(/phone|mobile|telephone/i, "input");
      if (phoneInput && isVisible(phoneInput)) {
        setNativeValue(phoneInput, phoneVal);
        result.filled++;
      }
    }

    const linkedinVal = getValue(profile, "social.linkedin");
    if (linkedinVal) {
      const liInput = findField(/linkedin/i, "input");
      if (liInput && isVisible(liInput)) {
        setNativeValue(liInput, linkedinVal);
        result.filled++;
      }
    }

    const portfolioVal = getValue(profile, "social.portfolio");
    if (portfolioVal) {
      const ptInput = findField(/portfolio|website/i, "input");
      if (ptInput && isVisible(ptInput)) {
        setNativeValue(ptInput, portfolioVal);
        result.filled++;
      }
    }

    const coverLetterVal = getValue(profile, "coverLetter");
    if (coverLetterVal) {
      const clInput = findField(/cover.?letter/i, "textarea");
      if (clInput && isVisible(clInput)) {
        setNativeValue(clInput, coverLetterVal);
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

    const selects = form.querySelectorAll<HTMLSelectElement>("select");
    for (const sel of selects) {
      if (!isVisible(sel)) continue;
      const label = getLabelTextForElement(sel);
      if (
        /work.?auth|visa|sponsor/i.test(label) &&
        getValue(profile, "workAuthorization")
      ) {
        selectOption(sel, getValue(profile, "workAuthorization")!);
        result.filled++;
      }
      if (
        /gender/i.test(label) &&
        getValue(profile, "gender")
      ) {
        selectOption(sel, getValue(profile, "gender")!);
        result.filled++;
      }
      if (
        /race|ethnicity/i.test(label) &&
        getValue(profile, "race")
      ) {
        selectOption(sel, getValue(profile, "race")!);
        result.filled++;
      }
      if (
        /veteran/i.test(label) &&
        getValue(profile, "veteranStatus")
      ) {
        selectOption(sel, getValue(profile, "veteranStatus")!);
        result.filled++;
      }
      if (
        /disability/i.test(label) &&
        getValue(profile, "disabilityStatus")
      ) {
        selectOption(sel, getValue(profile, "disabilityStatus")!);
        result.filled++;
      }
    }

    return result;
  },
};

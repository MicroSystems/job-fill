import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import { setNativeValue, selectOption, setCheckbox, isVisible } from "../filler";

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

export const workdayDriver: FillDriver = {
  submitSelector: '[data-automation-id*="submit"], [data-automation-id*="Submit"], button[type="submit"]',
  nextSelector: '[data-automation-id*="next"], [data-automation-id*="Next"], [data-automation-id*="continue"], [data-automation-id*="Continue"]',
  reviewSelector: '[data-automation-id*="review"], [data-automation-id*="Review"]',
  successSelector: '[data-automation-id*="success"], [data-automation-id*="confirmation"], [class*="success"]',
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    const wdSelectors = <T extends HTMLElement>(
      attr: string,
      tag = "*",
    ): NodeListOf<T> => {
      return document.querySelectorAll<T>(`${tag}[data-automation-id${attr ? '*="' + attr + '"' : ""}]`);
    };

    function findWdField(attrPattern: string): HTMLElement | null {
      return document.querySelector<HTMLElement>(
        `[data-automation-id*="${attrPattern}"], [data-automation-label*="${attrPattern}"]`,
      );
    }

    const nameGiven = getValue(profile, "name.given");
    const nameFamily = getValue(profile, "name.family");
    if (nameGiven) {
      const el = findWdField("first") ?? findWdField("givenName");
      if (el && isVisible(el)) {
        setNativeValue(el, nameGiven);
        result.filled++;
      }
    }
    if (nameFamily) {
      const el = findWdField("last") ?? findWdField("familyName");
      if (el && isVisible(el)) {
        setNativeValue(el, nameFamily);
        result.filled++;
      }
    }

    const emailVal = getValue(profile, "email");
    if (emailVal) {
      const el = findWdField("email");
      if (el && isVisible(el)) {
        setNativeValue(el, emailVal);
        result.filled++;
      }
    }

    const phoneVal = getValue(profile, "phone.national");
    if (phoneVal) {
      const el = findWdField("phone");
      if (el && isVisible(el)) {
        setNativeValue(el, phoneVal);
        result.filled++;
      }
    }

    const addressLine1 = getValue(profile, "address.line1");
    if (addressLine1) {
      const el = findWdField("address") ?? findWdField("street");
      if (el && isVisible(el)) {
        setNativeValue(el, addressLine1);
        result.filled++;
      }
    }

    const city = getValue(profile, "address.city");
    if (city) {
      const el = findWdField("city");
      if (el && isVisible(el)) {
        setNativeValue(el, city);
        result.filled++;
      }
    }

    const state = getValue(profile, "address.state");
    if (state) {
      const el = findWdField("state") ?? findWdField("province") ?? findWdField("region");
      if (el && isVisible(el)) {
        setNativeValue(el, state);
        result.filled++;
      }
    }

    const zip = getValue(profile, "address.zip");
    if (zip) {
      const el = findWdField("zip") ?? findWdField("postal");
      if (el && isVisible(el)) {
        setNativeValue(el, zip);
        result.filled++;
      }
    }

    const country = getValue(profile, "address.country");
    if (country) {
      const el = findWdField("country");
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, country);
        } else {
          setNativeValue(el, country);
        }
        result.filled++;
      }
    }

    const linkedinVal = getValue(profile, "social.linkedin");
    if (linkedinVal) {
      const el = findWdField("linkedin");
      if (el && isVisible(el)) {
        setNativeValue(el, linkedinVal);
        result.filled++;
      }
    }

    if (profileRaw.resume?.data) {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"], [data-automation-id*="resume"], [data-automation-id*="file"]',
      );
      if (fileInput && isVisible(fileInput)) {
        try {
          const bytes = Uint8Array.from(atob(profileRaw.resume.data), (c) => c.charCodeAt(0));
          const file = new File([bytes], profileRaw.resume.filename, { type: "application/pdf" });
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event("change", { bubbles: true }));
          result.filled++;
        } catch (e) {
          result.errors.push(`Resume upload: ${(e as Error).message}`);
        }
      }
    }

    const workAuth = getValue(profile, "workAuthorization");
    if (workAuth) {
      const el = findWdField("work") ?? findWdField("authoriz") ?? findWdField("visa");
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, workAuth);
        } else {
          setNativeValue(el, workAuth);
        }
        result.filled++;
      }
    }

    const genderVal = getValue(profile, "gender");
    if (genderVal) {
      const el = findWdField("gender");
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, genderVal);
        } else {
          setNativeValue(el, genderVal);
        }
        result.filled++;
      }
    }

    const raceVal = getValue(profile, "race");
    if (raceVal) {
      const el = findWdField("race") ?? findWdField("ethnicity");
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, raceVal);
        } else {
          setNativeValue(el, raceVal);
        }
        result.filled++;
      }
    }

    const disabilityVal = getValue(profile, "disabilityStatus");
    if (disabilityVal) {
      const el = findWdField("disability") ?? findWdField("veteran");
      if (el && isVisible(el)) {
        const tag = el.tagName.toLowerCase();
        if (tag === "select") {
          selectOption(el, disabilityVal);
        } else {
          setNativeValue(el, disabilityVal);
        }
        result.filled++;
      }
    }

    return result;
  },
};

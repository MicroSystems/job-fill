import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  findAllInputs,
  findField,
  setNativeValue,
  selectOption,
  setCheckbox,
  isVisible,
  getLabelTextForElement,
} from "../filler";

interface FieldHint {
  patterns: RegExp[];
  profileKey: string;
}

const FIELD_HINTS: FieldHint[] = [
  { patterns: [/first\s*name/i, /given\s*name/i, /fname/i], profileKey: "name.given" },
  { patterns: [/last\s*name/i, /family\s*name/i, /surname/i, /lname/i], profileKey: "name.family" },
  { patterns: [/full\s*name/i, /your\s*name/i, /^name$/i], profileKey: "name.given" },
  { patterns: [/email/i, /e-mail/i, /e?mail\s*address/i], profileKey: "email" },
  { patterns: [/phone/i, /mobile/i, /telephone/i, /cell/i, /contact\s*number/i], profileKey: "phone.national" },
  { patterns: [/address/i, /street/i, /^address$/i], profileKey: "address.line1" },
  { patterns: [/city/i, /town/i], profileKey: "address.city" },
  { patterns: [/state/i, /province/i, /region/i], profileKey: "address.state" },
  { patterns: [/zip/i, /postal/i, /post\s*code/i, /zip\s*code/i], profileKey: "address.zip" },
  { patterns: [/country/i, /nation/i], profileKey: "address.country" },
  { patterns: [/linkedin/i, /linked\s*in/i], profileKey: "social.linkedin" },
  { patterns: [/portfolio/i, /website/i, /personal\s*website/i], profileKey: "social.portfolio" },
  { patterns: [/github/i], profileKey: "social.github" },
  { patterns: [/headline/i, /title/i, /current\s*(job|position|title)/i], profileKey: "experience.0.title" },
  { patterns: [/company/i, /employer/i, /current\s*employer/i, /organization/i], profileKey: "experience.0.company" },
  { patterns: [/school/i, /university/i, /college/i, /institution/i, /alma\s*mater/i], profileKey: "education.0.school" },
  { patterns: [/degree/i, /qualification/i], profileKey: "education.0.degree" },
  { patterns: [/field\s*of\s*study/i, /major/i, /discipline/i], profileKey: "education.0.field" },
  { patterns: [/graduation/i, /grad\s*year/i, /graduation\s*date/i, /year\s*of\s*graduation/i], profileKey: "education.0.graduation" },
  { patterns: [/cover\s*letter/i, /coverletter/i], profileKey: "coverLetter" },
  { patterns: [/skills/i, /technologies/i, /tech\s*stack/i], profileKey: "skills" },
  { patterns: [/work\s*auth/i, /visa/i, /sponsorship/i, /sponsor/i], profileKey: "workAuthorization" },
  { patterns: [/race/i, /ethnicity/i], profileKey: "race" },
  { patterns: [/veteran/i, /military/i, /disabled\s*veteran/i], profileKey: "veteranStatus" },
  { patterns: [/disability/i, /disabled/i], profileKey: "disabilityStatus" },
  { patterns: [/gender/i, /sex/i], profileKey: "gender" },
  { patterns: [/linkedin/i], profileKey: "social.linkedin" },
  { patterns: [/how did you hear/i, /referral source/i, /source/i], profileKey: "answers.source" },
];

function getValue(profile: Record<string, any>, key: string): string | undefined {
  const parts = key.split(".");
  let val: any = profile;
  for (const part of parts) {
    if (val == null) return undefined;
    if (/^\d+$/.test(part)) {
      const idx = parseInt(part);
      val = Array.isArray(val) ? val[idx] : undefined;
    } else if (typeof val === "object") {
      val = val[part];
    } else {
      return undefined;
    }
  }
  return val != null ? String(val) : undefined;
}

function fillTextInput(el: HTMLElement, value: string): void {
  if (value == null) return;
  const tag = el.tagName.toLowerCase();
  if (tag === "select") {
    selectOption(el, value);
  } else if (tag === "input" && (el as HTMLInputElement).type === "checkbox") {
    setCheckbox(el, value === "true" || value === "yes");
  } else if (tag === "input" && (el as HTMLInputElement).type === "radio") {
    const radio = el as HTMLInputElement;
    if (radio.value?.toLowerCase() === value.toLowerCase()) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } else {
    if (tag === "textarea" && value.length > 0) {
      setNativeValue(el, value);
    } else {
      setNativeValue(el, value);
    }
  }
}

export const genericDriver: FillDriver = {
  async fill(profile: Record<string, any>, _profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };
    const allInputs = findAllInputs();

    for (const inp of allInputs) {
      if (!isVisible(inp)) continue;
      const labelText = getLabelTextForElement(inp);
      if (!labelText) continue;

      const matchedHint = FIELD_HINTS.find((h) =>
        h.patterns.some((p) => p.test(labelText)),
      );
      if (!matchedHint) continue;

      const value = getValue(profile, matchedHint.profileKey);
      if (value == null || value === "") {
        result.skipped++;
        continue;
      }

      try {
        fillTextInput(inp, value);
        result.filled++;
      } catch (e) {
        result.errors.push(`${labelText}: ${(e as Error).message}`);
      }
    }

    return result;
  },
};

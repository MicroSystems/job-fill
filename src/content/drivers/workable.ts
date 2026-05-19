import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import { setNativeValue, selectOption, setCheckbox, uploadFile } from "../filler";

const FIELD_MAP: [RegExp, string][] = [
  [/first.?name|given.?name|fname/i, "name.given"],
  [/last.?name|family.?name|surname|lname/i, "name.family"],
  [/full.?name|your.?name/i, "name.given"],
  [/email|e[-\s]?mail/i, "email"],
  [/phone|mobile|telephone|cell|contact/i, "phone.national"],
  [/address|street/i, "address.line1"],
  [/city|town/i, "address.city"],
  [/state|province|region/i, "address.state"],
  [/zip|postal|post.?code|zip.?code/i, "address.zip"],
  [/country|nation/i, "address.country"],
  [/linkedin|linked\s*in/i, "social.linkedin"],
  [/portfolio|website|personal.*site/i, "social.portfolio"],
  [/github/i, "social.github"],
  [/headline|title|current.*(job|position|title)/i, "experience.0.title"],
  [/company|employer|organization/i, "experience.0.company"],
  [/school|university|college|institution|alma.?mater/i, "education.0.school"],
  [/degree|qualification/i, "education.0.degree"],
  [/field.*study|major|discipline/i, "education.0.field"],
  [/grad.*(year|date)|graduation/i, "education.0.graduation"],
  [/cover.?letter|coverletter/i, "coverLetter"],
  [/skills|technologies/i, "skills"],
  [/choose.?file/i, "resume"],
  [/import.?resume/i, "resume"],
  [/upload.?resume/i, "resume"],
  [/attach.?resume/i, "resume"],
  [/cv/i, "resume"],
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

function fillInput(el: HTMLElement, value: string): void {
  if (value == null) return;
  const tag = el.tagName.toLowerCase();
  if (tag === "select") {
    selectOption(el, value);
  } else if (tag === "input" && (el as HTMLInputElement).type === "checkbox") {
    setCheckbox(el, value === "true" || value === "yes");
  } else {
    setNativeValue(el, value);
  }
}

function getLabelForInput(inp: HTMLElement): string {
  const id = inp.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || "";
  }
  const parent = inp.closest("label");
  if (parent) return parent.textContent?.trim() || "";
  const aria = inp.getAttribute("aria-label");
  if (aria) return aria;
  const placeholder = (inp as HTMLInputElement).placeholder || "";
  if (placeholder) return placeholder;
  const name = inp.getAttribute("name");
  if (name) return name;
  const ariaLabelledBy = inp.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref) return ref.textContent?.trim() || "";
  }
  const closest = inp.closest('[class*="field"], [class*="form-group"], [class*="input"]');
  if (closest) {
    const lbl = closest.querySelector("label, span, [class*=\"label\"]");
    if (lbl) return lbl.textContent?.trim() || "";
  }
  return "";
}

export const workableDriver: FillDriver = {
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const formRoot = document.querySelector("#app, main, form, [class*=\"application\"]");
    if (!formRoot) {
      result.errors.push("Workable form container not found");
      return result;
    }

    const allInputs = formRoot.querySelectorAll<HTMLElement>(
      "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
    );

    const used = new Set<HTMLElement>();

    for (const inp of allInputs) {
      if (used.has(inp)) continue;

      const labelText = getLabelForInput(inp);
      if (!labelText) continue;

      const match = FIELD_MAP.find(([re]) => re.test(labelText));
      if (!match) continue;

      if (match[1] === "resume") {
        const resume = profile?.resume;
        if (resume?.data) {
          try {
            uploadFile(inp, resume.data, resume.filename);
            used.add(inp);
            result.filled++;
          } catch (e) {
            result.errors.push(`resume: ${(e as Error).message}`);
          }
        } else {
          result.skipped++;
        }
        continue;
      }

      const value = getValue(profile, match[1]);
      if (value == null || value === "") {
        result.skipped++;
        continue;
      }

      try {
        fillInput(inp, value);
        used.add(inp);
        result.filled++;
      } catch (e) {
        result.errors.push(`${labelText}: ${(e as Error).message}`);
      }
    }

    const fileInputs = document.querySelectorAll<HTMLInputElement>(
      "input[type=file]:not([disabled])"
    );
    for (const fi of fileInputs) {
      if (used.has(fi)) continue;
      const resume = profile?.resume;
      if (resume?.data) {
        try {
          uploadFile(fi, resume.data, resume.filename);
          used.add(fi);
          result.filled++;
        } catch (e) {
          result.errors.push(`file upload: ${(e as Error).message}`);
        }
      }
    }

    if (result.filled === 0 && result.errors.length === 0) {
      result.errors.push(
        `Found ${allInputs.length} inputs in form, but none matched profile fields. Labels found: ${Array.from(allInputs).map((i) => getLabelForInput(i)).filter(Boolean).join(", ") || "none"}`
      );
    }

    return result;
  },
};

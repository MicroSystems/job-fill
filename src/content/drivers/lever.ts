import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  fillAllFields,
  setNativeValue,
  setCheckbox,
  uploadFile,
  isVisible,
  resolveProfileValue,
  selectOption,
} from "../filler";

function qs<T extends HTMLElement = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}

function getVal(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let v: any = obj;
  for (const p of parts) {
    if (v == null) return undefined;
    if (/^\d+$/.test(p)) {
      v = Array.isArray(v) ? v[parseInt(p)] : undefined;
    } else {
      v = v[p];
    }
  }
  return v != null ? String(v) : undefined;
}

export const leverDriver: FillDriver = {
  submitSelector:
    '[data-qa*="submit"], [data-qa*="Submit"], button[type="submit"]',
  nextSelector:
    '[data-qa*="next"], [data-qa*="Next"], [data-qa*="continue"], [data-qa*="Continue"]',
  successSelector: '[class*="success"], [class*="confirmation"], [class*="thank"]',
  async fill(
    profile: Record<string, any>,
    profileRaw: any,
  ): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };
    const p = profileRaw ?? profile;

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    // Skip keys that Lever handles via its own selectors (data-qa, name attrs)
    const leverKeys = new Set([
      "name.given", "name.family", "name.full",
      "email", "phone.national",
      "social.linkedin", "social.github", "social.portfolio", "social.twitter",
      "coverLetter", "resume",
      "desiredCompensation", "workAuthorization",
      "gender", "race", "veteranStatus", "disabilityStatus",
    ]);
    const baseline = fillAllFields(p, document, leverKeys);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Lever-specific field fills (data-qa / name selectors) ──────────────

    // name
    const given = getVal(p, "name.given");
    const family = getVal(p, "name.family");
    if (given) {
      const el =
        qs('[data-qa="name-input"]') ??
        qs('[name="name"]') ??
        qs('[id*="name"]');
      if (el) {
        setNativeValue(el, `${given} ${family ?? ""}`.trim());
        result.filled++;
      }
    }

    // email
    const email = getVal(p, "email");
    if (email) {
      const el =
        qs('[data-qa="email-input"]') ??
        qs('[name="email"]') ??
        qs('[id*="email"]');
      if (el) {
        setNativeValue(el, email);
        result.filled++;
      }
    }

    // phone
    const phone = getVal(p, "phone.national");
    if (phone) {
      const el =
        qs('[data-qa="phone-input"]') ??
        qs('[name="phone"]') ??
        qs('[id*="phone"]');
      if (el) {
        setNativeValue(el, phone);
        result.filled++;
      }
    }

    // current company (org)
    const company = getVal(p, "experience.0.company");
    if (company) {
      const el =
        qs('[data-qa="org-input"]') ??
        qs('[name="org"]') ??
        qs('[id*="org"]');
      if (el) {
        setNativeValue(el, company);
        result.filled++;
      }
    }

    // location (city + state)
    const city = getVal(p, "address.city");
    const state = getVal(p, "address.state");
    if (city) {
      const val = state ? `${city}, ${state}` : city;
      const el =
        qs('[data-qa="location-input"]') ??
        qs('[name="location"]') ??
        qs('[id*="location"]');
      if (el) {
        setNativeValue(el, val);
        result.filled++;
      }
    }

    // url fields
    const urlFields: Record<string, string> = {
      LinkedIn: "social.linkedin",
      GitHub: "social.github",
      Portfolio: "social.portfolio",
      Twitter: "social.twitter",
    };
    for (const [site, path] of Object.entries(urlFields)) {
      const val = getVal(p, path);
      if (val) {
        const el =
          qs(`[name="urls[${site}]"]`) ?? qs(`[data-qa="${site.toLowerCase()}-input"]`);
        if (el) {
          setNativeValue(el, val);
          result.filled++;
        }
      }
    }

    // cover letter
    const cover = getVal(p, "coverLetter");
    if (cover) {
      const el =
        qs('[data-qa="cover-letter-input"]') ??
        qs('textarea[name*="cover"]') ??
        qs('textarea[id*="cover"]');
      if (el) {
        setNativeValue(el, cover);
        result.filled++;
      }
    }

    // resume (file input is opacity:0, not display:none; skip visibility check)
    if (p.resume?.data) {
      const fileInput =
        qs<HTMLInputElement>('#resume-upload-input') ??
        qs<HTMLInputElement>('[data-qa="input-resume"]') ??
        qs<HTMLInputElement>('input[type="file"][name="resume"]') ??
        qs<HTMLInputElement>('input[type="file"]');
      if (fileInput) {
        try {
          uploadFile(fileInput, p.resume.data, p.resume.filename);
          result.filled++;
        } catch (e) {
          result.errors.push(`Resume: ${(e as Error).message}`);
        }
      } else {
        result.errors.push("Resume: no file input found");
      }
    }

    // timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzEl = qs<HTMLInputElement>('[name="timezone"], #applicant-timezone');
    if (tzEl) {
      setNativeValue(tzEl, tz);
      result.filled++;
    }

    // ── Custom question cards (text + checkbox/radio) ──────────────────────

    function getQuestionText(el: HTMLElement): string {
      const q = el.closest(".application-question");
      if (q) {
        const labelDiv = q.querySelector(".application-label > .text");
        if (labelDiv) return labelDiv.textContent?.trim() ?? "";
        const anyLabel = q.querySelector(".application-label");
        if (anyLabel) return anyLabel.textContent?.trim() ?? "";
        return q.textContent?.trim() ?? "";
      }
      const d = el.closest("[data-name*=surveysResponses]");
      if (d) {
        const labelDiv = d.querySelector(".application-label > .text");
        if (labelDiv) return labelDiv.textContent?.trim() ?? "";
        return d.textContent?.trim() ?? "";
      }
      const c = el.closest(".card-field") ?? el.closest("[class*=question]");
      if (c) return c.textContent?.trim() ?? "";
      return "";
    }

    // detect question text from an input — tries DOM first, then falls back to
    // grouping sibling options so we can identify EEO surveys by their values
    function qTextWithFallback(inp: HTMLInputElement): string {
      const fromDom = getQuestionText(inp);
      if (fromDom) return fromDom;

      const container =
        inp.closest(".application-question") ??
        inp.closest("[data-name*=surveysResponses]") ??
        inp.closest("li");
      if (!container) return "";

      const allValues = [
        ...container.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"], input[type="radio"]',
        ),
      ].map((i) => i.value);

      const joined = allValues.join("|");
      if (/Female|Male|Non-binary/i.test(joined)) return "gender";
      if (/Caucasian|Hispanic|African American|Asian.*Pacific/i.test(joined))
        return "race / ethnicity";
      if (/veteran/i.test(joined)) return "veteran";
      if (/disabilit/i.test(joined)) return "disability";
      return "";
    }

    // text cards
    const textCards = document.querySelectorAll<HTMLInputElement>(
      'input.card-field-input[type="text"]:not([disabled]), input[type="text"][name^="cards["]:not([disabled])',
    );
    for (const inp of textCards) {
      if (inp.value) continue;
      const qText = getQuestionText(inp).toLowerCase();
      const answers = p.answers ?? {};
      let val = answers[inp.name];
      if (!val) {
        for (const [k, v] of Object.entries(answers)) {
          if (qText.includes(k.toLowerCase()) || k.toLowerCase().includes(qText)) {
            val = v as string;
            break;
          }
        }
      }
      // compensation expectations — use profile.desiredCompensation
      if (!val && /compensation|salary|expect/i.test(qText)) {
        val = getVal(p, "desiredCompensation");
      }
      // current location
      if (!val && /where.*(you|are).*locat|current.*locat/i.test(qText)) {
        val = getVal(p, "currentLocation");
      }
      // notice period
      if (!val && /notice.?period|notice.?duration/i.test(qText)) {
        val = getVal(p, "noticePeriod");
      }
      if (val) {
        setNativeValue(inp, val as string);
        result.filled++;
      }
    }

    // checkbox / radio cards (demographics, work auth, custom yes/no)
    const answeredEEO = new Set<string>();
    const choiceCards = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:not([disabled]), input[type="radio"]:not([disabled])',
    );
    for (const inp of choiceCards) {
      if (inp.checked) continue;
      const hiddenParent = inp.closest('[style*="display:none"]') ?? inp.closest('[style*="visibility:hidden"]');
      if (hiddenParent) continue;
      const questionText = qTextWithFallback(inp).toLowerCase().trim();
      if (!questionText) continue;

      const answers = p.answers ?? {};
      let matched = false;

      // 1) try matching against p.answers
      for (const [k, v] of Object.entries(answers)) {
        if (questionText.includes(k.toLowerCase())) {
          const target = String(v).toLowerCase();
          if (inp.value.toLowerCase() === target) {
            setCheckbox(inp, true);
            matched = true;
            break;
          }
        }
      }
      if (matched) { result.filled++; continue; }

      // 2) work authorization
      const workAuth = p.workAuthorization;
      if (/legally entitled|legally.*authorized|authoriz.*work|work.*(authoriz|permit|visa)|eligible.*work/i.test(questionText)) {
        const target = workAuth?.toLowerCase().trim();
        if (target) {
          if (inp.value.toLowerCase() === target) {
            setCheckbox(inp, true);
            result.filled++;
            continue;
          }
          continue; // explicitly set but value doesn't match this option — skip
        }
        // not set in profile → auto-yes
        if (inp.value?.toLowerCase() === "yes") {
          setCheckbox(inp, true);
          result.filled++;
          continue;
        }
      }

      // 3) visa sponsorship
      const needsVisa = p.requiredVisaSponsorship;
      if (/sponsor|visa.*(require|need)/i.test(questionText)) {
        const target = needsVisa !== undefined ? (needsVisa ? "yes" : "no") : "no";
        if (inp.value.toLowerCase() === target) {
          setCheckbox(inp, true);
          result.filled++;
          continue;
        }
      }

      // 4) common gender/race/veteran/disability EEO questions
      const eeoSections = [
        { pattern: /gender|sex/i, key: "gender" },
        { pattern: /race|ethnicity/i, key: "race" },
        { pattern: /veteran/i, key: "veteranStatus" },
        { pattern: /disability/i, key: "disabilityStatus" },
      ];
      for (const eeo of eeoSections) {
        if (eeo.pattern.test(questionText)) {
          if (answeredEEO.has(eeo.key)) break;
          const val = getVal(p, eeo.key);
          if (val && inp.value.toLowerCase() === val.toLowerCase()) {
            setCheckbox(inp, true);
            result.filled++;
            matched = true;
            answeredEEO.add(eeo.key);
            break;
          }
        }
      }
      if (matched) continue;

      // EEO fallback — no profile match → pick "Choose not to Answer"
      for (const eeo of eeoSections) {
        if (eeo.pattern.test(questionText)) {
          if (answeredEEO.has(eeo.key)) break;
          if (/choose not|prefer not/i.test(inp.value)) {
            setCheckbox(inp, true);
            result.filled++;
            matched = true;
            answeredEEO.add(eeo.key);
            break;
          }
        }
      }
      if (matched) continue;

      // 5) auto-yes for confirm/agree/certify
      if (/confirm|agree|certify|understand/i.test(questionText) && inp.value?.toLowerCase() === "yes") {
        setCheckbox(inp, true);
        result.filled++;
      }
    }

    // EEO selects (gender, race, veteran, disability)
    const eeoSelects = document.querySelectorAll<HTMLSelectElement>(
      'select:not([disabled])',
    );
    for (const sel of eeoSelects) {
      if (!isVisible(sel)) continue;
      const qText = getQuestionText(sel).toLowerCase();
      const eeoSections = [
        { pattern: /gender|sex/i, key: "gender" },
        { pattern: /race|ethnicity/i, key: "race" },
        { pattern: /veteran/i, key: "veteranStatus" },
        { pattern: /disability/i, key: "disabilityStatus" },
      ];
      for (const eeo of eeoSections) {
        if (eeo.pattern.test(qText)) {
          const val = getVal(p, eeo.key);
          if (val) {
            for (const opt of sel.options) {
              if (opt.text.toLowerCase() === val.toLowerCase()) {
                sel.value = opt.value;
                sel.dispatchEvent(new Event("change", { bubbles: true }));
                result.filled++;
                break;
              }
            }
          }
          // no profile match → pick "Choose not to Answer" / "Prefer not to say"
          if (!result.filled) {
            for (const opt of sel.options) {
              if (/choose not|prefer not/i.test(opt.text)) {
                sel.value = opt.value;
                sel.dispatchEvent(new Event("change", { bubbles: true }));
                result.filled++;
                break;
              }
            }
          }
          break;
        }
      }
    }

    // location select
    const locSelect = qs<HTMLSelectElement>(
      '[data-qa="opportunity-location-select"], select[name="opportunityLocationId"]',
    );
    if (locSelect && isVisible(locSelect)) {
      if (city) {
        for (const opt of locSelect.options) {
          if (opt.text.toLowerCase().includes(city.toLowerCase())) {
            locSelect.value = opt.value;
            locSelect.dispatchEvent(new Event("change", { bubbles: true }));
            result.filled++;
            break;
          }
        }
      }
    }

    if (result.filled === 0 && result.errors.length === 0) {
      result.errors.push(
        "Found Lever form but no fields could be matched",
      );
    }

    return result;
  },
};

import type { FillResponse } from "../../types";
import type { FillDriver } from "../driver";
import {
  fillAllFields,
  uploadFile,
  getLabelText,
  FIELD_MAPPINGS,
  resolveProfileValue,
  setNativeValue,
  selectOption,
  isVisible,
} from "../filler";

export const ripplingDriver: FillDriver = {
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // Rippling is a Next.js SPA — wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const baseline = fillAllFields(profileRaw, document);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Custom combobox dropdowns (work auth, sponsorship, etc.) ───────────
    const comboboxes = document.querySelectorAll<HTMLElement>(
      'div[role="combobox"]:not([aria-disabled="true"])',
    );
    for (const combo of comboboxes) {
      // Find the question text from the container structure
      const questionText = getQuestionForCombobox(combo);
      if (!questionText) continue;

      const mapping = FIELD_MAPPINGS.find((m) =>
        m.labelPatterns.some((p) => p.test(questionText)),
      );
      if (!mapping) continue;

      let value = resolveProfileValue(profileRaw, mapping.profileKey);
      if (!value) continue;

      // Open the dropdown
      combo.click();
      await new Promise((r) => setTimeout(r, 400));

      // Try to find the option by role="option"
      const options = document.querySelectorAll<HTMLElement>('[role="option"]');
      let matched = false;
      for (const opt of options) {
        const optText = opt.textContent?.trim() ?? "";
        if (
          optText.toLowerCase() === value.toLowerCase() ||
          optText.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(optText.toLowerCase())
        ) {
          opt.click();
          matched = true;
          await new Promise((r) => setTimeout(r, 200));
          break;
        }
      }

      if (matched) {
        result.filled++;
      } else {
        result.errors.push(`combobox "${questionText}": no option matched "${value}"`);
      }
    }

    // ── Handle remaining <select> fields ───────────────────────────────────
    const selects = document.querySelectorAll<HTMLSelectElement>(
      'select:not([disabled])',
    );
    for (const sel of selects) {
      if (sel.options.length <= 1) continue;
      const labelText = getLabelText(sel) || "";
      if (!labelText) continue;
      const mapping = FIELD_MAPPINGS.find((m) =>
        m.labelPatterns.some((p) => p.test(labelText)),
      );
      if (!mapping) continue;
      const value = resolveProfileValue(profileRaw, mapping.profileKey);
      if (!value) continue;
      for (const opt of sel.options) {
        if (
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.text.toLowerCase().includes(value.toLowerCase())
        ) {
          selectOption(sel, opt.value);
          result.filled++;
          break;
        }
      }
    }

    // ── Resume upload ──────────────────────────────────────────────────────
    const resume = profileRaw?.resume;
    if (resume?.data) {
      const fileInputs = document.querySelectorAll<HTMLInputElement>(
        'input[type="file"]:not([disabled])',
      );
      for (const fi of fileInputs) {
        const labelText = (getLabelText(fi) || "").toLowerCase();
        if (/resume|cv/i.test(labelText)) {
          try {
            uploadFile(fi, resume.data, resume.filename);
            result.filled++;
          } catch (e) {
            result.errors.push(`resume upload: ${(e as Error).message}`);
          }
        }
      }
      // Fallback: upload to first file input
      const firstFile = document.querySelector<HTMLInputElement>(
        'input[type="file"]:not([disabled])',
      );
      if (firstFile && !result.errors.some((e) => e.startsWith("resume"))) {
        try {
          uploadFile(firstFile, resume.data, resume.filename);
          result.filled++;
        } catch (e) {
          result.errors.push(`fallback upload: ${(e as Error).message}`);
        }
      }
    }

    return result;
  },
};

/** Extract the question text for a Rippling custom combobox. */
function getQuestionForCombobox(combo: HTMLElement): string {
  // Structure: div.marginY--36 > div.paddingX--16 > div:first-child > p (question text)
  // The combobox is in div.marginY--36 > div[data-testid="field"]
  const outer = combo.closest<HTMLElement>('[class*="marginY--"]');
  if (!outer) return "";
  const questionSection = outer.querySelector<HTMLElement>('[class*="paddingX--"]');
  if (!questionSection) return "";
  const p = questionSection.querySelector("p");
  return p?.textContent?.trim() ?? "";
}

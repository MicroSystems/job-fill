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
  setCheckbox,
  isVisible,
} from "../filler";

export const workableDriver: FillDriver = {
  async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
    const result: FillResponse = { filled: 0, skipped: 0, errors: [] };

    // Workable is a React SPA — wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const formRoot = document.querySelector("#app, main, form, [class*=\"application\"]");
    if (!formRoot) {
      result.errors.push("Workable form container not found");
      return result;
    }

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const baseline = fillAllFields(profileRaw, formRoot);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Workable-specific: resume file inputs ──────────────────────────────
    const used = new Set<HTMLElement>();
    const allInputs = formRoot.querySelectorAll<HTMLElement>(
      "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
    );
    for (const inp of allInputs) used.add(inp);

    // Resume via label match (choose file, upload resume, etc.)
    const resumeMappings = FIELD_MAPPINGS.filter((m) => m.profileKey === "resume");
    for (const inp of formRoot.querySelectorAll<HTMLElement>("input[type=file]:not([disabled])")) {
      if (used.has(inp)) continue;
      const labelText = getLabelText(inp);
      if (!labelText) continue;
      const isResume = resumeMappings.some((m) => m.labelPatterns.some((p) => p.test(labelText)));
      if (!isResume) continue;

      const resume = profileRaw?.resume;
      if (resume?.data) {
        try {
          uploadFile(inp, resume.data, resume.filename);
          used.add(inp);
          result.filled++;
        } catch (e) {
          result.errors.push(`resume: ${(e as Error).message}`);
        }
      }
    }

    // Fallback: any remaining file input
    for (const fi of document.querySelectorAll<HTMLInputElement>("input[type=file]:not([disabled])")) {
      if (used.has(fi)) continue;
      const resume = profileRaw?.resume;
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
        `Found ${allInputs.length} inputs in form, but none matched profile fields.`
      );
    }

    return result;
  },
};

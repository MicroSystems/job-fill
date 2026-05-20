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

    const formRoot =
      document.querySelector("#app, main, form, [class*=\"application\"], [class*=\"apply\"]") ??
      document.querySelector('[class*="job-application"]');

    // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
    const root = formRoot ?? document;
    const baseline = fillAllFields(profileRaw, root);
    result.filled += baseline.filled;
    result.skipped += baseline.skipped;
    result.errors.push(...baseline.errors);

    // ── Workable-specific: resume file inputs ──────────────────────────────
    const used = new Set<HTMLElement>();

    // Resume via label match (choose file, upload resume, etc.)
    const resumeMappings = FIELD_MAPPINGS.filter((m) => m.profileKey === "resume");
    for (const inp of root.querySelectorAll<HTMLElement>("input[type=file]:not([disabled])")) {
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

    // Fallback: any remaining file input on the page
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

    return result;
  },
};

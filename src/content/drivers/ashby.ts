import type {FillResponse} from "../../types";
import type {FillDriver} from "../driver";
import {
    fillAllFields,
    selectOption,
    uploadFile,
    isVisible,
    getLabelText,
    resolveProfileValue,
} from "../filler";
import {YESNO_PATTERNS, EEO_SELECT_PATTERNS} from "../../patterns";

export const ashbyDriver: FillDriver = {
    submitSelector: '[data-test-id*="submit"], [data-test-id*="Submit"], button[type="submit"]',
    nextSelector: '[data-test-id*="next"], [data-test-id*="Next"], [data-test-id*="continue"], [data-test-id*="Continue"]',
    successSelector: '[data-test-id*="success"], [data-test-id*="confirmation"], [class*="success"]',
    async fill(profile: Record<string, any>, profileRaw: any): Promise<FillResponse> {
        const result: FillResponse = {filled: 0, skipped: 0, errors: []};

        // Ashby embed (React SPA) needs time to render
        const FORM_SELECTOR = '[data-test-id="ashby-application-form"], [data-testid="ashby-application-form"], .ashby-application-form, .ashby-application-form-container, #ashby-app-embed';
        let form = document.querySelector<HTMLElement>(FORM_SELECTOR);
        if (!form) {
            for (let i = 0; i < 16; i++) {
                await new Promise((r) => setTimeout(r, 500));
                form = document.querySelector<HTMLElement>(FORM_SELECTOR);
                if (form) break;
            }
        }
        if (!form) {
            form = document.querySelector<HTMLElement>('[class*="ashby-application"]');
        }
        if (!form) {
            form = document.body;
        }

        // ── Baseline fill using shared FIELD_MAPPINGS ──────────────────────────
        const baseline = fillAllFields(profileRaw, form);
        result.filled += baseline.filled;
        result.skipped += baseline.skipped;
        result.errors.push(...baseline.errors);

        // ── Ashby-specific overrides ───────────────────────────────────────────

        // Resume upload
        if (profileRaw.resume?.data) {
            const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
            if (fileInput && isVisible(fileInput)) {
                try {
                    uploadFile(fileInput, profileRaw.resume.data, profileRaw.resume.filename);
                    result.filled++;
                } catch (e) {
                    result.errors.push(`Resume upload: ${(e as Error).message}`);
                }
            }
        }

        // ── Yes/No button groups (Ashby uses hidden checkbox + visible buttons) ──
        const yesNoFields = YESNO_PATTERNS;
        const yesNoGroups = form.querySelectorAll<HTMLElement>('[class*="_yesno_"]');
        for (const group of yesNoGroups) {
            const entry = group.closest('[class*="ashby-application-form-field-entry"]');
            if (!entry) continue;
            const labelEl = entry.querySelector<HTMLElement>('[class*="question-title"], label');
            if (!labelEl) continue;
            const label = labelEl.textContent?.trim() ?? "";
            if (!label) continue;

            for (const yf of yesNoFields) {
                if (yf.pattern.test(label)) {
                    let val = resolveProfileValue(profileRaw, yf.key);
                    if (!val) continue;
                    const rawVal = profileRaw[yf.key];
                    if (rawVal === true) val = "Yes";
                    if (rawVal === false) val = "No";
                    const buttons = group.querySelectorAll("button");
                    for (const btn of buttons) {
                        if (btn.textContent?.trim().toLowerCase() === val.toLowerCase()) {
                            btn.scrollIntoView({behavior: "instant", block: "center"});
                            btn.click();
                            result.filled++;
                            break;
                        }
                    }
                    break;
                }
            }
        }

        // EEO selects (standard <select> dropdowns)
        const selects = form.querySelectorAll<HTMLSelectElement>("select");
        for (const sel of selects) {
            if (!isVisible(sel)) continue;
            const label = getLabelText(sel);
            if (!label) continue;

            const eeoFields = EEO_SELECT_PATTERNS;
            for (const eeo of eeoFields) {
                if (eeo.pattern.test(label)) {
                    const val = resolveProfileValue(profileRaw, eeo.key);
                    if (val) {
                        selectOption(sel, val);
                        result.filled++;
                    }
                    break;
                }
            }
        }

        return result;
    },
};

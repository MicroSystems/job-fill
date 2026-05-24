import type { FillResponse, SubmitResponse } from "../types";
import { fill } from "./driver";
import { generateAnswerForQuestion } from "./ai";
import { getConfig, getProfile, isJobApplied } from "../storage";
import { clickElement, isVisible, findButton, getLabelText } from "./filler";

interface ButtonFinder {
  next: RegExp[];
  submit: RegExp[];
  review: RegExp[];
  confirm: RegExp[];
}

const BUTTON_PATTERNS: ButtonFinder = {
  next: [
    /next/i,
    /continue/i,
    /proceed/i,
    /forward/i,
  ],
  submit: [
    /submit/i,
    /apply/i,
    /send/i,
    /finish/i,
    /complete/i,
  ],
  review: [
    /review/i,
    /preview/i,
  ],
  confirm: [
    /confirm/i,
    /yes/i,
    /submit/i,
  ],
};

function findActionableButton(patterns: RegExp[]): HTMLElement | null {
  for (const pattern of patterns) {
    const btn = findButton(pattern);
    if (btn && isVisible(btn)) return btn;
  }

  for (const pattern of patterns) {
    const btns = document.querySelectorAll<HTMLElement>(
      "button, input[type=submit], input[type=button], [role=button], a.btn, a.button",
    );
    for (const btn of btns) {
      if (!isVisible(btn)) continue;
      const text = (btn.textContent ?? "").trim().toLowerCase();
      const value = (btn as HTMLInputElement).value?.toLowerCase() ?? "";
      const aria = btn.getAttribute("aria-label")?.toLowerCase() ?? "";
      if (pattern.test(text) || pattern.test(value) || pattern.test(aria)) return btn;
    }
  }
  return null;
}

function findNextButton(): HTMLElement | null {
  return findActionableButton(BUTTON_PATTERNS.next);
}

function findSubmitButton(): HTMLElement | null {
  return findActionableButton(BUTTON_PATTERNS.submit);
}

function findReviewButton(): HTMLElement | null {
  return findActionableButton(BUTTON_PATTERNS.review);
}

function hasVisibleFormFields(): boolean {
  const inputs = document.querySelectorAll<HTMLElement>(
    "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea",
  );
  for (const inp of inputs) {
    if (isVisible(inp) && inp.offsetParent !== null) return true;
  }
  return false;
}

function detectConfirmation(): string | null {
  const successTexts = [
    /application submitted/i,
    /thank you/i,
    /application received/i,
    /your application has been/i,
    /successfully submitted/i,
    /we have received your application/i,
    /thanks for applying/i,
  ];
  const body = document.body.textContent ?? "";
  for (const pattern of successTexts) {
    if (pattern.test(body)) {
      const match = body.match(pattern);
      return match ? match[0] : "Application submitted";
    }
  }

  const successEls = document.querySelectorAll(
    '[class*="success"], [class*="confirmation"], [class*="thank"], [role="alert"][class*="success"], .application-confirmation',
  );
  for (const el of successEls) {
    if (isVisible(el as HTMLElement)) {
      return el.textContent?.slice(0, 200) ?? "Application submitted";
    }
  }

  return null;
}

async function waitForNewFields(
  previousFieldCount: number,
  timeoutMs = 8000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const currentCount = document.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea",
    ).length;
    if (currentCount !== previousFieldCount) return true;
    await sleep(500);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleCustomQuestions(
  profile: Record<string, any>,
): Promise<void> {
  const config = await getConfig();
  if (!config.aiAnswerCustomQuestions) return;

  const inputs = document.querySelectorAll<HTMLElement>(
    "input[type=text]:not([type=hidden]), textarea, select",
  );
  for (const inp of inputs) {
    if (!isVisible(inp) || inp.offsetParent === null) continue;
    if ((inp as HTMLInputElement).value) continue;
    if (inp.hasAttribute("data-jobfill-filled")) continue;

    const labelText = getLabelText(inp);
    if (!labelText) continue;
    if (isProfileFieldLabel(labelText)) continue;

    const tag = inp.tagName.toLowerCase();
    const fieldType =
      tag === "select" ? "dropdown" :
      tag === "textarea" ? "textarea" :
      (inp as HTMLInputElement).type;

    try {
      const answer = await generateAnswerForQuestion(labelText, fieldType);
      if (answer) {
        if (tag === "select") {
          const select = inp as HTMLSelectElement;
          for (const opt of select.options) {
            if (
              opt.text.toLowerCase().includes(answer.toLowerCase()) ||
              opt.value.toLowerCase() === answer.toLowerCase()
            ) {
              select.value = opt.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
              inp.setAttribute("data-jobfill-filled", "true");
              break;
            }
          }
        } else {
          const tag = inp.tagName;
          const proto = tag === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (nativeSetter) {
            nativeSetter.call(inp, answer);
          } else {
            (inp as HTMLInputElement).value = answer;
          }
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          inp.setAttribute("data-jobfill-filled", "true");
        }
      }
    } catch {
      // skip on error
    }
  }
}


const profileFieldLabels = new Set([
  "first name", "last name", "given name", "family name", "surname",
  "email", "phone", "mobile", "telephone",
  "address", "street", "city", "state", "province", "zip", "postal", "country",
  "linkedin", "portfolio", "website", "github",
  "resume", "cv", "cover letter",
  "school", "university", "college", "degree", "graduation",
  "company", "employer", "title", "position",
]);

function isProfileFieldLabel(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keyword of profileFieldLabels) {
    if (lower.includes(keyword)) return true;
  }
  return false;
}

export async function autoApply(
  platform: string,
  profile: Record<string, any>,
  profileRaw: any,
): Promise<{ fill: FillResponse; submit?: SubmitResponse }> {
  const config = await getConfig();
  const fillResult = await fill(platform, profile, profileRaw);

  await handleCustomQuestions(profile);

  const submitResult: SubmitResponse = {
    submitted: false,
    steps: 0,
    errors: [],
  };

  let step = 0;
  const maxSteps = config.autoApplyMaxSteps || 10;

  while (step < maxSteps) {
    const fieldCount = document.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea",
    ).length;

    const reviewBtn = findReviewButton();
    const submitBtn = findSubmitButton();
    const nextBtn = findNextButton();

    if (submitBtn && !nextBtn) {
      clickElement(submitBtn);
      submitResult.steps = step + 1;

      await sleep(3000);

      const confirmBtn = findActionableButton(BUTTON_PATTERNS.confirm);
      if (confirmBtn && isVisible(confirmBtn)) {
        clickElement(confirmBtn);
      }

      await sleep(2000);

      const confirmation = detectConfirmation();
      if (confirmation) {
        submitResult.submitted = true;
        submitResult.confirmationText = confirmation;
      }
      break;
    }

    if (reviewBtn) {
      clickElement(reviewBtn);
      submitResult.steps = step + 1;
      await sleep(2000);
      step++;
      continue;
    }

    if (nextBtn) {
      clickElement(nextBtn);
      submitResult.steps = step + 1;

      const fieldsChanged = await waitForNewFields(fieldCount, 8000);
      if (fieldsChanged) {
        const stepResult = await fill(platform, profile, profileRaw);
        fillResult.filled += stepResult.filled;
        fillResult.skipped += stepResult.skipped;
        fillResult.errors.push(...stepResult.errors);

        await handleCustomQuestions(profile);
      }
      step++;
      continue;
    }

    break;
  }

  return { fill: fillResult, submit: submitResult };
}

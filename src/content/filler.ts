export function findField(labelPattern: RegExp, tagName = "input"): HTMLElement | null {
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    if (labelPattern.test(label.textContent ?? "")) {
      const forId = label.getAttribute("for");
      if (forId) {
        const el = document.getElementById(forId);
        if (el && el.matches(tagName)) return el as HTMLElement;
      }
      const inner = label.querySelector(tagName);
      if (inner) return inner as HTMLElement;
    }
  }
  const inputs = document.querySelectorAll<HTMLElement>(tagName);
  for (const inp of inputs) {
    const placeholder = (inp as HTMLInputElement).placeholder ?? "";
    const ariaLabel = inp.getAttribute("aria-label") ?? "";
    if (labelPattern.test(placeholder) || labelPattern.test(ariaLabel)) return inp;
  }
  return null;
}

export function findFields(labelPattern: RegExp, tagName = "input"): HTMLElement[] {
  const results: HTMLElement[] = [];
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    if (labelPattern.test(label.textContent ?? "")) {
      const forId = label.getAttribute("for");
      if (forId) {
        const el = document.getElementById(forId);
        if (el && el.matches(tagName)) results.push(el as HTMLElement);
      }
      const inner = label.querySelectorAll(tagName);
      inner.forEach((el) => results.push(el as HTMLElement));
    }
  }
  return results;
}

export function findBySelector(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function setNativeValue(element: HTMLElement, value: string): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    (element as HTMLInputElement).value = value;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

export function selectOption(element: HTMLElement, value: string): void {
  const select = element as HTMLSelectElement;
  for (const opt of select.options) {
    if (
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.text.toLowerCase().includes(value.toLowerCase())
    ) {
      select.value = opt.value;
      break;
    }
  }
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

export function setCheckbox(element: HTMLElement, checked: boolean): void {
  const cb = element as HTMLInputElement;
  if (cb.checked !== checked) {
    cb.checked = checked;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

export function uploadFile(element: HTMLElement, fileData: string, filename: string): void {
  const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
  const file = new File([bytes], filename, { type: "application/pdf" });
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = element as HTMLInputElement;
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  // also trigger via jQuery if the page uses it (Lever, Greenhouse, etc.)
  const w = window as any;
  if (w.jQuery) {
    w.jQuery(input).trigger("change");
  }
}

export function findButton(textPattern: RegExp): HTMLElement | null {
  const buttons = document.querySelectorAll<HTMLElement>(
    "button, input[type=submit], a[role=button], [role=button]",
  );
  for (const btn of buttons) {
    if (textPattern.test(btn.textContent ?? "")) return btn;
  }
  return null;
}

export function isVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
}

export function findVisibleField(labelPattern: RegExp, tagName = "input"): HTMLElement | null {
  const el = findField(labelPattern, tagName);
  if (el && isVisible(el)) return el;
  if (el && !el.closest('[style*="display: none"], [style*="visibility: hidden"]')) return el;
  return null;
}

export function clickElement(el: HTMLElement): void {
  el.scrollIntoView({ behavior: "instant", block: "center" });
  el.click();
}

export function findAllInputs(): NodeListOf<HTMLInputElement> {
  return document.querySelectorAll<HTMLInputElement>(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])",
  );
}

export function findFirstQuestionField(): [HTMLElement, string] | null {
  const inputs = findAllInputs();
  for (const inp of inputs) {
    if (inp.offsetParent === null) continue;
    if (
      inp.type === "text" ||
      inp.type === "textarea" ||
      inp.tagName === "TEXTAREA"
    ) {
      const labelText = getLabelText(inp);
      if (labelText && !isProfileField(labelText)) {
        return [inp, labelText];
      }
    }
  }
  const textareas = document.querySelectorAll<HTMLTextAreaElement>("textarea");
  for (const ta of textareas) {
    if (ta.offsetParent === null) continue;
    const labelText = getLabelText(ta);
    if (labelText && !isProfileField(labelText)) {
      return [ta, labelText];
    }
  }
  return null;
}

function getLabelText(el: HTMLElement): string {
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() ?? "";
  }
  const parent = el.closest("label");
  if (parent) return parent.textContent?.trim() ?? "";
  const placeholder = (el as HTMLInputElement).placeholder ?? "";
  if (placeholder) return placeholder;
  const aria = el.getAttribute("aria-label") ?? "";
  if (aria) return aria;
  const nearestLabel = el.closest('[class*="field"], [class*="form-group"]')?.querySelector("label");
  if (nearestLabel) return nearestLabel.textContent?.trim() ?? "";
  return "";
}

export function getLabelTextForElement(el: HTMLElement): string {
  return getLabelText(el);
}

export function isProfileField(labelText: string): boolean {
  const profileKeywords = [
    "first name",
    "last name",
    "given name",
    "family name",
    "email",
    "phone",
    "mobile",
    "address",
    "city",
    "state",
    "zip",
    "postal",
    "country",
    "linkedin",
    "portfolio",
    "website",
    "github",
    "resume",
    "cv",
    "cover letter",
  ];
  const lower = labelText.toLowerCase();
  return profileKeywords.some((k) => lower.includes(k));
}

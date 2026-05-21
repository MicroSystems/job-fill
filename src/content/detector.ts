import type { Platform } from "../types";

export function detectPlatform(url: string, doc: Document): Platform {
  const hostname = new URL(url).hostname.toLowerCase();

  // Workable must be checked before Workday because some Workable pages
  // contain elements with data-automation-id that would falsely trigger Workday.
  if (
    hostname.includes("apply.workable.com") ||
    hostname.includes("workable.com") ||
    doc.querySelector('[data-qa="workable-apply"]') ||
    doc.querySelector("#workable-form")
  ) {
    return "workable";
  }

  if (
    hostname.includes("ats.rippling.com") ||
    hostname.includes("rippling.com") && /\/jobs\/\d+\/apply/.test(url)
  ) {
    return "rippling";
  }

  if (
    hostname.includes("myworkdayjobs") ||
    hostname.includes("wd5.myworkdayjobs") ||
    hostname.includes("workday") ||
    (hostname.includes("workday") && (doc.querySelector("[data-automation-id]") || doc.querySelector("[data-automation-label]"))) ||
    /\/jobs\/\d+\/apply\/?/.test(url) && doc.querySelector('iframe[src*="workday"]')
  ) {
    return "workday";
  }

  if (
    hostname === "boards.greenhouse.io" ||
    hostname.endsWith(".greenhouse.io") ||
    doc.querySelector("#greenhouse_form") ||
    doc.querySelector(".greenhouse-form") ||
    doc.querySelector('[data-source="greenhouse"]')
  ) {
    return "greenhouse";
  }

  if (
    hostname.includes("jobs.lever.co") ||
    doc.querySelector(".lever-form") ||
    doc.querySelector('[data-qa^="lever"]')
  ) {
    return "lever";
  }

  if (
    hostname.includes("jobs.ashbyhq.com") ||
    hostname.includes("ashbyhq") ||
    /[?&]ashby_jid=/.test(url) ||
    doc.querySelector(".ashby-application-form") ||
    doc.querySelector(".ashby-application-form-container") ||
    doc.querySelector('[data-test-id="ashby-application-form"]') ||
    doc.querySelector('[data-testid="ashby-application-form"]') ||
    doc.querySelector("#ashby-app-embed")
  ) {
    return "ashby";
  }

  if (
    hostname.includes("smartrecruiters") ||
    doc.querySelector(".sr-main") ||
    doc.querySelector('[data-sr-apply-form]')
  ) {
    return "smartrecruiters";
  }

  return "generic";
}

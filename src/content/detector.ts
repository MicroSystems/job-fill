import type { Platform } from "../types";

export function detectPlatform(url: string, doc: Document): Platform {
  const hostname = new URL(url).hostname.toLowerCase();

  if (
    hostname.includes("myworkdayjobs") ||
    hostname.includes("wd5.myworkdayjobs") ||
    hostname.includes("workday") ||
    doc.querySelector("[data-automation-id]") ||
    doc.querySelector("[data-automation-label]") ||
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
    doc.querySelector(".ashby-application-form") ||
    doc.querySelector('[data-test-id="ashby-application-form"]')
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

  if (
    hostname.includes("apply.workable.com") ||
    hostname.includes("workable.com") ||
    doc.querySelector('[data-qa="workable-apply"]') ||
    doc.querySelector("#workable-form")
  ) {
    return "workable";
  }

  return "generic";
}

import { detectPlatform } from "./detector";
import { fill } from "./driver";
import { autoApply } from "./autoapply";
import { getProfile, getResume, addAppliedJob } from "../storage";

let platform: ReturnType<typeof detectPlatform> | null = null;
let scanned = false;

function detectAndStore(): void {
  if (scanned) return;
  platform = detectPlatform(window.location.href, document);
  scanned = true;
}

async function loadProfile(): Promise<{ profileObj: Record<string, any>; profile: any } | null> {
  const profile = await getProfile();
  if (!profile) return null;
  const profileObj: Record<string, any> = JSON.parse(JSON.stringify(profile));
  const resume = await getResume();
  if (resume) profileObj.resume = resume;
  return { profileObj, profile };
}

async function handleAutofill(): Promise<void> {
  detectAndStore();
  if (!platform) return;

  const loaded = await loadProfile();
  if (!loaded) return;

  const result = await fill(platform, loaded.profileObj, loaded.profile);
  browser.runtime.sendMessage({
    type: "autofill-result",
    platform,
    result,
  });
}

async function handleAutoApply(): Promise<void> {
  detectAndStore();
  if (!platform) return;

  const loaded = await loadProfile();
  if (!loaded) return;

  const result = await autoApply(platform, loaded.profileObj, loaded.profile);

  const jobUrl = window.location.href;
  const success = result.submit?.submitted ?? false;

  if (success) {
    await addAppliedJob({
      url: jobUrl,
      platform,
      timestamp: Date.now(),
      success: true,
    });
  }

  browser.runtime.sendMessage({
    type: "autoapply-result",
    platform,
    result,
    jobUrl,
    success,
  });
}

browser.runtime.onMessage.addListener((msg: any) => {
  if (msg.type === "autofill") handleAutofill();
  if (msg.type === "autoapply") handleAutoApply();
  if (msg.type === "get-platform") {
    detectAndStore();
    return Promise.resolve({ platform });
  }
});

const observer = new MutationObserver(() => {
  if (!scanned) detectAndStore();
});

observer.observe(document.body, { childList: true, subtree: true });

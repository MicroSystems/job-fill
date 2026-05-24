import { detectPlatform } from "./detector";
import { fill } from "./driver";
import { autoApply } from "./autoapply";
import { getProfile, getResume, addAppliedJob } from "../storage";

let platform: ReturnType<typeof detectPlatform> | null = null;

function detectAndStore(): void {
  platform = detectPlatform(window.location.href, document);
}

async function loadProfile(): Promise<{ profileObj: Record<string, any>; profile: any } | null> {
  const profile = await getProfile();
  if (!profile) return null;
  const profileObj: Record<string, any> = JSON.parse(JSON.stringify(profile));
  const resume = await getResume();
  if (resume) {
    profileObj.resume = resume;
    (profile as any).resume = resume;
  }
  return { profileObj, profile };
}

async function handleAutofill(): Promise<void> {
  detectAndStore();

  if (!platform) {
    return browser.runtime.sendMessage({
      type: "autofill-result",
      platform: null,
      result: { filled: 0, skipped: 0, errors: ["No supported application platform detected on this page"] },
    });
  }

  const loaded = await loadProfile();
  if (!loaded) {
    return browser.runtime.sendMessage({
      type: "autofill-result",
      platform,
      result: { filled: 0, skipped: 0, errors: ["No profile saved. Go to Profile tab, fill in your details, and click Save Profile."] },
    });
  }

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
  if (msg.type === "autofill") {
    handleAutofill().catch((err) => {
      browser.runtime.sendMessage({
        type: "autofill-result",
        platform,
        result: { filled: 0, skipped: 0, errors: [(err as Error).message] },
      });
    });
  }
  if (msg.type === "autoapply") {
    handleAutoApply().catch(() => {});
  }
  if (msg.type === "get-platform") {
    detectAndStore();
    return Promise.resolve({ platform });
  }
});



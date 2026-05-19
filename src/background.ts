import { getProfile, getConfig, saveConfig, defaultConfig, getAppliedJobs, clearAppliedJobs } from "./storage";

browser.runtime.onInstalled.addListener(async () => {
  const config = await getConfig();
  if (!config) {
    await saveConfig(defaultConfig());
  }
});

browser.runtime.onMessage.addListener(async (msg: any, _sender) => {
  if (msg.type === "get-profile") {
    const profile = await getProfile();
    return { profile };
  }
  if (msg.type === "get-config") {
    const config = await getConfig();
    return { config };
  }
  if (msg.type === "save-config") {
    await saveConfig(msg.config);
    return { success: true };
  }
  if (msg.type === "get-applied-jobs") {
    const jobs = await getAppliedJobs();
    return { jobs };
  }
  if (msg.type === "clear-applied-jobs") {
    await clearAppliedJobs();
    return { success: true };
  }
  if (msg.type === "autofill-all-tabs") {
    const tabs = await browser.tabs.query({ url: ["https://*/*", "http://*/*"] });
    const results: any[] = [];
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, { type: "autofill" });
          results.push({ tabId: tab.id, status: "sent" });
        } catch {
          results.push({ tabId: tab.id, status: "no-content-script" });
        }
      }
    }
    return { results };
  }
});

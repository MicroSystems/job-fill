import {
  getProfile, getProfileNames, getCurrentProfileName, setCurrentProfileName,
  saveProfile, createProfile, deleteProfile,
  getConfig, saveConfig, defaultConfig, getAppliedJobs, clearAppliedJobs,
} from "./storage";

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
  if (msg.type === "get-profile-names") {
    const names = await getProfileNames();
    const current = await getCurrentProfileName();
    return { names, current };
  }
  if (msg.type === "set-current-profile") {
    await setCurrentProfileName(msg.name);
    return { success: true };
  }
  if (msg.type === "create-profile") {
    await createProfile(msg.name);
    await setCurrentProfileName(msg.name);
    return { success: true };
  }
  if (msg.type === "delete-profile") {
    await deleteProfile(msg.name);
    return { success: true };
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
  if (msg.type === "open-profile") {
    const current = await getCurrentProfileName();
    await browser.tabs.create({
      url: browser.runtime.getURL(`profile.html?name=${encodeURIComponent(current)}`),
    });
  }
  if (msg.type === "open-resume-upload") {
    await browser.windows.create({
      url: browser.runtime.getURL("upload.html"),
      type: "popup",
      width: 420,
      height: 260,
      titlePreface: "Job Fill - ",
    });
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

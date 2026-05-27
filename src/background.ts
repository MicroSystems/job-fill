import {
  getProfile, getProfileNames, getCurrentProfileName, setCurrentProfileName,
  saveProfile, createProfile, deleteProfile,
  getConfig, saveConfig, defaultConfig, getAppliedJobs, clearAppliedJobs,
  exportAllData,
} from "./storage";

let autoExportTimer: ReturnType<typeof setTimeout> | null = null;

async function triggerAutoExport() {
  if (autoExportTimer) clearTimeout(autoExportTimer);
  autoExportTimer = setTimeout(async () => {
    try {
      const config = await getConfig();
      if (!config.autoSave) return;
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const url = "data:application/json;charset=utf-8," + encodeURIComponent(json);
      await browser.downloads.download({
        url,
        filename: "job-fill-profiles.json",
        saveAs: false,
        conflictAction: "overwrite",
      });
    } catch (err) {
      console.error("auto-export failed:", err);
    }
  }, 2000);
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.jf_profiles || changes.jf_resumes) {
    triggerAutoExport();
  }
});

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
    try {
      const names = await getProfileNames();
      const current = await getCurrentProfileName();
      console.log("bg get-profile-names:", { names, current });
      return { names, current };
    } catch (err) {
      console.error("bg get-profile-names error:", err);
      return { names: [], current: "" };
    }
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

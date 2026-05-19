import type { Profile, ExtensionConfig, AppliedJob, Platform } from "./types";

const DB_NAME = "jobfill";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function get<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result ?? undefined);
    req.onerror = () => reject(req.error);
  });
}

async function set(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    const req = tx.objectStore("kv").put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function remove(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    const req = tx.objectStore("kv").delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getProfile(): Promise<Profile | undefined> {
  const raw = await get<string>("profile");
  return raw ? JSON.parse(raw) : undefined;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await set("profile", JSON.stringify(profile));
}

export async function deleteProfile(): Promise<void> {
  await remove("profile");
}

export async function getConfig(): Promise<ExtensionConfig> {
  const raw = await get<string>("config");
  if (raw) return JSON.parse(raw) as ExtensionConfig;
  return defaultConfig();
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await set("config", JSON.stringify(config));
}

export function defaultConfig(): ExtensionConfig {
  return {
    aiProvider: "none",
    aiApiKey: "",
    aiEndpoint: "",
    aiModel: "",
    enabledPlatforms: ["greenhouse", "lever", "ashby", "workday", "smartrecruiters", "generic"] as Platform[],
    autoFillOnPageLoad: false,
    autoApplyEnabled: true,
    autoApplyMaxSteps: 10,
    aiAnswerCustomQuestions: false,
  };
}

export async function getAppliedJobs(): Promise<AppliedJob[]> {
  const raw = await get<string>("applied");
  return raw ? JSON.parse(raw) : [];
}

export async function addAppliedJob(job: AppliedJob): Promise<void> {
  const jobs = await getAppliedJobs();
  jobs.unshift(job);
  await set("applied", JSON.stringify(jobs.slice(0, 500)));
}

export async function clearAppliedJobs(): Promise<void> {
  await remove("applied");
}

export async function isJobApplied(url: string): Promise<boolean> {
  const jobs = await getAppliedJobs();
  return jobs.some((j) => j.url === url);
}

export async function storeResume(filename: string, data: string): Promise<void> {
  await set("resume", JSON.stringify({ filename, data }));
}

export async function getResume(): Promise<{ filename: string; data: string } | undefined> {
  const raw = await get<string>("resume");
  return raw ? JSON.parse(raw) : undefined;
}

export async function deleteResume(): Promise<void> {
  await remove("resume");
}

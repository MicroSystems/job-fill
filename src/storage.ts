import type { Profile, ExtensionConfig, AppliedJob, Platform } from "./types";

const KEYS = {
  PROFILE: "jobfill_profile",
  CONFIG: "jobfill_config",
  APPLIED_JOBS: "jobfill_applied",
  RESUME: "jobfill_resume",
} as const;

async function get<T>(key: string): Promise<T | undefined> {
  const result = await browser.storage.local.get(key);
  return result[key] as T | undefined;
}

async function set(key: string, value: unknown): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

async function remove(key: string): Promise<void> {
  await browser.storage.local.remove(key);
}

export async function getProfile(): Promise<Profile | undefined> {
  return get<Profile>(KEYS.PROFILE);
}

export async function saveProfile(profile: Profile): Promise<void> {
  await set(KEYS.PROFILE, profile);
}

export async function deleteProfile(): Promise<void> {
  await remove(KEYS.PROFILE);
}

export async function getConfig(): Promise<ExtensionConfig> {
  const config = await get<ExtensionConfig>(KEYS.CONFIG);
  return config ?? defaultConfig();
}

export async function saveConfig(config: ExtensionConfig): Promise<void> {
  await set(KEYS.CONFIG, config);
}

export function defaultConfig(): ExtensionConfig {
  return {
    aiProvider: "none",
    aiApiKey: "",
    aiEndpoint: "",
    aiModel: "",
    enabledPlatforms: ["greenhouse", "lever", "ashby", "workday", "smartrecruiters", "workable", "generic"] as Platform[],
    autoFillOnPageLoad: false,
    autoApplyEnabled: true,
    autoApplyMaxSteps: 10,
    aiAnswerCustomQuestions: false,
  };
}

export async function getAppliedJobs(): Promise<AppliedJob[]> {
  return (await get<AppliedJob[]>(KEYS.APPLIED_JOBS)) ?? [];
}

export async function addAppliedJob(job: AppliedJob): Promise<void> {
  const jobs = await getAppliedJobs();
  jobs.unshift(job);
  await set(KEYS.APPLIED_JOBS, jobs.slice(0, 500));
}

export async function clearAppliedJobs(): Promise<void> {
  await remove(KEYS.APPLIED_JOBS);
}

export async function isJobApplied(url: string): Promise<boolean> {
  const jobs = await getAppliedJobs();
  return jobs.some((j) => j.url === url);
}

export async function storeResume(filename: string, data: string): Promise<void> {
  await set(KEYS.RESUME, { filename, data });
}

export async function getResume(): Promise<{ filename: string; data: string } | undefined> {
  return get<{ filename: string; data: string }>(KEYS.RESUME);
}

export async function deleteResume(): Promise<void> {
  await remove(KEYS.RESUME);
}

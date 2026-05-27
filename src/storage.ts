import type { Profile, ExtensionConfig, AppliedJob, Platform, ExportData } from "./types";

const KEYS = {
  PROFILES: "jf_profiles",
  CURRENT_PROFILE: "jf_current_profile",
  RESUMES: "jf_resumes",
  CONFIG: "jf_config",
  APPLIED_JOBS: "jf_applied",
  LEGACY_PROFILE: "jobfill_profile",
  LEGACY_RESUME: "jobfill_resume",
} as const;

export const DEFAULT_PROFILE_NAME = "Default";

async function get<T>(key: string): Promise<T | undefined> {
  const result = await browser.storage.local.get(key);
  return result[key] as T | undefined;
}

async function set<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

async function remove(key: string): Promise<void> {
  await browser.storage.local.remove(key);
}

let migrated = false;
async function migrateIfNeeded(): Promise<void> {
  if (migrated) return;
  const profiles = await get<Record<string, Profile>>(KEYS.PROFILES);
  if (profiles) { migrated = true; return; }
  const legacy = await get<Profile>(KEYS.LEGACY_PROFILE);
  if (legacy) {
    await set(KEYS.PROFILES, { [DEFAULT_PROFILE_NAME]: legacy });
    const resume = await get<{ filename: string; data: string }>(KEYS.LEGACY_RESUME);
    if (resume) {
      await set(KEYS.RESUMES, { [DEFAULT_PROFILE_NAME]: resume });
    }
    await Promise.all([remove(KEYS.LEGACY_PROFILE), remove(KEYS.LEGACY_RESUME)]);
  }
  const current = await get<string>(KEYS.CURRENT_PROFILE);
  if (!current) {
    const all = await get<Record<string, Profile>>(KEYS.PROFILES);
    if (all) {
      const names = Object.keys(all);
      if (names.length > 0) await set(KEYS.CURRENT_PROFILE, names[0]);
    }
  }
  migrated = true;
}

export async function getProfileNames(): Promise<string[]> {
  await migrateIfNeeded();
  const profiles = await get<Record<string, Profile>>(KEYS.PROFILES);
  return profiles ? Object.keys(profiles) : [];
}

export async function getCurrentProfileName(): Promise<string> {
  await migrateIfNeeded();
  const name = await get<string>(KEYS.CURRENT_PROFILE);
  if (name) return name;
  const names = await getProfileNames();
  return names[0] ?? DEFAULT_PROFILE_NAME;
}

export async function setCurrentProfileName(name: string): Promise<void> {
  await set(KEYS.CURRENT_PROFILE, name);
}

export async function getProfile(name?: string): Promise<Profile | undefined> {
  await migrateIfNeeded();
  const profileName = name ?? (await getCurrentProfileName());
  const profiles = await get<Record<string, Profile>>(KEYS.PROFILES);
  return profiles?.[profileName];
}

export async function saveProfile(profile: Profile, name?: string): Promise<void> {
  await migrateIfNeeded();
  const profileName = name ?? (await getCurrentProfileName());
  const profiles = (await get<Record<string, Profile>>(KEYS.PROFILES)) ?? {};
  profiles[profileName] = profile;
  await set(KEYS.PROFILES, profiles);
}

export async function deleteProfile(name: string): Promise<void> {
  const profiles = (await get<Record<string, Profile>>(KEYS.PROFILES)) ?? {};
  delete profiles[name];
  await set(KEYS.PROFILES, profiles);
  const resumes = (await get<Record<string, { filename: string; data: string }>>(KEYS.RESUMES)) ?? {};
  delete resumes[name];
  await set(KEYS.RESUMES, resumes);
  const current = await get<string>(KEYS.CURRENT_PROFILE);
  if (current === name) {
    const names = Object.keys(profiles);
    await set(KEYS.CURRENT_PROFILE, names[0] ?? DEFAULT_PROFILE_NAME);
  }
}

export async function createProfile(name: string): Promise<void> {
  const profiles = (await get<Record<string, Profile>>(KEYS.PROFILES)) ?? {};
  if (profiles[name]) return;
  profiles[name] = {
    name: { given: "", family: "" },
    email: "",
    phone: { national: "" },
    address: { line1: "", line2: "", city: "", state: "", zip: "", country: "" },
    social: {},
    experience: [],
    education: [],
    skills: [],
    resume: null,
    coverLetter: "",
    answers: {},
  };
  await set(KEYS.PROFILES, profiles);
}

export async function storeResume(filename: string, data: string, profileName?: string): Promise<void> {
  const name = profileName ?? (await getCurrentProfileName());
  const resumes = (await get<Record<string, { filename: string; data: string }>>(KEYS.RESUMES)) ?? {};
  resumes[name] = { filename, data };
  await set(KEYS.RESUMES, resumes);
}

export async function getResume(profileName?: string): Promise<{ filename: string; data: string } | undefined> {
  const name = profileName ?? (await getCurrentProfileName());
  const resumes = await get<Record<string, { filename: string; data: string }>>(KEYS.RESUMES);
  return resumes?.[name];
}

export async function deleteResume(profileName?: string): Promise<void> {
  const name = profileName ?? (await getCurrentProfileName());
  const resumes = (await get<Record<string, { filename: string; data: string }>>(KEYS.RESUMES)) ?? {};
  delete resumes[name];
  await set(KEYS.RESUMES, resumes);
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
    autoSave: true,
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

export async function exportAllData(): Promise<ExportData> {
  const profiles = (await get<Record<string, Profile>>(KEYS.PROFILES)) ?? {};
  const resumes = (await get<Record<string, { filename: string; data: string }>>(KEYS.RESUMES)) ?? {};
  const currentProfile = (await get<string>(KEYS.CURRENT_PROFILE)) ?? "";
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    currentProfile,
    profiles,
    resumes,
  };
}

export async function importAllData(data: ExportData): Promise<{ count: number }> {
  if (!data || !data.profiles || typeof data.profiles !== "object") {
    throw new Error("Invalid import data: missing profiles");
  }
  const count = Object.keys(data.profiles).length;
  await Promise.all([
    set(KEYS.PROFILES, data.profiles),
    set(KEYS.RESUMES, data.resumes ?? {}),
  ]);
  if (data.currentProfile) {
    const names = Object.keys(data.profiles);
    if (names.includes(data.currentProfile)) {
      await set(KEYS.CURRENT_PROFILE, data.currentProfile);
    }
  }
  return { count };
}

export async function isJobApplied(url: string): Promise<boolean> {
  const jobs = await getAppliedJobs();
  return jobs.some((j) => j.url === url);
}

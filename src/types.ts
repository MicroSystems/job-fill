export interface Name {
  given: string;
  family: string;
  middle?: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Experience {
  company: string;
  title: string;
  start: string;
  end: string;
  current: boolean;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  graduation: string;
  gpa?: string;
}

export interface Phone {
  national: string;
  countryCode?: string;
}

export interface SocialLinks {
  linkedin?: string;
  portfolio?: string;
  github?: string;
  twitter?: string;
}

export interface Profile {
  name: Name;
  email: string;
  phone: Phone;
  address: Address;
  social: SocialLinks;
  experience: Experience[];
  education: Education[];
  skills: string[];
  resume: { filename: string; data: string } | null;
  coverLetter: string;
  answers: Record<string, string>;
  desiredCompensation?: string;
  workAuthorization?: string;
  requiredVisaSponsorship?: boolean;
  gender?: string;
  race?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  currentLocation?: string;
  noticePeriod?: string;
  pronouns?: string;
  currentCompany?: string;
}

export type Platform = "workday" | "greenhouse" | "mygreenhouse" | "lever" | "ashby" | "smartrecruiters" | "workable" | "rippling" | "generic";

export interface FieldMapping {
  profileKey: string;
  selectors: string[];
  type: "text" | "select" | "checkbox" | "radio" | "file" | "textarea";
  transform?: (value: any) => any;
}

export interface FillRequest {
  platform: Platform;
  action: "autofill" | "autofill_all" | "autoapply";
}

export interface FillResponse {
  filled: number;
  skipped: number;
  errors: string[];
}

export interface SubmitResponse {
  submitted: boolean;
  steps: number;
  errors: string[];
  confirmationText?: string;
}

export interface AutoApplyResult {
  fill: FillResponse;
  submit?: SubmitResponse;
  jobUrl: string;
  platform: Platform;
  timestamp: number;
  success: boolean;
}

export interface AppliedJob {
  url: string;
  platform: Platform;
  title?: string;
  company?: string;
  timestamp: number;
  success: boolean;
}

export const STORE_KEYS = {
  PROFILE: "jobfill_profile",
  CONFIG: "jobfill_config",
  APPLIED_JOBS: "jobfill_applied",
} as const;

export interface ExtensionConfig {
  aiProvider: "openai" | "anthropic" | "ollama" | "none";
  aiApiKey: string;
  aiEndpoint: string;
  aiModel: string;
  enabledPlatforms: Platform[];
  autoFillOnPageLoad: boolean;
  autoApplyEnabled: boolean;
  autoApplyMaxSteps: number;
  aiAnswerCustomQuestions: boolean;
}

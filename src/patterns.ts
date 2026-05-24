/** Minimal shape matching the FieldMapping fields we need. */
export interface LabelFieldMapping {
  labelPatterns: RegExp[];
  profileKey: string;
}

interface EeoDef {
  key: string;
  labelPatterns: RegExp[];
  combined: RegExp;
}

const EEO_DEFS: EeoDef[] = [
  {
    key: "workAuthorization",
    labelPatterns: [
      /authorized.*work/i,
      /work.?auth/i,
      /entitled.*work/i,
      /eligible.*work/i,
      /legally.*work/i,
      /legally.*authoriz/i,
    ],
    combined: /authorized.*work|work.?auth|entitled.*work|eligible.*work|legally.*work|legally.*authoriz/i,
  },
  {
    key: "requiredVisaSponsorship",
    labelPatterns: [/visa.?sponsor/i, /sponsorship/i],
    combined: /visa.?sponsor|sponsorship/i,
  },
  { key: "gender", labelPatterns: [/gender/i, /sex/i], combined: /gender/i },
  { key: "race", labelPatterns: [/race/i, /ethnicity/i, /which categori/i], combined: /race|ethnicity|which categori/i },
  { key: "veteranStatus", labelPatterns: [/veteran/i, /military/i], combined: /veteran/i },
  { key: "disabilityStatus", labelPatterns: [/disability/i, /disabled/i], combined: /disability/i },
];

/** FIELD_MAPPING entries for EEO fields (used in filler.ts). */
export const EEO_FIELD_MAPPINGS: LabelFieldMapping[] = EEO_DEFS.map((d) => ({
  labelPatterns: d.labelPatterns,
  profileKey: d.key,
}));

/**
 * Combined patterns for Ashby Yes/No button groups.
 * Sponsorship must be checked BEFORE workAuthorization because visa-sponsorship
 * questions often also contain "work authorization" in their text.
 */
export const YESNO_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: EEO_DEFS[1].combined, key: EEO_DEFS[1].key },
  ...EEO_DEFS.filter((_, i) => i !== 1).map((d) => ({ pattern: d.combined, key: d.key })),
];

/** Combined patterns for Ashby EEO <select> dropdowns. */
export const EEO_SELECT_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /authorized.*work|work.?auth|visa|sponsor/i, key: "workAuthorization" },
  ...EEO_DEFS.filter((d) => d.key !== "workAuthorization" && d.key !== "requiredVisaSponsorship").map((d) => ({
    pattern: d.combined,
    key: d.key,
  })),
];

/**
 * Single source of truth for the Tunisian education system structure.
 * Keep in sync with artifacts/api-server/src/lib/educationConfig.ts
 *
 * Two categories:
 *   SIMPLE_LEVELS  — no section needed (collège + 1ère secondaire)
 *   SECTION_LEVELS — require a section key (2ème, 3ème, Bac)
 */

// ── Simple levels (no section) ───────────────────────────────────────────────

export const SIMPLE_LEVELS = {
  "7eme": {
    label: "7ème année de base",
    shortLabel: "7ème",
    cycle: "college" as const,
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Histoire-Géographie", "Éducation Civique", "Anglais", "Sport",
      "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "8eme": {
    label: "8ème année de base",
    shortLabel: "8ème",
    cycle: "college" as const,
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Physique-Chimie", "Histoire-Géographie", "Éducation Civique",
      "Anglais", "Sport", "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "9eme": {
    label: "9ème année de base",
    shortLabel: "9ème",
    cycle: "college" as const,
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Physique-Chimie", "Histoire-Géographie", "Éducation Civique",
      "Anglais", "Allemand", "Sport", "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "1ere_secondaire": {
    label: "1ère année secondaire",
    shortLabel: "1ère Sec",
    cycle: "lycee" as const,
    subjects: [
      "Mathématiques", "Arabe", "Français", "Anglais", "Sciences Naturelles",
      "Physique-Chimie", "Histoire-Géographie", "Philosophie",
      "Informatique", "Sport", "Allemand", "Italien",
    ],
  },
} as const;

// ── Section levels (require a section key) ───────────────────────────────────

export const SECTION_LEVELS = {
  "2eme": {
    label: "2ème secondaire",
    shortLabel: "2ème",
    cycle: "lycee" as const,
    sections: {
      "sciences": {
        label: "Sciences",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Sciences Naturelles",
          "Arabe", "Français", "Anglais", "Histoire-Géographie",
          "Informatique", "Sport", "Allemand",
        ],
      },
      "lettres": {
        label: "Lettres",
        subjects: [
          "Arabe", "Français", "Anglais", "Philosophie", "Histoire-Géographie",
          "Mathématiques", "Éducation Islamique", "Sport",
          "Allemand", "Italien", "Espagnol",
        ],
      },
      "economie": {
        label: "Économie",
        subjects: [
          "Mathématiques", "Économie", "Gestion", "Comptabilité",
          "Arabe", "Français", "Anglais", "Histoire-Géographie",
          "Informatique", "Sport",
        ],
      },
      "technique": {
        label: "Technique",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Technologie",
          "Sciences de l'Ingénieur", "Arabe", "Français", "Anglais",
          "Informatique", "Sport",
        ],
      },
      "sport": {
        label: "Sport",
        subjects: [
          "Sport", "Sciences Naturelles", "Mathématiques",
          "Physique-Chimie", "Arabe", "Français", "Anglais",
          "Histoire-Géographie",
        ],
      },
      "informatique": {
        label: "Informatique",
        subjects: [
          "Informatique", "Mathématiques", "Physique-Chimie",
          "Arabe", "Français", "Anglais", "Sciences Naturelles", "Sport",
        ],
      },
    },
  },
  "3eme": {
    label: "3ème année",
    shortLabel: "3ème",
    cycle: "lycee" as const,
    sections: {
      "sciences_maths": {
        label: "Sciences Mathématiques",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Sciences Naturelles",
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Informatique", "Sport",
        ],
      },
      "sciences_exp": {
        label: "Sciences Expérimentales",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Sciences Naturelles",
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Sport",
        ],
      },
      "technique": {
        label: "Sciences Techniques",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Technologie",
          "Sciences de l'Ingénieur", "Arabe", "Français", "Anglais",
          "Philosophie", "Informatique", "Sport",
        ],
      },
      "economie": {
        label: "Économie et Gestion",
        subjects: [
          "Mathématiques", "Économie", "Gestion", "Comptabilité",
          "Arabe", "Français", "Anglais", "Histoire-Géographie",
          "Philosophie", "Informatique", "Sport",
        ],
      },
      "lettres": {
        label: "Lettres",
        subjects: [
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Mathématiques",
          "Éducation Islamique", "Sport",
          "Allemand", "Italien", "Espagnol",
        ],
      },
      "sport": {
        label: "Sport",
        subjects: [
          "Sport", "Sciences Naturelles", "Mathématiques",
          "Physique-Chimie", "Arabe", "Français", "Anglais",
          "Histoire-Géographie",
        ],
      },
      "informatique": {
        label: "Informatique",
        subjects: [
          "Informatique", "Mathématiques", "Physique-Chimie",
          "Arabe", "Français", "Anglais", "Philosophie", "Sport",
        ],
      },
    },
  },
  "bac": {
    label: "Baccalauréat",
    shortLabel: "Bac",
    cycle: "lycee" as const,
    sections: {
      "sciences_maths": {
        label: "Sciences Mathématiques",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Sciences Naturelles",
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Informatique", "Sport",
        ],
      },
      "sciences_exp": {
        label: "Sciences Expérimentales",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Sciences Naturelles",
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Sport",
        ],
      },
      "technique": {
        label: "Sciences Techniques",
        subjects: [
          "Mathématiques", "Physique-Chimie", "Technologie",
          "Sciences de l'Ingénieur", "Arabe", "Français", "Anglais",
          "Philosophie", "Informatique", "Sport",
        ],
      },
      "economie": {
        label: "Économie et Gestion",
        subjects: [
          "Mathématiques", "Économie", "Gestion", "Comptabilité",
          "Arabe", "Français", "Anglais", "Histoire-Géographie",
          "Philosophie", "Informatique", "Sport",
        ],
      },
      "lettres": {
        label: "Lettres",
        subjects: [
          "Arabe", "Français", "Anglais", "Philosophie",
          "Histoire-Géographie", "Mathématiques",
          "Éducation Islamique", "Sport",
          "Allemand", "Italien", "Espagnol",
        ],
      },
      "sport": {
        label: "Sport",
        subjects: [
          "Sport", "Sciences Naturelles", "Mathématiques",
          "Physique-Chimie", "Arabe", "Français", "Anglais",
          "Histoire-Géographie",
        ],
      },
      "informatique": {
        label: "Informatique",
        subjects: [
          "Informatique", "Mathématiques", "Physique-Chimie",
          "Arabe", "Français", "Anglais", "Philosophie", "Sport",
        ],
      },
    },
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type SimpleNiveauKey = keyof typeof SIMPLE_LEVELS;
export type SectionNiveauKey = keyof typeof SECTION_LEVELS;
export type NiveauKey = SimpleNiveauKey | SectionNiveauKey;

// ── Helper functions ──────────────────────────────────────────────────────────

export function isSimpleLevel(key: string): key is SimpleNiveauKey {
  return key in SIMPLE_LEVELS;
}

export function isSectionLevel(key: string): key is SectionNiveauKey {
  return key in SECTION_LEVELS;
}

export function isValidNiveauKey(key: string): boolean {
  return isSimpleLevel(key) || isSectionLevel(key);
}

export function getNiveauLabel(niveauKey: string): string {
  return (SIMPLE_LEVELS as any)[niveauKey]?.label
      ?? (SECTION_LEVELS as any)[niveauKey]?.label
      ?? niveauKey;
}

export function getSectionLabel(niveauKey: string, sectionKey: string): string {
  return (SECTION_LEVELS as any)[niveauKey]?.sections?.[sectionKey]?.label ?? sectionKey;
}

export function getSectionsForNiveau(niveauKey: string): Record<string, { label: string; subjects: readonly string[] }> {
  return (SECTION_LEVELS as any)[niveauKey]?.sections ?? {};
}

export function getSubjectsForNiveauSection(niveauKey: string, sectionKey: string | null): readonly string[] {
  if (sectionKey) {
    return (SECTION_LEVELS as any)[niveauKey]?.sections?.[sectionKey]?.subjects ?? [];
  }
  return (SIMPLE_LEVELS as any)[niveauKey]?.subjects ?? [];
}

/** Parse old compound key "bac_sciences_maths" → { niveauKey: "bac", sectionKey: "sciences_maths" } */
export function parseCompoundKey(key: string): { niveauKey: string; sectionKey: string | null } {
  if (isSimpleLevel(key)) return { niveauKey: key, sectionKey: null };
  if (isSectionLevel(key)) return { niveauKey: key, sectionKey: null };

  for (const niveauKey of Object.keys(SECTION_LEVELS)) {
    if (key.startsWith(niveauKey + "_")) {
      return { niveauKey, sectionKey: key.slice(niveauKey.length + 1) };
    }
  }
  return { niveauKey: key, sectionKey: null };
}

// ── Backward-compat EDUCATION_LEVELS (derived) ────────────────────────────────

export const EDUCATION_LEVELS: Record<string, { label: string; shortLabel?: string; cycle?: string; subjects: readonly string[] }> = {
  ...Object.fromEntries(
    Object.entries(SIMPLE_LEVELS).map(([k, v]) => [k, { label: v.label, shortLabel: v.shortLabel, cycle: v.cycle, subjects: v.subjects }])
  ),
  ...Object.fromEntries(
    Object.entries(SECTION_LEVELS).flatMap(([nk, nv]) =>
      Object.entries(nv.sections).map(([sk, sv]) => [
        `${nk}_${sk}`,
        { label: sv.label, cycle: nv.cycle, subjects: sv.subjects },
      ])
    )
  ),
};

export type EducationLevelKey = keyof typeof EDUCATION_LEVELS;
export const VALID_LEVEL_KEYS = Object.keys(EDUCATION_LEVELS) as EducationLevelKey[];

export function getLevelLabel(key: string): string {
  return EDUCATION_LEVELS[key]?.label ?? getNiveauLabel(key);
}

export function getSubjectsForLevel(key: string): readonly string[] {
  return EDUCATION_LEVELS[key]?.subjects ?? [];
}

/** Get the display label for a class — handles both old compound keys and new niveau+section format */
export function getClassLevelLabel(gradeLevel: string, sectionKey?: string | null): string {
  if (sectionKey) {
    return `${getNiveauLabel(gradeLevel)} — ${getSectionLabel(gradeLevel, sectionKey)}`;
  }
  return getLevelLabel(gradeLevel); // handles old compound keys like "bac_sciences_maths"
}

export function isCollegeLevel(key: string): boolean {
  return (SIMPLE_LEVELS as any)[key]?.cycle === "college";
}

/** All unique subjects across all levels */
export const ALL_SUBJECTS: string[] = [
  ...new Set([
    ...Object.values(SIMPLE_LEVELS).flatMap(l => [...l.subjects]),
    ...Object.values(SECTION_LEVELS).flatMap(nv => Object.values(nv.sections).flatMap(s => [...s.subjects])),
  ]),
].sort((a, b) => a.localeCompare(b, "fr"));

/** Grouped tree — all groups use compound keys so professor registration stays backward-compat */
export const LEVEL_TREE = [
  {
    id: "college" as const,
    label: "Collège",
    sub: "7ème – 9ème de base",
    levels: [
      { key: "7eme", label: "7ème année" },
      { key: "8eme", label: "8ème année" },
      { key: "9eme", label: "9ème année" },
    ],
  },
  {
    id: "lycee_1" as const,
    label: "1ère Secondaire",
    sub: "Tronc commun",
    levels: [{ key: "1ere_secondaire", label: "1ère année secondaire" }],
  },
  {
    id: "lycee_2" as const,
    label: "2ème Secondaire",
    sub: "Choisir une section",
    levels: Object.entries(SECTION_LEVELS["2eme"].sections).map(([sk, sv]) => ({ key: `2eme_${sk}`, label: sv.label })),
  },
  {
    id: "3eme" as const,
    label: "3ème Année",
    sub: "Choisir une section",
    levels: Object.entries(SECTION_LEVELS["3eme"].sections).map(([sk, sv]) => ({ key: `3eme_${sk}`, label: sv.label })),
  },
  {
    id: "bac" as const,
    label: "Baccalauréat",
    sub: "Choisir une section",
    levels: Object.entries(SECTION_LEVELS["bac"].sections).map(([sk, sv]) => ({ key: `bac_${sk}`, label: sv.label })),
  },
];

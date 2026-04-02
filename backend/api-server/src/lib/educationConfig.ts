/**
 * Single source of truth for the Tunisian education system structure.
 * Keep in sync with artifacts/etude-plus/src/lib/educationConfig.ts
 *
 * Two categories:
 *   SIMPLE_LEVELS  — no section needed (collège + 1ère secondaire)
 *   SECTION_LEVELS — require a section key (2ème, 3ème, Bac)
 */

// ── Simple levels (no section) ───────────────────────────────────────────────

export const SIMPLE_LEVELS = {
  "7eme": {
    label: "7ème année de base",
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Histoire-Géographie", "Éducation Civique", "Anglais", "Sport",
      "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "8eme": {
    label: "8ème année de base",
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Physique-Chimie", "Histoire-Géographie", "Éducation Civique",
      "Anglais", "Sport", "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "9eme": {
    label: "9ème année de base",
    subjects: [
      "Mathématiques", "Arabe", "Français", "Sciences Naturelles",
      "Physique-Chimie", "Histoire-Géographie", "Éducation Civique",
      "Anglais", "Allemand", "Sport", "Éducation Artistique", "Éducation Musicale",
    ],
  },
  "1ere_secondaire": {
    label: "1ère année secondaire",
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

export const ALL_NIVEAU_KEYS = [
  ...Object.keys(SIMPLE_LEVELS),
  ...Object.keys(SECTION_LEVELS),
] as NiveauKey[];

// ── Helper functions ──────────────────────────────────────────────────────────

export function isSimpleLevel(key: string): key is SimpleNiveauKey {
  return key in SIMPLE_LEVELS;
}

export function isSectionLevel(key: string): key is SectionNiveauKey {
  return key in SECTION_LEVELS;
}

export function isValidNiveauKey(key: string): key is NiveauKey {
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

export function isValidSectionKey(niveauKey: string, sectionKey: string): boolean {
  return sectionKey in getSectionsForNiveau(niveauKey);
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

/** Get the effective (niveauKey, sectionKey) for a class row, handling both old and new format */
export function getClassLevel(cls: { gradeLevel: string; sectionKey?: string | null }) {
  if (cls.sectionKey !== undefined && cls.sectionKey !== null) {
    return { niveauKey: cls.gradeLevel, sectionKey: cls.sectionKey };
  }
  return parseCompoundKey(cls.gradeLevel);
}

/** Get the effective (niveauKey, sectionKey) for a student profile, handling both old and new format */
export function getStudentLevel(sp: { gradeLevel: string | null; educationSection?: string | null }) {
  if (!sp.gradeLevel) return { niveauKey: null, sectionKey: null };
  if (sp.educationSection !== undefined) {
    return { niveauKey: sp.gradeLevel, sectionKey: sp.educationSection ?? null };
  }
  return parseCompoundKey(sp.gradeLevel);
}

// ── Backward-compat EDUCATION_LEVELS (derived) ────────────────────────────────

export const EDUCATION_LEVELS: Record<string, { label: string; subjects: readonly string[] }> = {
  ...Object.fromEntries(
    Object.entries(SIMPLE_LEVELS).map(([k, v]) => [k, { label: v.label, subjects: v.subjects }])
  ),
  ...Object.fromEntries(
    Object.entries(SECTION_LEVELS).flatMap(([nk, nv]) =>
      Object.entries(nv.sections).map(([sk, sv]) => [
        `${nk}_${sk}`,
        { label: sv.label, subjects: sv.subjects },
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

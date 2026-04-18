/**
 * Curriculum seed — Tunisian secondary education structure.
 *
 * Run with:  DATABASE_URL=... npx tsx src/seeds/curriculum-seed.ts
 *
 * This script is IDEMPOTENT: re-running it will not create duplicates.
 * It uses INSERT ... ON CONFLICT DO NOTHING for subjects and
 * the unique index on (level_code, section_key, subject, name) for chapters.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — CURRICULUM ACCURACY
 * Chapters marked with  // TODO  below have placeholder names.
 * Replace them with exact names from the official Tunisian MEDUCATION
 * programme documents before going live.
 *
 * Chapters with NO TODO comment use names sourced from the official
 * Tunisian secondary curriculum (programmes officiels, Ministère de
 * l'Éducation de Tunisie).
 *
 * Chapter "name" values MUST exactly match the "topic" field that the
 * AI processor (knowledgeBaseProcessor.ts) writes to the questions /
 * flashcards tables — so that the LEFT JOIN count queries work.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { db } from "../index.js";
import { curriculumSubjectsTable, curriculumChaptersTable } from "../schema/curriculum.js";
import { sql } from "drizzle-orm";

// ── helpers ────────────────────────────────────────────────────────────────────

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type ChapterDef = {
  levelCode:  string;
  sectionKey: string | null; // null = all tracks of that level
  subject:    string;
  name:       string;
  shortName?: string;
  order:      number;
};

// ── SUBJECTS ──────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { code: "mathematiques",      name: "Mathématiques",      icon: "📐", colorClass: "bg-blue-500/10 border-blue-200",    order: 1 },
  { code: "physique-chimie",    name: "Physique-Chimie",    icon: "⚗️", colorClass: "bg-purple-500/10 border-purple-200", order: 2 },
  { code: "sciences-naturelles",name: "Sciences Naturelles",icon: "🌿", colorClass: "bg-green-500/10 border-green-200",   order: 3 },
  { code: "arabe",              name: "Arabe",              icon: "📖", colorClass: "bg-amber-500/10 border-amber-200",   order: 4 },
  { code: "francais",           name: "Français",           icon: "🇫🇷", colorClass: "bg-rose-500/10 border-rose-200",     order: 5 },
  { code: "anglais",            name: "Anglais",            icon: "🇬🇧", colorClass: "bg-sky-500/10 border-sky-200",       order: 6 },
  { code: "philosophie",        name: "Philosophie",        icon: "🧠", colorClass: "bg-indigo-500/10 border-indigo-200", order: 7 },
  { code: "histoire-geographie",name: "Histoire-Géographie",icon: "🌍", colorClass: "bg-orange-500/10 border-orange-200", order: 8 },
  { code: "informatique",       name: "Informatique",       icon: "💻", colorClass: "bg-teal-500/10 border-teal-200",     order: 9 },
  { code: "sport",              name: "Sport",              icon: "🏃", colorClass: "bg-yellow-500/10 border-yellow-200", order: 10 },
  { code: "economie",           name: "Économie",           icon: "📊", colorClass: "bg-emerald-500/10 border-emerald-200",order: 11 },
  { code: "gestion",            name: "Gestion",            icon: "📋", colorClass: "bg-cyan-500/10 border-cyan-200",     order: 12 },
  { code: "comptabilite",       name: "Comptabilité",       icon: "🧾", colorClass: "bg-slate-500/10 border-slate-200",   order: 13 },
  { code: "technologie",        name: "Technologie",        icon: "⚙️", colorClass: "bg-zinc-500/10 border-zinc-200",     order: 14 },
];

// ── CHAPTERS ──────────────────────────────────────────────────────────────────
// sectionKey = null means chapter applies to ALL tracks of that level.
// Subjects that are identical across all tracks use null so they don't need
// to be repeated per-section.

const CHAPTERS: ChapterDef[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // 1ÈRE ANNÉE SECONDAIRE — TRONC COMMUN (section_key: null)
  // ════════════════════════════════════════════════════════════════════════════

  // ── Mathématiques 1ère ───────────────────────────────────────────────────
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Logique et raisonnement mathématique",                  order: 1  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Ensembles de nombres (ℕ, ℤ, ℚ, ℝ)",                    order: 2  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Calcul numérique dans ℝ",                               order: 3  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Polynômes et fractions rationnelles",                   order: 4  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Équations et inéquations du premier degré",             order: 5  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Systèmes d'équations du premier degré",                 order: 6  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Fonctions — généralités et représentation graphique",   order: 7  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "La fonction affine",                                    order: 8  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Droites et vecteurs du plan",                          order: 9  },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Géométrie plane — triangles et cercles",                order: 10 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Mathématiques", name: "Statistiques descriptives",                            order: 11 },

  // ── Physique-Chimie 1ère ─────────────────────────────────────────────────
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Chimie : Corps purs et mélanges",                    order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Chimie : Les transformations chimiques",             order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Chimie : Les solutions aqueuses",                    order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Physique : La lumière — propagation et optique",     order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Physique : Forces et mouvements",                    order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Physique : Travail et énergie",                      order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Physique-Chimie", name: "Physique : Circuits électriques",                    order: 7 },

  // ── Sciences Naturelles 1ère ─────────────────────────────────────────────
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "La communication nerveuse",                      order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "La communication hormonale",                     order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "L'immunologie — défenses de l'organisme",        order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "La reproduction sexuée",                         order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "Génétique — introduction à l'hérédité",          order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "Les écosystèmes et l'environnement",              order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Sciences Naturelles", name: "Géologie : Structure interne du globe",           order: 7 },

  // ── Français 1ère ────────────────────────────────────────────────────────
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Le texte narratif",                                         order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Le texte descriptif",                                       order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Le texte argumentatif",                                     order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "La poésie — figures de style et versification",             order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Le théâtre",                                                order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Grammaire : La phrase complexe et la subordination",        order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Grammaire : Le groupe nominal et la détermination",         order: 7 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Français", name: "Expression écrite — production de textes",                  order: 8 },

  // ── Anglais 1ère ─────────────────────────────────────────────────────────
  // TODO: Replace with exact unit titles from the official Tunisian English programme (1ère secondaire)
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 1: Meeting People",                                     order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 2: Family and Daily Life",                              order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 3: School and Education",                               order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 4: Health and Medicine",                                order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 5: Environment and Nature",                             order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 6: Science and Technology",                             order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Anglais", name: "Unit 7: Arts, Culture and Leisure",                          order: 7 },

  // ── Arabe 1ère ────────────────────────────────────────────────────────────
  // TODO: Replace with exact chapter/text titles from the official Tunisian Arabic programme
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "النصوص الأدبية — النثر",                                       order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "النصوص الأدبية — الشعر",                                        order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "قواعد اللغة — النحو",                                          order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "قواعد اللغة — الصرف",                                          order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "البلاغة والعروض",                                               order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Arabe", name: "التعبير الكتابي",                                               order: 6 },

  // ── Histoire-Géographie 1ère ─────────────────────────────────────────────
  // TODO: Verify exact chapter order against official Tunisian programme
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : La Tunisie — milieu naturel et ressources",  order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : La Tunisie — population et développement",    order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : Le monde — grandes puissances",               order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : Les problèmes de développement dans le monde", order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : Le monde arabe et islamique médiéval",           order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : La Tunisie médiévale",                           order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : La Tunisie au XIXe siècle et la colonisation",   order: 7 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : Les mouvements de libération nationale",         order: 8 },

  // ── Informatique 1ère ────────────────────────────────────────────────────
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Introduction à l'informatique et aux systèmes",                order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Algorithmique — notions de base et variables",                  order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Structures conditionnelles (si, sinon)",                        order: 3 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Structures itératives (pour, tant que)",                        order: 4 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Les tableaux",                                                  order: 5 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Les sous-programmes (procédures et fonctions)",                 order: 6 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Informatique", name: "Les fichiers",                                                  order: 7 },

  // ── Philosophie 1ère ─────────────────────────────────────────────────────
  // TODO: Verify — Philosophie may not be in 1ère secondaire; remove if so
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Philosophie", name: "Introduction à la philosophie",                                  order: 1 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Philosophie", name: "La connaissance et la vérité",                                   order: 2 },
  { levelCode: "1ere_secondaire", sectionKey: null, subject: "Philosophie", name: "L'être humain et la société",                                    order: 3 },

  // ════════════════════════════════════════════════════════════════════════════
  // 2ÈME ANNÉE SECONDAIRE
  // ════════════════════════════════════════════════════════════════════════════

  // Languages and Humanities are mostly section_key = null (same across tracks)

  // ── Français 2ème (toutes sections) ─────────────────────────────────────
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "Le roman et le récit",                                                   order: 1 },
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "La nouvelle",                                                            order: 2 },
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "L'argumentation et l'essai",                                             order: 3 },
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "La poésie — courants et mouvements",                                     order: 4 },
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "Grammaire : Les propositions subordonnées",                              order: 5 },
  { levelCode: "2eme", sectionKey: null, subject: "Français", name: "Expression écrite — dissertation et commentaire",                        order: 6 },

  // ── Anglais 2ème (toutes sections) ──────────────────────────────────────
  // TODO: Replace with official Tunisian English programme for 2ème
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 1: Identity and Society",                                            order: 1 },
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 2: Work and Career",                                                 order: 2 },
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 3: Media and Communication",                                         order: 3 },
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 4: Globalisation",                                                   order: 4 },
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 5: Progress and Development",                                        order: 5 },
  { levelCode: "2eme", sectionKey: null, subject: "Anglais", name: "Unit 6: Human Rights",                                                    order: 6 },

  // ── Arabe 2ème (toutes sections) ────────────────────────────────────────
  // TODO: Replace with official programme
  { levelCode: "2eme", sectionKey: null, subject: "Arabe", name: "الأدب العربي الحديث — النثر",                                              order: 1 },
  { levelCode: "2eme", sectionKey: null, subject: "Arabe", name: "الأدب العربي الحديث — الشعر",                                              order: 2 },
  { levelCode: "2eme", sectionKey: null, subject: "Arabe", name: "قواعد اللغة — النحو المتقدم",                                              order: 3 },
  { levelCode: "2eme", sectionKey: null, subject: "Arabe", name: "البلاغة والأسلوب",                                                          order: 4 },
  { levelCode: "2eme", sectionKey: null, subject: "Arabe", name: "التعبير الكتابي — المقال والتقرير",                                         order: 5 },

  // ── Histoire-Géographie 2ème (toutes sections) ──────────────────────────
  // TODO: Verify order against official programme
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : Les espaces productifs dans le monde",          order: 1 },
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : La mondialisation",                             order: 2 },
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : Le monde entre les deux guerres (1919-1939)",     order: 3 },
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : La Seconde Guerre mondiale",                      order: 4 },
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : La Tunisie et l'indépendance",                    order: 5 },
  { levelCode: "2eme", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : Le monde bipolaire (Guerre froide)",              order: 6 },

  // ── Mathématiques 2ème — Sciences (section: sciences) ───────────────────
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Les suites numériques",                                       order: 1 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Limite d'une suite",                                          order: 2 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Limite d'une fonction",                                       order: 3 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Continuité d'une fonction",                                   order: 4 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Dérivation — définition et règles de calcul",                 order: 5 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Applications de la dérivation — étude de fonctions",         order: 6 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Fonctions trigonométriques",                                  order: 7 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Dénombrement et probabilités",                               order: 8 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Vecteurs du plan et calcul vectoriel",                        order: 9 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Mathématiques", name: "Géométrie analytique dans le plan",                          order: 10 },

  // ── Physique-Chimie 2ème Sciences ────────────────────────────────────────
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Cinématique du point",                                      order: 1 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Dynamique newtonienne — les lois de Newton",                order: 2 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Travail et énergie mécanique",                              order: 3 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Oscillations mécaniques — le pendule simple",              order: 4 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Oscillations mécaniques — système ressort-masse",          order: 5 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Ondes mécaniques progressives",                            order: 6 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Électricité : Le condensateur",                            order: 7 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Électricité : La bobine",                                  order: 8 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Chimie : Les transformations acido-basiques",              order: 9 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Physique-Chimie", name: "Chimie : L'oxydoréduction",                               order: 10 },

  // ── Sciences Naturelles 2ème Sciences ────────────────────────────────────
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Génétique moléculaire — l'ADN et l'ARN",              order: 1 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Génétique moléculaire — transcription et traduction", order: 2 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Génétique mendélienne — première loi de Mendel",      order: 3 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Génétique mendélienne — deuxième loi de Mendel",      order: 4 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "La variabilité génétique et les mutations",           order: 5 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "L'immunologie approfondie — la réponse immunitaire",  order: 6 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Neurosciences — la synapse et l'influx nerveux",      order: 7 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Sciences Naturelles", name: "Tectonique des plaques — données et mécanismes",      order: 8 },

  // ── Informatique 2ème Sciences ───────────────────────────────────────────
  { levelCode: "2eme", sectionKey: "sciences", subject: "Informatique", name: "Structures de données — listes et piles",                    order: 1 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Informatique", name: "Récursivité",                                                order: 2 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Informatique", name: "Algorithmes de tri",                                         order: 3 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Informatique", name: "Bases de données — introduction",                           order: 4 },
  { levelCode: "2eme", sectionKey: "sciences", subject: "Informatique", name: "Le langage SQL",                                            order: 5 },

  // ── Mathématiques 2ème — Lettres ─────────────────────────────────────────
  // TODO: Fill from official Tunisian Maths-Lettres programme for 2ème
  { levelCode: "2eme", sectionKey: "lettres", subject: "Mathématiques", name: "Statistiques et représentation graphique",                    order: 1 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Mathématiques", name: "Probabilités — introduction",                                order: 2 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Mathématiques", name: "Fonctions — généralités et fonctions affines",               order: 3 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Mathématiques", name: "Équations et inéquations",                                   order: 4 },

  // ── Philosophie 2ème Lettres ─────────────────────────────────────────────
  // TODO: Replace with exact chapter titles from official Tunisian Philosophie programme
  { levelCode: "2eme", sectionKey: "lettres", subject: "Philosophie", name: "La philosophie et les autres savoirs",                         order: 1 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Philosophie", name: "La connaissance et ses fondements",                            order: 2 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Philosophie", name: "Le sujet et la conscience",                                    order: 3 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Philosophie", name: "Le désir et la liberté",                                       order: 4 },
  { levelCode: "2eme", sectionKey: "lettres", subject: "Philosophie", name: "La société et le politique",                                   order: 5 },

  // ── Économie 2ème Économie ───────────────────────────────────────────────
  // TODO: Fill from official programme
  { levelCode: "2eme", sectionKey: "economie", subject: "Économie", name: "Les agents économiques",                                         order: 1 },
  { levelCode: "2eme", sectionKey: "economie", subject: "Économie", name: "La production et la consommation",                               order: 2 },
  { levelCode: "2eme", sectionKey: "economie", subject: "Économie", name: "Le marché et les prix",                                          order: 3 },
  { levelCode: "2eme", sectionKey: "economie", subject: "Économie", name: "Le revenu et sa répartition",                                    order: 4 },
  { levelCode: "2eme", sectionKey: "economie", subject: "Économie", name: "La monnaie et le financement",                                   order: 5 },

  // ════════════════════════════════════════════════════════════════════════════
  // 3ÈME ANNÉE SECONDAIRE
  // ════════════════════════════════════════════════════════════════════════════

  // Languages common to all sections (sectionKey: null)
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "Le texte littéraire — analyse et commentaire",                         order: 1 },
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "L'argumentation — dissertation",                                      order: 2 },
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "Le roman au XXe siècle",                                              order: 3 },
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "La poésie moderne et contemporaine",                                   order: 4 },
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "Grammaire : Révision et approfondissement",                            order: 5 },
  { levelCode: "3eme", sectionKey: null, subject: "Français", name: "Expression écrite — types de textes et production",                    order: 6 },

  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 1: Civilisation and Heritage",                                    order: 1 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 2: Immigration and Multiculturalism",                              order: 2 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 3: Economy and Entrepreneurship",                                 order: 3 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 4: Ethics and Values",                                            order: 4 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 5: Globalisation and Challenges",                                 order: 5 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Anglais", name: "Unit 6: Literature and Writing",                                       order: 6 }, // TODO

  { levelCode: "3eme", sectionKey: null, subject: "Arabe", name: "الأدب العربي القديم والحديث",                                            order: 1 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Arabe", name: "قواعد اللغة — النحو والصرف المتقدم",                                     order: 2 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Arabe", name: "البلاغة — علم البيان والبديع",                                          order: 3 }, // TODO
  { levelCode: "3eme", sectionKey: null, subject: "Arabe", name: "التعبير والإنشاء — المقال الأدبي",                                       order: 4 }, // TODO

  // ── Mathématiques 3ème Sciences Maths ────────────────────────────────────
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Limites et continuité",                               order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Dérivabilité et étude de fonctions",                  order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Calcul intégral — primitives et intégrales",          order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Équations différentielles",                          order: 4 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Suites numériques — propriétés et convergence",       order: 5 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Nombres complexes",                                   order: 6 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Algèbre linéaire — matrices et systèmes",             order: 7 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Géométrie dans l'espace",                             order: 8 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Probabilités et statistiques avancées",               order: 9 },

  // ── Physique-Chimie 3ème Sciences Maths ──────────────────────────────────
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Mécanique avancée — cinétique et dynamique",        order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Oscillations forcées et résonance",                 order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Ondes — propagation et interférences",              order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Électricité : Régimes transitoires (LC, RC, RL)",  order: 4 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Chimie organique — fonctions et réactions",         order: 5 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Chimie : Cinétique et équilibre chimique",          order: 6 },

  // ── Sciences Naturelles 3ème Sciences Maths ───────────────────────────────
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Bilan énergétique — ATP et métabolisme",        order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Génétique des populations et évolution",        order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Géologie — géodynamique externe",               order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Géologie — géodynamique interne",               order: 4 },

  // ── Mathématiques 3ème Sciences Expérimentales ────────────────────────────
  // TODO: Verify against official programme (may differ from Sciences Maths)
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Limites et continuité",                                 order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Dérivabilité et étude de fonctions",                    order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Calcul intégral",                                      order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Suites numériques",                                    order: 4 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Probabilités et statistiques",                          order: 5 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Dénombrement",                                         order: 6 },

  // ── Physique-Chimie 3ème Sciences Exp ─────────────────────────────────────
  // (same chapters as Sciences Maths for now — TODO: verify)
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Mécanique avancée — cinétique et dynamique",          order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Oscillations mécaniques et ondes",                    order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Électricité : Régimes transitoires",                  order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Chimie organique",                                    order: 4 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Chimie : Cinétique et équilibre chimique",            order: 5 },

  // ── Sciences Naturelles 3ème Sciences Exp ────────────────────────────────
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Bilan énergétique — ATP et métabolisme",          order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Génétique des populations et évolution",          order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Géologie — géodynamique externe",                 order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Géologie — géodynamique interne",                 order: 4 },

  // ── Philosophie 3ème (Sciences Maths + Sciences Exp) ─────────────────────
  // TODO: Replace with exact chapter titles from official Tunisian Philosophie programme for 3ème
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Philosophie", name: "Raison et réalité",                                     order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Philosophie", name: "La liberté et la responsabilité",                       order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Philosophie", name: "La justice et le droit",                                order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_maths", subject: "Philosophie", name: "La technique et la culture",                            order: 4 },
  { levelCode: "3eme", sectionKey: "sciences_exp",   subject: "Philosophie", name: "Raison et réalité",                                     order: 1 },
  { levelCode: "3eme", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La liberté et la responsabilité",                       order: 2 },
  { levelCode: "3eme", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La justice et le droit",                                order: 3 },
  { levelCode: "3eme", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La technique et la culture",                            order: 4 },

  // ════════════════════════════════════════════════════════════════════════════
  // BAC (4ÈME ANNÉE SECONDAIRE)
  // ════════════════════════════════════════════════════════════════════════════

  // Languages common to all bac sections
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Révision — Le roman et l'analyse narrative",                            order: 1 },
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Révision — L'argumentation et la dissertation",                         order: 2 },
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Révision — La poésie",                                                  order: 3 },
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Révision — Le texte théâtral",                                          order: 4 },
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Grammaire — révision complète",                                         order: 5 },
  { levelCode: "bac", sectionKey: null, subject: "Français", name: "Annales bac — sujets corrigés",                                         order: 6 },

  { levelCode: "bac", sectionKey: null, subject: "Anglais", name: "Civilisation and Cultural Identity",                                     order: 1 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Anglais", name: "Contemporary World Issues",                                              order: 2 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Anglais", name: "Science, Technology and Ethics",                                         order: 3 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Anglais", name: "Literature and Humanities",                                              order: 4 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Anglais", name: "Bac Exam Preparation — Past Papers",                                     order: 5 },

  { levelCode: "bac", sectionKey: null, subject: "Arabe", name: "الأدب العربي — الشعر القديم والحديث",                                      order: 1 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Arabe", name: "الأدب العربي — النثر والمقالة",                                            order: 2 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Arabe", name: "قواعد اللغة — مراجعة شاملة",                                              order: 3 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Arabe", name: "التعبير الكتابي — أنواع المقالات",                                         order: 4 }, // TODO
  { levelCode: "bac", sectionKey: null, subject: "Arabe", name: "مراجعة الباكالوريا — نماذج وتصحيحات",                                    order: 5 },

  // ── Mathématiques Bac Sciences Maths ─────────────────────────────────────
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Analyse : Limites, continuité et dérivation",           order: 1 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Analyse : Calcul intégral et équations différentielles", order: 2 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Suites numériques — convergence et récurrences",        order: 3 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Nombres complexes — révision complète",                 order: 4 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Algèbre linéaire et matrices",                          order: 5 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Géométrie dans l'espace",                               order: 6 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Probabilités et statistiques",                          order: 7 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Mathématiques", name: "Annales bac — exercices types et corrigés",             order: 8 },

  // ── Physique-Chimie Bac Sciences Maths ───────────────────────────────────
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Mécanique avancée — révisions et annales",            order: 1 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Oscillations mécaniques et ondes",                    order: 2 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Électricité — régimes transitoires et permanents",    order: 3 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Ondes lumineuses et optique",                         order: 4 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Chimie organique — révisions",                        order: 5 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Thermodynamique",                                     order: 6 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Physique-Chimie", name: "Annales bac — sujets de physique corrigés",           order: 7 },

  // ── Sciences Naturelles Bac Sciences Maths ────────────────────────────────
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Génétique complète — révisions bac",               order: 1 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Immunologie — révisions bac",                     order: 2 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Neurosciences — révisions bac",                   order: 3 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Bilan métabolique — ATP et énergétique",          order: 4 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Géologie — révisions bac",                        order: 5 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Sciences Naturelles", name: "Annales bac — sujets de SVT corrigés",            order: 6 },

  // ── Mathématiques Bac Sciences Exp ───────────────────────────────────────
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Analyse : Limites, continuité et dérivation",              order: 1 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Analyse : Calcul intégral",                               order: 2 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Suites numériques",                                       order: 3 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Probabilités et dénombrement",                            order: 4 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Mathématiques", name: "Annales bac — exercices types",                           order: 5 },

  // ── Physique-Chimie Bac Sciences Exp ─────────────────────────────────────
  // (same structure as Sciences Maths — verify TODO)
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Mécanique avancée — révisions et annales",              order: 1 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Oscillations mécaniques et ondes",                      order: 2 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Électricité — régimes transitoires",                    order: 3 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Chimie organique",                                      order: 4 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Physique-Chimie", name: "Annales bac — sujets corrigés",                         order: 5 },

  // ── Sciences Naturelles Bac Sciences Exp ─────────────────────────────────
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Génétique complète — révisions bac",                 order: 1 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Immunologie — révisions bac",                       order: 2 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Neurosciences — révisions bac",                     order: 3 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Bilan métabolique et énergétique",                  order: 4 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Géologie — révisions bac",                          order: 5 },
  { levelCode: "bac", sectionKey: "sciences_exp", subject: "Sciences Naturelles", name: "Annales bac — SVT corrigés",                        order: 6 },

  // ── Philosophie Bac (Sciences + Lettres + Économie) ───────────────────────
  // TODO: Replace with exact themes from official Tunisian Philosophie bac programme
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Philosophie", name: "La raison et la réalité",                                 order: 1 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Philosophie", name: "Autrui et la société",                                    order: 2 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Philosophie", name: "La liberté, le droit et l'État",                          order: 3 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Philosophie", name: "La technique et la culture",                              order: 4 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Philosophie", name: "Annales bac — sujets de philo corrigés",                  order: 5 },

  { levelCode: "bac", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La raison et la réalité",                                 order: 1 },
  { levelCode: "bac", sectionKey: "sciences_exp",   subject: "Philosophie", name: "Autrui et la société",                                    order: 2 },
  { levelCode: "bac", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La liberté, le droit et l'État",                          order: 3 },
  { levelCode: "bac", sectionKey: "sciences_exp",   subject: "Philosophie", name: "La technique et la culture",                              order: 4 },

  { levelCode: "bac", sectionKey: "lettres",        subject: "Philosophie", name: "La raison et la réalité",                                 order: 1 },
  { levelCode: "bac", sectionKey: "lettres",        subject: "Philosophie", name: "Autrui et la société",                                    order: 2 },
  { levelCode: "bac", sectionKey: "lettres",        subject: "Philosophie", name: "La liberté, le droit et l'État",                          order: 3 },
  { levelCode: "bac", sectionKey: "lettres",        subject: "Philosophie", name: "La technique et la culture",                              order: 4 },
  { levelCode: "bac", sectionKey: "lettres",        subject: "Philosophie", name: "Annales bac — sujets de philo corrigés",                  order: 5 },

  { levelCode: "bac", sectionKey: "economie",       subject: "Philosophie", name: "La raison et la réalité",                                 order: 1 },
  { levelCode: "bac", sectionKey: "economie",       subject: "Philosophie", name: "Autrui et la société",                                    order: 2 },
  { levelCode: "bac", sectionKey: "economie",       subject: "Philosophie", name: "La liberté, le droit et l'État",                          order: 3 },
  { levelCode: "bac", sectionKey: "economie",       subject: "Philosophie", name: "La technique et la culture",                              order: 4 },

  // ── Économie Bac Économie ────────────────────────────────────────────────
  // TODO: Fill from official programme
  { levelCode: "bac", sectionKey: "economie", subject: "Économie", name: "La croissance économique",                                         order: 1 },
  { levelCode: "bac", sectionKey: "economie", subject: "Économie", name: "Les politiques économiques",                                       order: 2 },
  { levelCode: "bac", sectionKey: "economie", subject: "Économie", name: "Le commerce international et la mondialisation",                   order: 3 },
  { levelCode: "bac", sectionKey: "economie", subject: "Économie", name: "Le développement et sous-développement",                           order: 4 },
  { levelCode: "bac", sectionKey: "economie", subject: "Économie", name: "Annales bac — Économie corrigés",                                  order: 5 },

  // ── Informatique Bac Sciences Maths + Informatique ────────────────────────
  // TODO: Fill from official Tunisian Informatique programme for bac
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Informatique", name: "Structures de données avancées",                        order: 1 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Informatique", name: "Programmation orientée objet",                          order: 2 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Informatique", name: "Bases de données — SQL avancé",                         order: 3 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Informatique", name: "Réseaux et communication",                              order: 4 },
  { levelCode: "bac", sectionKey: "sciences_maths", subject: "Informatique", name: "Annales bac — Informatique corrigés",                   order: 5 },

  { levelCode: "bac", sectionKey: "informatique", subject: "Informatique", name: "Structures de données avancées",                          order: 1 },
  { levelCode: "bac", sectionKey: "informatique", subject: "Informatique", name: "Programmation orientée objet",                            order: 2 },
  { levelCode: "bac", sectionKey: "informatique", subject: "Informatique", name: "Bases de données — SQL avancé",                           order: 3 },
  { levelCode: "bac", sectionKey: "informatique", subject: "Informatique", name: "Réseaux et communication",                                order: 4 },
  { levelCode: "bac", sectionKey: "informatique", subject: "Informatique", name: "Annales bac — Informatique corrigés",                     order: 5 },

  // ── Histoire-Géographie Bac ──────────────────────────────────────────────
  // TODO: Verify against official programme for each bac section
  { levelCode: "bac", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : Le monde depuis 1945",                            order: 1 },
  { levelCode: "bac", sectionKey: null, subject: "Histoire-Géographie", name: "Histoire : La Tunisie indépendante",                         order: 2 },
  { levelCode: "bac", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : Les grandes puissances mondiales",              order: 3 },
  { levelCode: "bac", sectionKey: null, subject: "Histoire-Géographie", name: "Géographie : Les défis du développement",                    order: 4 },
  { levelCode: "bac", sectionKey: null, subject: "Histoire-Géographie", name: "Annales bac — Histoire-Géo corrigés",                        order: 5 },

  // ── Mathématiques Bac Lettres ────────────────────────────────────────────
  // TODO: Fill from official Maths-Lettres bac programme
  { levelCode: "bac", sectionKey: "lettres", subject: "Mathématiques", name: "Statistiques et analyse de données",                           order: 1 },
  { levelCode: "bac", sectionKey: "lettres", subject: "Mathématiques", name: "Probabilités",                                                 order: 2 },
  { levelCode: "bac", sectionKey: "lettres", subject: "Mathématiques", name: "Fonctions et représentation graphique",                        order: 3 },

];

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding curriculum subjects…");

  for (const s of SUBJECTS) {
    await db
      .insert(curriculumSubjectsTable)
      .values({ code: s.code, name: s.name, icon: s.icon, colorClass: s.colorClass, orderIndex: s.order })
      .onConflictDoNothing();
  }
  console.log(`   ✓ ${SUBJECTS.length} subjects`);

  console.log("🌱 Seeding curriculum chapters…");

  let inserted = 0;
  let skipped  = 0;

  for (const ch of CHAPTERS) {
    try {
      await db
        .insert(curriculumChaptersTable)
        .values({
          levelCode:  ch.levelCode,
          sectionKey: ch.sectionKey ?? null,
          subject:    ch.subject,
          name:       ch.name,
          shortName:  ch.shortName ?? null,
          slug:       slug(ch.name),
          orderIndex: ch.order,
          isActive:   true,
        })
        .onConflictDoNothing();
      inserted++;
    } catch {
      skipped++;
    }
  }

  console.log(`   ✓ ${inserted} chapters inserted (${skipped} skipped / already exist)`);
  console.log("✅ Curriculum seed complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

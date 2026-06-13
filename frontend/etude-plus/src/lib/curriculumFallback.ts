/**
 * Local curriculum fallback — used when the API is unavailable or returns no data.
 *
 * Keys are "${levelCode}/${uiSubjectName}" — must match educationConfig.ts subject names.
 * Note: 1ère secondaire DB subject names differ from UI names; the mapping is:
 *   "Technique"           ← DB "Technologie"
 *   "Sciences Naturelles" ← DB "Sciences de la Vie et de la Terre"
 *   "Physique-Chimie"     ← DB "Sciences Physiques"
 *   "Géographie"          ← DB "الجغرافيا"
 *   "Histoire"            ← DB "التاريخ"
 *   "Éducation Islamique" ← DB "اللغة العربية / التربية الإسلامية"
 */

export interface FallbackChapter {
  name:  string;
  group: string | null;
}

export const CURRICULUM_FALLBACK: Record<string, FallbackChapter[]> = {

  // ── Mathématiques 1ère ─────────────────────────────────────────────────────
  "1ere_secondaire/Mathématiques": [
    { name: "Angles",                                                                                   group: "Travaux géométriques" },
    { name: "Théorème de Thalès et sa réciproque",                                                      group: "Travaux géométriques" },
    { name: "Rapports trigonométriques d'un angle aigu; Relations métriques dans un triangle rectangle", group: "Travaux géométriques" },
    { name: "Vecteurs et translations",                                                                 group: "Travaux géométriques" },
    { name: "Somme de deux vecteurs - Vecteurs colinéaires",                                            group: "Travaux géométriques" },
    { name: "Activités dans un repère",                                                                 group: "Travaux géométriques" },
    { name: "Quart de tour",                                                                            group: "Travaux géométriques" },
    { name: "Sections planes d'un solide",                                                              group: "Travaux géométriques" },
    { name: "Activités numériques I",                                                                   group: "Travaux numériques"   },
    { name: "Activités numériques II",                                                                  group: "Travaux numériques"   },
    { name: "Activités algébriques",                                                                    group: "Travaux numériques"   },
    { name: "Fonctions linéaires",                                                                      group: "Travaux numériques"   },
    { name: "Équations et inéquations du premier degré à une inconnue",                                 group: "Travaux numériques"   },
    { name: "Fonctions affines",                                                                        group: "Travaux numériques"   },
    { name: "Systèmes de deux équations à deux inconnues",                                              group: "Travaux numériques"   },
    { name: "Exploitation de l'information",                                                            group: "Travaux numériques"   },
  ],

  // ── Technique 1ère ─────────────────────────────────────────────────────────
  "1ere_secondaire/Technique": [
    { name: "Analyse fonctionnelle d'un système technique",                         group: "Analyse fonctionnelle"                  },
    { name: "Lecture d'un dessin d'ensemble",                                       group: "Analyse structurelle et conception"     },
    { name: "Graphe de montage et graphe de démontage",                             group: "Analyse structurelle et conception"     },
    { name: "Dessin de définition",                                                 group: "Analyse structurelle et conception"     },
    { name: "Dessin assisté par ordinateur (DAO)",                                  group: "Analyse structurelle et conception"     },
    { name: "Liaisons mécaniques",                                                  group: "Analyse structurelle et conception"     },
    { name: "Systèmes combinatoires",                                               group: "Analyse structurelle et conception"     },
    { name: "Transmission de puissance",                                            group: "Analyse structurelle et conception"     },
    { name: "Matériaux utilisés",                                                   group: "Les matériaux utilisés"                 },
    { name: "Énergies renouvelables",                                               group: "Les énergies mises en œuvre"            },
    { name: "Convertisseurs statiques d'énergie électrique",                        group: "Les énergies mises en œuvre"            },
    { name: "Projet 1: Robot suiveur de ligne et éviteur d'obstacles",              group: "Réalisation et production"              },
    { name: "Programmation d'une carte de commande d'un système embarqué",          group: "Réalisation et production"              },
    { name: "Procédés de mise en forme des matériaux",                              group: "Réalisation et production"              },
    { name: "Procédés et typologie des assemblages",                                group: "Réalisation et production"              },
    { name: "Contrôle des composants",                                              group: "Réalisation et production"              },
    { name: "Projet 2: Lampe connectée",                                            group: "Réalisation et production"              },
    { name: "Fonction interfaçage",                                                 group: "Réalisation et production"              },
  ],

  // ── Sciences Naturelles 1ère ───────────────────────────────────────────────
  "1ere_secondaire/Sciences Naturelles": [
    { name: "La nutrition minérale",                                                group: "Amélioration de la production végétale" },
    { name: "La nutrition carbonée",                                                group: "Amélioration de la production végétale" },
    { name: "La multiplication végétative",                                         group: "Amélioration de la production végétale" },
    { name: "La diversité du monde microbien",                                      group: "Microbes et santé"                      },
    { name: "Les agents pathogènes et les maladies infectieuses",                   group: "Microbes et santé"                      },
    { name: "La défense de l'organisme",                                            group: "Microbes et santé"                      },
    { name: "Étude d'un site géologique",                                           group: "Découverte et gestion des ressources géologiques" },
    { name: "Exploitation et gestion d'une roche à intérêt économique: le phosphate", group: "Découverte et gestion des ressources géologiques" },
  ],

  // ── Physique-Chimie 1ère ───────────────────────────────────────────────────
  "1ere_secondaire/Physique-Chimie": [
    { name: "Le phénomène d'électrisation",                                         group: "L'Électricité" },
    { name: "Le circuit électrique",                                                group: "L'Électricité" },
    { name: "L'intensité du courant électrique",                                    group: "L'Électricité" },
    { name: "La tension électrique",                                                group: "L'Électricité" },
    { name: "Le dipôle résistor",                                                   group: "L'Électricité" },
    { name: "Les états physiques de la matière",                                    group: "La Matière"    },
    { name: "Quelques propriétés de la matière",                                    group: "La Matière"    },
    { name: "La masse",                                                             group: "La Matière"    },
    { name: "Les changements d'état physique d'un corps pur",                       group: "La Matière"    },
    { name: "Constitution de la matière",                                           group: "La Matière"    },
    { name: "Structure de la matière à l'échelle microscopique",                    group: "La Matière"    },
    { name: "Discontinuité de la matière",                                          group: "La Matière"    },
    { name: "Atomes et ions simples",                                               group: "La Matière"    },
    { name: "Molécules et ions polyatomiques",                                      group: "La Matière"    },
    { name: "Utilisation des modèles moléculaires",                                 group: "La Matière"    },
    { name: "Structure de la matière à l'échelle macroscopique",                    group: "La Matière"    },
    { name: "Détermination expérimentale du volume molaire d'un liquide ou d'un solide", group: "La Matière" },
    { name: "La dissolution",                                                       group: "La Matière"    },
    { name: "Les effets thermiques de la dissolution",                              group: "La Matière"    },
    { name: "Concentration d'une solution",                                         group: "La Matière"    },
    { name: "Solubilité",                                                           group: "La Matière"    },
    { name: "Préparation d'une solution titrée",                                    group: "La Matière"    },
    { name: "Notion de réaction chimique",                                          group: "La Matière"    },
    { name: "Étude qualitative d'une réaction chimique",                            group: "La Matière"    },
    { name: "Étude quantitative d'une réaction chimique",                           group: "La Matière"    },
    { name: "Détermination expérimentale du volume molaire d'un gaz",               group: "La Matière"    },
    { name: "Les hydrocarbures",                                                    group: "La Matière"    },
    { name: "Le mouvement",                                                         group: "La Mécanique"  },
    { name: "Les actions mécaniques",                                               group: "La Mécanique"  },
    { name: "Forces et équilibre",                                                  group: "La Mécanique"  },
    { name: "Forces et pression",                                                   group: "La Mécanique"  },
    { name: "Énergie et contrôle",                                                  group: "L'Énergie"     },
    { name: "La Terre et l'univers",                                                group: "L'Astronomie"  },
    { name: "La lumière et sa propagation",                                         group: "L'Optique"     },
    { name: "Spectre de lumière et vision",                                         group: "L'Optique"     },
  ],

  // ── Français 1ère ──────────────────────────────────────────────────────────
  "1ere_secondaire/Français": [
    { name: "Module 1: Rencontres",                 group: null },
    { name: "Module 2: Scènes de la vie en France", group: null },
    { name: "Module 3: Jeunesse sans frontières",   group: null },
    { name: "Module 4: La société de consommation", group: null },
    { name: "Module 5: Sauvons la planète Terre",   group: null },
    { name: "Module 6: Passions",                   group: null },
    { name: "Module 7: Progrès et bonheur",         group: null },
  ],

  // ── Géographie 1ère ────────────────────────────────────────────────────────
  "1ere_secondaire/Géographie": [
    { name: "التوزع الجغرافي للسكان",                                   group: "الوحدة 1: الإنسان يعمر الأرض"                   },
    { name: "الحركة الديمغرافية للسكان",                                group: "الوحدة 1: الإنسان يعمر الأرض"                   },
    { name: "الحركية المجالية للسكان",                                  group: "الوحدة 1: الإنسان يعمر الأرض"                   },
    { name: "الانفجار الحضري",                                          group: "الوحدة 1: الإنسان يعمر الأرض"                   },
    { name: "تركيبة المدينة: دراسة حالة: القاهرة",                     group: "الوحدة 1: الإنسان يعمر الأرض"                   },
    { name: "الموارد المائية",                                          group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "الموارد المائية وتوزعها الجغرافي",                         group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "تعبئة المياه",                                             group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "رهانات الماء",                                             group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "الموارد النفطية",                                          group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "الموارد النفطية: الإنتاج والاستهلاك والمبادلات",           group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "رهانات النفط",                                             group: "الوحدة 2: الإنسان يستثمر الموارد الطبيعية"       },
    { name: "الإنسان والوسط الطبيعي",                                   group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "من المخاطر إلى الكوارث: الزلازل والبراكين",               group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "من المخاطر إلى الكوارث: الفيضانات",                       group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "تدهور الأوساط الطبيعية: مثال التصحر",                     group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "تدهور الأوساط الطبيعية: مثال تدهور الغابة المتوسطية",    group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "تدهور الأوساط الطبيعية: تعرية السواحل",                   group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
    { name: "الخضرسة",                                                  group: "الوحدة 3: الإنسان والأوساط الطبيعية"             },
  ],

  // ── Histoire 1ère ──────────────────────────────────────────────────────────
  "1ere_secondaire/Histoire": [
    { name: "الخصوصيات الحضارية",                                       group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "المؤسسات السياسية",                                        group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "الديانة",                                                   group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "إشعاع قرطاج",                                              group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "الميناء والتوسع التجاري",                                  group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "موسوعة ماغون",                                             group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "عبقرية حنبعل",                                             group: "قرطاج البونية وإشعاعها في المتوسط"               },
    { name: "الازدهار العمراني",                                        group: "قرطاج وإسهاماتها في الحضارة الرومانية"           },
    { name: "الازدهار الاقتصادي: الفلاحة",                             group: "قرطاج وإسهاماتها في الحضارة الرومانية"           },
    { name: "أبوليوس",                                                   group: "قرطاج وإسهاماتها في الحضارة الرومانية"           },
    { name: "القديس أوغسطينوس",                                         group: "قرطاج وإسهاماتها في الحضارة الرومانية"           },
    { name: "القيروان قاعدة الانتشار العربي الإسلامي",                  group: "القيروان ودورها في نشر الحضارة العربية الإسلامية" },
    { name: "الدور الاقتصادي للقيروان: أهمية النشاط التجاري",         group: "القيروان ودورها في نشر الحضارة العربية الإسلامية" },
    { name: "خصائص العمارة",                                            group: "القيروان ودورها في نشر الحضارة العربية الإسلامية" },
    { name: "الإشعاع الفكري",                                           group: "القيروان ودورها في نشر الحضارة العربية الإسلامية" },
    { name: "عمارة مدينة تونس",                                         group: "تونس في العهد الحفصي مركز إشعاع ثقافي"           },
    { name: "عبد الرحمان بن خلدون",                                     group: "تونس في العهد الحفصي مركز إشعاع ثقافي"           },
    { name: "إضاءات حول تاريخ تونس في العصر الحديث",                   group: "البلاد التونسية من الإصلاح إلى التحديث"           },
    { name: "الفكر الإصلاحي",                                           group: "البلاد التونسية من الإصلاح إلى التحديث"           },
    { name: "التجربة التونسية في مقاومة الاستعمار",                    group: "البلاد التونسية من الإصلاح إلى التحديث"           },
    { name: "تعصير الدولة وتحديث المجتمع",                             group: "البلاد التونسية من الإصلاح إلى التحديث"           },
  ],

  // ── Éducation Islamique 1ère ───────────────────────────────────────────────
  "1ere_secondaire/Éducation Islamique": [
    { name: "تلازم أركان العقيدة",                                      group: "فهمي لعقيدتي أعمق"                               },
    { name: "الإيمان عقيدة وممارسة",                                   group: "فهمي لعقيدتي أعمق"                               },
    { name: "الإيمان حسن المعاملة: هدي قرآني",                         group: "فهمي لعقيدتي أعمق"                               },
    { name: "تكامل العقل والنقل في إثبات حقيقة الغيب",                 group: "فهمي لعقيدتي أعمق"                               },
    { name: "طبيعة العلاقات الأسرية في الإسلام",                       group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "دور الأسرة في الارتقاء بالعلاقات الاجتماعية",            group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "المجادلة بالحسنى: هدي قرآني",                             group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "آداب الحوار",                                              group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "أثر الحوار في تحقيق التواصل بين الأجيال",                group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "أثر الإيمان في العلاقات الاجتماعية: هدي نبوي",           group: "أتواصل إيجابيا وأحاور الآخرين"                   },
    { name: "حقيقة النبوّة ومقتضياتها",                                group: "أتمثل قيم النبوة وأرصد حضورها في التاريخ"         },
    { name: "دور الأنبياء في الارتقاء بالوعي البشري",                  group: "أتمثل قيم النبوة وأرصد حضورها في التاريخ"         },
    { name: "النبوّة هداية وإصلاح: هدي قرآني",                         group: "أتمثل قيم النبوة وأرصد حضورها في التاريخ"         },
    { name: "الأنبياء بناة الحضارة: هدي نبوي",                         group: "أتمثل قيم النبوة وأرصد حضورها في التاريخ"         },
    { name: "الاجتهاد ضرورة شرعية: هدي نبوي",                         group: "أدرك تفاعل الإسلام مع قضايا الواقع"               },
    { name: "التشريع بالنص",                                            group: "أدرك تفاعل الإسلام مع قضايا الواقع"               },
    { name: "التشريع بالاجتهاد المستند إلى أصل سابق",                 group: "أدرك تفاعل الإسلام مع قضايا الواقع"               },
    { name: "التشريع بالاستحسان والرأي المستند إلى المصلحة",           group: "أدرك تفاعل الإسلام مع قضايا الواقع"               },
    { name: "خصائص الشريعة الإسلامية",                                 group: "أدرك تفاعل الإسلام مع قضايا الواقع"               },
    { name: "دلالات التوحيد",                                           group: "أتواصل مع الكون والطبيعة"                         },
    { name: "أبعاد التوحيد",                                            group: "أتواصل مع الكون والطبيعة"                         },
    { name: "الإنسان والطبيعة: هدي قرآني",                             group: "أتواصل مع الكون والطبيعة"                         },
    { name: "قيمة العمل في الإسلام",                                    group: "بالعمل نرقى"                                      },
    { name: "دور العمل في تحقيق الذات",                                group: "بالعمل نرقى"                                      },
    { name: "العمل قيمة حضارية",                                        group: "بالعمل نرقى"                                      },
    { name: "مقتضيات الإيمان: هدي قرآني",                              group: "بالعمل نرقى"                                      },
  ],
};

export function getFallbackChapters(levelCode: string, subject: string): FallbackChapter[] {
  return CURRICULUM_FALLBACK[`${levelCode}/${subject}`] ?? [];
}

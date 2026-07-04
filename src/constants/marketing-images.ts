/**
 * Production image paths — WebP only, under `/public/images/`.
 */
const IMG = '/images';

export const BRAND_IMAGES = {
  logoCaps: `${IMG}/brand/logo-caps.webp`,
  logoShort: `${IMG}/brand/logo-short.webp`,
} as const;

export const HERO_IMAGES = {
  homeBanner: `${IMG}/hero/home-banner.webp`,
} as const;

/** Real clinic photography */
export const CLINIC_IMAGES = {
  physioShoulderAssessment: `${IMG}/clinic/physio-shoulder-assessment.webp`,
  physioManualTherapy: `${IMG}/clinic/physio-manual-therapy.webp`,
  sportsSoccerAcademy: `${IMG}/clinic/sports-soccer-academy.webp`,
  sportsAgilityHurdles: `${IMG}/clinic/sports-agility-hurdles.webp`,
  athleteHamstringStretch: `${IMG}/clinic/athlete-hamstring-stretch.webp`,
  strengthBarbellTraining: `${IMG}/clinic/strength-barbell-training.webp`,
  performanceVo2Lab: `${IMG}/clinic/performance-vo2-lab.webp`,
  biomechanicsMotionCapture: `${IMG}/clinic/biomechanics-motion-capture.webp`,
  therapeuticYogaLunge: `${IMG}/clinic/therapeutic-yoga-lunge.webp`,
  groupCoachingSession: `${IMG}/clinic/group-coaching-session.webp`,
  rehabPlankSupervision: `${IMG}/clinic/rehab-plank-supervision.webp`,
  balanceBosuRehab: `${IMG}/clinic/balance-bosu-rehab.webp`,
  clinicianPortrait: `${IMG}/clinic/clinician-portrait.webp`,
  clinicInterior: `${IMG}/clinic/clinic-interior.webp`,
} as const;

/** Stock / AI service hero art (short filenames) */
export const SERVICE_STOCK_IMAGES = {
  nutrition: `${IMG}/services/nutrition-coaching.webp`,
} as const;

export const SERVICE_CATEGORY_IMAGES = {
  pain_relief_physiotherapy: CLINIC_IMAGES.physioManualTherapy,
  advanced_rehabilitation: CLINIC_IMAGES.balanceBosuRehab,
  massage_recovery: CLINIC_IMAGES.clinicianPortrait,
  nutrition_lifestyle: SERVICE_STOCK_IMAGES.nutrition,
  mental_wellness: CLINIC_IMAGES.groupCoachingSession,
  therapeutic_yoga: CLINIC_IMAGES.therapeuticYogaLunge,
  sports_performance: CLINIC_IMAGES.performanceVo2Lab,
} as const;

export const FEATURED_SERVICE_CARDS = {
  painPhysio: SERVICE_CATEGORY_IMAGES.pain_relief_physiotherapy,
  advancedRehab: SERVICE_CATEGORY_IMAGES.advanced_rehabilitation,
  massageRecovery: SERVICE_CATEGORY_IMAGES.massage_recovery,
  therapeuticYoga: SERVICE_CATEGORY_IMAGES.therapeutic_yoga,
  sportsPerformance: SERVICE_CATEGORY_IMAGES.sports_performance,
} as const;

export const ABOUT_IMAGES = {
  foundersGroup: `${IMG}/about/founders-group.webp`,
  teamAkshat: `${IMG}/about/dr-akshat-chouhan.webp`,
  teamDeepti: `${IMG}/about/team-deepti.webp`,
  homeVisits: `${IMG}/about/home-visits.webp`,
} as const;

/** Real clinic photos for location cards (by center slug) */
export const CLINIC_CENTER_IMAGES: Record<string, string> = {
  'h2h-kolkata-basdroni': CLINIC_IMAGES.clinicInterior,
  'h2h-bhubaneswar-motive': CLINIC_IMAGES.physioManualTherapy,
};

export const TEAM_IMAGES = {
  sayandeepPaul: `${IMG}/team/sayandeep-paul.webp`,
  rishav: `${IMG}/team/rishav.webp`,
  sayantan: `${IMG}/team/sayantan.webp`,
} as const;

/** Excellence gallery (homepage grid) — WebP in public/images/excellence */
const E = `${IMG}/excellence`;

export const EXCELLENCE_IMAGES = {
  archeryTeam: `${E}/archery-team.webp`,
  awardCeremony: `${E}/award-ceremony.webp`,
  awardCeremonyAlt: `${E}/award-ceremony-alt.webp`,
  bengalU19Cricket: `${E}/bengal-u19-cricket.webp`,
  cclCricket: `${E}/ccl-cricket.webp`,
  cclCricket2: `${E}/ccl-cricket-2.webp`,
  cclCricket3: `${E}/ccl-cricket-3.webp`,
  cricketMatch: `${E}/cricket-match.webp`,
  cricketMatchAlt: `${E}/cricket-match-alt.webp`,
  footballAthlete: `${E}/football-athlete.webp`,
  footballDuo: `${E}/football-duo.webp`,
  gymGroupAkshat: `${E}/gym-group-akshat.webp`,
  hockeyChampions: `${E}/hockey-champions.webp`,
  gymSessionAkshat: `${E}/gym-session-akshat.webp`,
  mensHockeyTeam: `${E}/mens-hockey-team.webp`,
  physioAkshat: `${E}/physio-akshat.webp`,
  leadershipVisit: `${E}/leadership-visit.webp`,
  rcbWomens: `${E}/rcb-womens.webp`,
  saiNcoeYoga: `${E}/sai-ncoe-yoga.webp`,
} as const;

/** All 19 excellence photos for GridMotionSection (two passes in component) */
export const EXCELLENCE_GALLERY = [
  EXCELLENCE_IMAGES.saiNcoeYoga,
  EXCELLENCE_IMAGES.hockeyChampions,
  EXCELLENCE_IMAGES.cclCricket,
  EXCELLENCE_IMAGES.cricketMatch,
  EXCELLENCE_IMAGES.footballDuo,
  EXCELLENCE_IMAGES.physioAkshat,
  EXCELLENCE_IMAGES.gymSessionAkshat,
  EXCELLENCE_IMAGES.rcbWomens,
  EXCELLENCE_IMAGES.bengalU19Cricket,
  EXCELLENCE_IMAGES.archeryTeam,
  EXCELLENCE_IMAGES.awardCeremony,
  EXCELLENCE_IMAGES.leadershipVisit,
  EXCELLENCE_IMAGES.mensHockeyTeam,
  EXCELLENCE_IMAGES.footballAthlete,
  EXCELLENCE_IMAGES.cclCricket2,
  EXCELLENCE_IMAGES.cricketMatchAlt,
  EXCELLENCE_IMAGES.gymGroupAkshat,
  EXCELLENCE_IMAGES.awardCeremonyAlt,
  EXCELLENCE_IMAGES.cclCricket3,
] as const;

export const PARTNER_LOGOS = [
  `${IMG}/partners/partner-01.webp`,
  `${IMG}/partners/partner-02.webp`,
  `${IMG}/partners/partner-03.webp`,
  `${IMG}/partners/partner-04.webp`,
  `${IMG}/partners/partner-05.webp`,
  `${IMG}/partners/partner-06.webp`,
  `${IMG}/partners/partner-07.webp`,
  `${IMG}/partners/partner-08.webp`,
  `${IMG}/partners/partner-09.webp`,
  `${IMG}/partners/partner-10.webp`,
] as const;

/** @deprecated Use CLINIC_IMAGES — kept for gradual migration */
export const MISC_IMAGES = CLINIC_IMAGES;

export const MARKETING_IMAGES = {
  physio: CLINIC_IMAGES.physioShoulderAssessment,
  videoIntro: CLINIC_IMAGES.physioManualTherapy,
  rehab: CLINIC_IMAGES.rehabPlankSupervision,
  sports: CLINIC_IMAGES.sportsSoccerAcademy,
  yoga: CLINIC_IMAGES.therapeuticYogaLunge,
  heroSectionBanner: HERO_IMAGES.homeBanner,
  contactUs: CLINIC_IMAGES.clinicianPortrait,
  activeRecovery: CLINIC_IMAGES.balanceBosuRehab,
  athleteTraining: CLINIC_IMAGES.sportsAgilityHurdles,
  yogaStudio: CLINIC_IMAGES.therapeuticYogaLunge,
  telehealth: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
  nutrition: SERVICE_STOCK_IMAGES.nutrition,
  mentalWellness: CLINIC_IMAGES.groupCoachingSession,
  aboutTrustedChampionsBanner: CLINIC_IMAGES.sportsSoccerAcademy,
  aboutMissionHealthcare: CLINIC_IMAGES.clinicInterior,
  aboutGroundTeamHands: CLINIC_IMAGES.groupCoachingSession,
} as const;

export const ABOUT_PAGE_IMAGES = {
  patientFirstCareHandshakeJpg: CLINIC_IMAGES.physioManualTherapy,
  patientFirstCareCard: CLINIC_IMAGES.physioManualTherapy,
  expertCareHands: CLINIC_IMAGES.physioShoulderAssessment,
  homeVisitsWide: ABOUT_IMAGES.homeVisits,
  evidenceLedWorkspace: CLINIC_IMAGES.clinicInterior,
} as const;

/** @deprecated Use EXCELLENCE_GALLERY */
export const EXCELLENCE_AND_MISC_GALLERY = EXCELLENCE_GALLERY;

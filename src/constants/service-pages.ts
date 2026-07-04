import { MARKETING_IMAGES, SERVICE_CATEGORY_IMAGES } from '@/constants/marketing-images';

export type ServiceColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'purple'
  | 'teal'
  | 'orange'
  | 'cyan';

export type ServiceProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type ServicePageContent = {
  title: string;
  tagline: string;
  intro: string;
  details: string;
  benefitsTitle: string;
  benefits: string[];
  process: ServiceProcessStep[];
  cta: {
    title: string;
    subtitle: string;
  };
  image: string;
  imageObjectClass?: string;
  color: ServiceColor;
};

/** Client-approved copy — H2H Healthcare Content Reference Document (2026) */
export const SERVICE_PAGE_CONTENT: Record<string, ServicePageContent> = {
  pain_relief_physiotherapy: {
    title: 'Pain Relief & Physiotherapy Care',
    tagline: 'Move Better. Recover Smarter. Perform Stronger.',
    intro:
      'Pain should never define how you live, move, or perform. Whether it\'s persistent discomfort or a performance-limiting injury, we deliver a bespoke physiotherapy experience that blends clinical expertise with advanced movement science.',
    details:
      'Every program is thoughtfully designed—combining precision treatment, curated exercise, and refined recovery strategies to restore not just function, but confidence and control.',
    benefitsTitle: 'The Difference You Feel',
    benefits: [
      'A refined, movement-first approach that reduces reliance on medication',
      'Tailored programs designed around your lifestyle, sport, and goals',
      'Clear, expert guidance delivered with simplicity and precision',
      'Comprehensive care for joints, muscles, and long-term mobility',
      'Discreet, personalized attention in a premium clinical environment',
      'Sustainable recovery focused on lasting results—not temporary relief',
    ],
    process: [
      {
        step: '01',
        title: 'Understand You',
        description: 'We listen to your pain, history, and goals',
      },
      {
        step: '02',
        title: 'Assess Precisely',
        description: 'Movement analysis to identify root causes',
      },
      {
        step: '03',
        title: 'Treat Strategically',
        description: 'Hands-on therapy with targeted exercise plans',
      },
      {
        step: '04',
        title: 'Sustain Progress',
        description: 'Long-term habits and guided follow-ups',
      },
    ],
    cta: {
      title: 'Start Your Recovery Journey',
      subtitle:
        'Book your assessment and take the first step toward lasting performance.',
    },
    image: SERVICE_CATEGORY_IMAGES.pain_relief_physiotherapy,
    color: 'red',
  },

  advanced_rehabilitation: {
    title: 'Advanced Rehabilitation & Recovery',
    tagline: 'Restore Strength. Rebuild Confidence. Return to Life—Stronger.',
    intro:
      'Recovery after surgery, stroke, or serious injury requires more than time—it demands structured, expert-led progression.',
    details:
      'At H2H, we deliver a personalized rehabilitation journey designed to restore movement, rebuild strength, and help you regain independence with confidence. Every step is guided, measured, and adapted to your pace. Recovery isn\'t linear—and we respect that. From walking further to returning to work or daily life, we focus on meaningful milestones that truly matter to you. When needed, we involve your family—ensuring clarity, support, and confidence throughout your journey.',
    benefitsTitle: 'The Difference You Experience',
    benefits: [
      'A clear, structured roadmap—no uncertainty',
      'Comprehensive care for orthopedic, neurological, and post-hospital recovery',
      'Tailored equipment and progressive exercise systems',
      'Measurable outcomes you can feel in daily life',
      'Continuous refinement as your strength improves',
      'Clear, supportive guidance for both you and your family',
    ],
    process: [
      {
        step: '01',
        title: 'Establish Your Baseline',
        description:
          'We assess your movement, balance, and current capacity safely',
      },
      {
        step: '02',
        title: 'Define Meaningful Goals',
        description:
          'Aligned with your life—home, work, and independence',
      },
      {
        step: '03',
        title: 'Progressive Rehabilitation',
        description:
          'Structured sessions that build strength step by step',
      },
      {
        step: '04',
        title: 'Return to Real Life',
        description:
          'Functional training for everyday activities and transitions',
      },
    ],
    cta: {
      title: 'Begin Your Recovery Journey',
      subtitle:
        'Book your consultation and take the first step toward confident recovery.',
    },
    image: SERVICE_CATEGORY_IMAGES.advanced_rehabilitation,
    color: 'blue',
  },

  massage_recovery: {
    title: 'Massage & Recovery',
    tagline: 'Relax, Restore, and Recover with Expert Touch.',
    intro:
      'Our massage and recovery programs combine skilled manual therapy with targeted recovery strategies to ease tension, reduce pain, and restore optimal movement.',
    details:
      'Whether you need sports recovery, chronic muscle relief, or post-workout restoration, H2H provides gentle and effective hands-on care designed to accelerate healing and support long-term performance. Every session is tailored to your body, goals, and recovery timeline.',
    benefitsTitle: 'Recovery You Can Feel',
    benefits: [
      'Targeted muscle release for faster recovery',
      'Reduced tension, stiffness, and post-exercise soreness',
      'Improved circulation to support healing',
      'Professional care for athletes and everyday movement',
      'Gentle techniques that balance comfort with results',
      'A recovery plan built around your schedule and goals',
    ],
    process: [
      {
        step: '01',
        title: 'Assess Muscle Tone',
        description: 'We identify tightness, trigger points, and movement restrictions',
      },
      {
        step: '02',
        title: 'Targeted Touch',
        description: 'Focused manual therapy to release tension and relieve pain',
      },
      {
        step: '03',
        title: 'Recovery Support',
        description: 'Guided mobility and self-care recommendations',
      },
      {
        step: '04',
        title: 'Feel Better Sooner',
        description: 'Follow-up guidance to keep recovery moving forward',
      },
    ],
    cta: {
      title: 'Book Your Recovery Session',
      subtitle:
        'Enjoy expert manual therapy and restore comfort quickly.',
    },
    image: SERVICE_CATEGORY_IMAGES.massage_recovery,
    color: 'teal',
  },

  nutrition_lifestyle: {
    title: 'Nutrition & Lifestyle Care',
    tagline: 'Fuel Your Body. Support Your Performance. Sustain Your Health.',
    intro:
      'Nutrition isn\'t about restriction—it\'s about building sustainable habits that work in real life.',
    details:
      'We provide practical, culturally relevant guidance tailored to your goals—whether it\'s energy, weight management, metabolic health, or sports performance.',
    benefitsTitle: 'Why It Works',
    benefits: [
      'Real-world meal strategies for busy lifestyles',
      'Support for weight, energy, and metabolic health',
      'Evidence-based sports nutrition guidance',
      'Small, sustainable habit changes',
      'Personalized plans built around your routine',
      'Continuous support and adaptation',
    ],
    process: [
      {
        step: '01',
        title: 'Understand Your Habits',
        description: 'Review your current nutrition without judgment',
      },
      {
        step: '02',
        title: 'Define Your Goals',
        description: 'Align nutrition with health or performance targets',
      },
      {
        step: '03',
        title: 'Build Your Plan',
        description: 'Simple, practical, and sustainable strategies',
      },
      {
        step: '04',
        title: 'Adapt & Improve',
        description: 'Ongoing support as your needs evolve',
      },
    ],
    cta: {
      title: 'Start Your Nutrition Journey',
      subtitle: 'Book your consultation and build a plan that works.',
    },
    image: SERVICE_CATEGORY_IMAGES.nutrition_lifestyle,
    color: 'green',
  },

  mental_wellness: {
    title: 'Mental Wellness & Performance Care',
    tagline: 'Strengthen the Mind. Elevate Performance. Build Resilience.',
    intro:
      'Performance isn\'t just physical. Stress, pressure, focus, and confidence all shape outcomes—on the field, at work, and in daily life.',
    details:
      'We provide practical, performance-focused mental strategies to help you stay sharp, composed, and resilient.',
    benefitsTitle: 'Why It Works',
    benefits: [
      'Safe, confidential space for open conversations',
      'Practical tools for stress, sleep, and focus',
      'Support for athletes, professionals, and students',
      'No labels—just actionable guidance',
      'Strategies for recovery from setbacks',
      'Balance between performance and wellbeing',
    ],
    process: [
      {
        step: '01',
        title: 'Understand Challenges',
        description: 'Identify stress, sleep, and performance barriers',
      },
      {
        step: '02',
        title: 'Define Solutions',
        description: 'Personalized mental strategies',
      },
      {
        step: '03',
        title: 'Apply & Practice',
        description: 'Simple tools for real-world situations',
      },
      {
        step: '04',
        title: 'Evolve & Adapt',
        description: 'Continuous refinement with life demands',
      },
    ],
    cta: {
      title: 'Start Your Mental Performance Journey',
      subtitle: 'Take control of your performance and wellbeing.',
    },
    image: SERVICE_CATEGORY_IMAGES.mental_wellness,
    color: 'purple',
  },

  therapeutic_yoga: {
    title: 'Therapeutic Yoga & Wellness',
    tagline: 'Move Freely. Breathe Better. Restore Balance.',
    intro:
      'Our therapeutic yoga is designed for real bodies—not perfect ones. Whether you\'re recovering, managing stiffness, or building flexibility, sessions are adapted to your needs.',
    details:
      'We combine movement, breath, and control to improve mobility, reduce stress, and enhance recovery.',
    benefitsTitle: 'Why It Works',
    benefits: [
      'Safe, adaptable practices for all levels',
      'Breathwork for stress and nervous system control',
      'Improved flexibility without strain',
      'Complements physiotherapy and recovery',
      'Calm, guided environment',
      'Simple routines for home practice',
    ],
    process: [
      {
        step: '01',
        title: 'Understand Your Body',
        description: 'Pain, mobility, and goals assessment',
      },
      {
        step: '02',
        title: 'Personalize the Flow',
        description: 'Sequences tailored to your level',
      },
      {
        step: '03',
        title: 'Guided Practice',
        description: 'Safe, structured sessions',
      },
      {
        step: '04',
        title: 'Build Consistency',
        description: 'Simple routines for daily life',
      },
    ],
    cta: {
      title: 'Start Your Wellness Journey',
      subtitle: 'Restore balance with guided therapeutic movement.',
    },
    image: SERVICE_CATEGORY_IMAGES.therapeutic_yoga,
    imageObjectClass: 'object-cover object-[center_35%]',
    color: 'teal',
  },

  sports_performance: {
    title: 'Sports Performance & Athlete Development',
    tagline: 'Train with Precision. Perform with Confidence. Compete at Your Best.',
    intro:
      'Performance is not accidental—it\'s engineered.',
    details:
      'Our H2H Absolute Performance Programme integrates training, injury prevention, and rehabilitation science to help you move better, train smarter, and perform consistently at your highest level. Whether you\'re a competitive athlete or committed to personal excellence, we analyze how you move, identify limitations, and build strength, speed, and resilience—without breakdown or setbacks.',
    benefitsTitle: 'The Difference You Experience',
    benefits: [
      'A clear understanding of your body and sport-specific demands',
      'Training and warm-up strategies aligned with your season',
      'Reduced risk of recurring injuries and performance setbacks',
      'Structured return-to-sport pathways after injury or surgery',
      'Support for individuals, teams, and academies',
      'Honest, expert guidance on load, recovery, and performance balance',
    ],
    process: [
      {
        step: '01',
        title: 'Performance Assessment',
        description:
          'We evaluate movement, strength, and sport-specific demands',
      },
      {
        step: '02',
        title: 'Risk Identification',
        description: 'Pinpoint weaknesses that may lead to injury',
      },
      {
        step: '03',
        title: 'Targeted Training Plan',
        description: 'Structured sessions aligned with your training calendar',
      },
      {
        step: '04',
        title: 'Ongoing Performance Optimization',
        description: 'Regular monitoring to keep you match-ready',
      },
    ],
    cta: {
      title: 'Elevate Your Performance',
      subtitle:
        'Start your assessment and unlock your full athletic potential.',
    },
    image: SERVICE_CATEGORY_IMAGES.sports_performance,
    color: 'orange',
  },

  digital_health: {
    title: 'Digital Health & Web Solutions',
    tagline: 'Care Beyond the Clinic. Connected When It Matters.',
    intro:
      'Life doesn\'t always stop at the clinic door. Video consults, online exercise plans, and follow-ups from your phone or laptop help you stay on track.',
    details:
      'Whether you travel, live outside the city, or need support between in-person appointments, you still get real clinicians—not bots. Flexible times, exercise demos you can replay, and check-ins so you don\'t lose momentum.',
    benefitsTitle: 'Why It Works',
    benefits: [
      'Talk to a clinician from home or while travelling',
      'Flexible times that suit work and family',
      'Exercise demos you can replay anytime',
      'Check-ins so you don\'t lose momentum',
      'Less travel when pain or mobility makes trips hard',
      'A bridge between face-to-face visits when you need it',
    ],
    process: [
      {
        step: '01',
        title: 'Book Online',
        description: 'Pick a slot and get a simple video link',
      },
      {
        step: '02',
        title: 'First Video Chat',
        description: 'We assess and explain next steps clearly',
      },
      {
        step: '03',
        title: 'Your Home Programme',
        description: 'Exercises and reminders you can follow remotely',
      },
      {
        step: '04',
        title: 'Stay Connected',
        description: 'Follow-up calls or messages to keep progress going',
      },
    ],
    cta: {
      title: 'Start Your Digital Care Journey',
      subtitle: 'Book a virtual consultation and stay on track from anywhere.',
    },
    image: MARKETING_IMAGES.telehealth,
    color: 'cyan',
  },
};

/** COMMON_READY_CTA_01 — reusable bottom CTA block */
export const SERVICE_READY_CTA = {
  title: 'Ready to Get Started?',
  subtitle:
    'Book your appointment today and take the first step towards recovery',
} as const;

export const SERVICE_PAGE_SLUGS = Object.keys(
  SERVICE_PAGE_CONTENT
) as (keyof typeof SERVICE_PAGE_CONTENT)[];

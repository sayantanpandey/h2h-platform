import {
  Activity,
  Heart,
  Dumbbell,
  Leaf,
  Video,
  Calendar,
  CalendarDays,
  Handshake,
  MapPin,
  MapPinned,
  Phone,
  Users,
  UsersRound,
  Award,
  Trophy,
} from "lucide-react";
import { MARKETING_IMAGES, PARTNER_LOGOS, SERVICE_CATEGORY_IMAGES } from "@/constants/marketing-images";

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Heart,
  Dumbbell,
  Leaf,
};

/** Used by `StatsSection` (optional); keep numeric fields valid for `Counter`. */
export const stats = [
  { label: "Happy Patients", value: 1000, suffix: "+", icon: Users },
  { label: "Expert Doctors", value: 50, suffix: "+", icon: Award },
  { label: "Cities", value: 8, suffix: "+", icon: MapPin },
  { label: "Success Rate", value: 98, suffix: "%", icon: Trophy },
];

export const features = [
  {
    title: "Evidence-informed care",
    description: "Protocols grounded in sports medicine and rehab research.",
    icon: Phone,
  },
  {
    title: "Plans you can follow",
    description: "Written goals, exercises, and review dates—not vague advice.",
    icon: MapPin,
  },
  {
    title: "Home visits (where available)",
    description: "Same specialists when travel is hard—check your pin code at booking.",
    icon: Calendar,
  },
  {
    title: "Expert physiotherapists",
    description: "Licensed clinicians; many with sports and hospital backgrounds.",
    icon: Video,
  },
];

export const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Professional Cricketer",
    content: "H2H helped me recover from my ACL injury in record time. The physiotherapists are world-class!",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "IT Professional",
    content: "After years of back pain, I finally found relief with their pain management program.",
    rating: 5,
  },
  {
    name: "Amit Kumar",
    role: "Fitness Enthusiast",
    content: "The sports rehab team understood my needs perfectly. Back to my routine in no time!",
    rating: 5,
  },
];

/** Partner collaboration cards for the homepage showcase */
export const trustedPartnerLogos = [
  {
  src: PARTNER_LOGOS[0],
  alt: "TSAF logo",
  title: "TSAF",
  description: "Endurance and performance support.",
},
{
  src: PARTNER_LOGOS[1],
  alt: "Indian Mountaineering Foundation logo",
  title: "Indian Mountaineering Foundation",
  description: "Athlete conditioning and wellness support.",
},
{
  src: PARTNER_LOGOS[2],
  alt: "Cricket Association of Bengal crest",
  title: "Cricket Association of Bengal",
  description: "Performance support for competitive cricket.",
},
{
  src: PARTNER_LOGOS[3],
  alt: "BCCI logo",
  title: "The Board of Control for Cricket in India",
  description: "Supporting cricket education and officiating.",
},
{
  src: PARTNER_LOGOS[4],
  alt: "Archery Association of India logo",
  title: "Archery Association of India",
  description: "Athlete care and performance support.",
},
{
  src: PARTNER_LOGOS[5],
  alt: "TFA football crest",
  title: "TFA",
  description: "Football recovery and performance.",
},
{
  src: PARTNER_LOGOS[6],
  alt: "Jamshedpur FC logo",
  title: "Jamshedpur FC",
  description: "Sports science and rehabilitation.",
},
{
  src: PARTNER_LOGOS[7],
  alt: "India Football crest",
  title: "All India Football Federation",
  description: "Football wellness and performance.",
},
{
  src: PARTNER_LOGOS[8],
  alt: "SAI logo",
  title: "Sports Authority of India",
  description: "Event Support & Sports Science Services.",
},
{
  src: PARTNER_LOGOS[9],
  alt: "Indian Kayaking and Canoeing Association logo",
  title: "Indian Kayaking & Canoeing Association",
  description: "Multisport athlete support.",
},
] as const;

export const trustedPartnerStats = [
  {
    value: "08+",
    label: "Events Participated",
    icon: CalendarDays,
  },
  {
    value: "10+",
    label: "Organizations Engaged",
    icon: UsersRound,
  },
  {
    value: "15+",
    label: "Initiatives Supported",
    icon: Handshake,
  },
  {
    value: "04+",
    label: "States Covered",
    icon: MapPinned,
  },
] as const;

export const cities = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad',
];

export const treatmentSteps = [
  { step: '01', title: 'Assessment', desc: 'Comprehensive evaluation of your condition', color: 'cyan' },
  { step: '02', title: 'Custom Plan', desc: 'Personalized treatment plan for you', color: 'blue' },
  { step: '03', title: 'Treatment', desc: 'Expert-guided therapy sessions', color: 'teal' },
  { step: '04', title: 'Recovery', desc: 'Ongoing support for lasting results', color: 'emerald' },
];

export const timeSlots = ['9:00 AM', '10:30 AM', '2:00 PM', '4:30 PM'];

export const blogPosts = [
  {
    href: '/blog/physiotherapy-benefits',
    title: 'How Physiotherapy Can Transform Your Daily Life',
    description: 'A deep dive into how regular physiotherapy sessions can improve mobility, reduce pain, and enhance your quality of life.',
    color: 'cyan',
    size: 'large',
    image: MARKETING_IMAGES.physio,
  },
  {
    href: '/blog/sports-injury-recovery',
    title: 'Sports Injury Recovery Guide',
    description:
      'How structured rehab and load management help you return to sport safely.',
    color: 'teal',
    size: 'small',
    image: MARKETING_IMAGES.sports,
  },
  {
    href: '/blog/home-exercises',
    title: '5 Home Exercises for Back Pain',
    description: 'Simple exercises you can do at home to relieve back pain and improve posture.',
    color: 'orange',
    size: 'small',
    image: MARKETING_IMAGES.athleteTraining,
  },
  {
    href: '/blog/cardiac-rehabilitation',
    title: 'Cardiac Rehabilitation: What to Expect',
    description: 'We reimagined cardiac care to make it faster to recover, easier to follow, and actually helpful.',
    color: 'purple',
    size: 'medium',
    image: MARKETING_IMAGES.activeRecovery,
  },
  {
    href: '/blog/yoga-wellness',
    title: 'Yoga & Wellness Tips',
    description: 'Discover how yoga can complement your physiotherapy journey for holistic wellness.',
    color: 'green',
    size: 'small',
    image: MARKETING_IMAGES.yoga,
  },
];

export const galleryItems = [
  { id: '1', img: MARKETING_IMAGES.physio, height: 280, title: 'Clinical assessment', description: 'Hands-on physiotherapy' },
  { id: '2', img: MARKETING_IMAGES.aboutMissionHealthcare, height: 350, title: 'Treatment space', description: 'Bright, equipped clinic rooms' },
  { id: '3', img: MARKETING_IMAGES.rehab, height: 240, title: 'Rehabilitation', description: 'Supervised recovery sessions' },
  { id: '4', img: MARKETING_IMAGES.sports, height: 320, title: 'Sports performance', description: 'Academy and field training' },
  { id: '5', img: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=380&fit=crop', height: 260, title: 'Gym Facilities', description: 'Strength training equipment' },
  { id: '6', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=420&fit=crop', height: 300, title: 'Consultation Room', description: 'Expert assessments' },
  { id: '7', img: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=350&fit=crop', height: 250, title: 'Hydrotherapy', description: 'Water-based treatments' },
  { id: '8', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop', height: 280, title: 'Recovery Zone', description: 'Rest and recuperation' },
];

/** Services list (usable by the Services page and other UI) */
export const SERVICES_LIST = [
  {
    id: 'pain_relief_physiotherapy',
    title: 'Pain Relief & Physiotherapy Care',
    description: 'Targeted treatment for pain management, injury recovery and mobility improvement.',
    href: '/services/pain_relief_physiotherapy',
    image: SERVICE_CATEGORY_IMAGES.pain_relief_physiotherapy,
    imageAlt: 'Physiotherapy assessment',
  },
  {
    id: 'advanced_rehabilitation',
    title: 'Advanced Rehabilitation & Recovery',
    description: 'Personalized rehab programs to restore movement, strength and function after injury or surgery.',
    href: '/services/advanced_rehabilitation',
    image: SERVICE_CATEGORY_IMAGES.advanced_rehabilitation,
    imageAlt: 'Rehabilitation session',
  },
  {
    id: 'massage_recovery',
    title: 'Massage & Recovery',
    description: 'Therapeutic massage to reduce muscle tension, improve circulation and promote faster recovery.',
    href: '/services/massage_recovery',
    image: SERVICE_CATEGORY_IMAGES.massage_recovery,
    imageAlt: 'Therapeutic massage',
  },
  {
    id: 'nutrition_lifestyle',
    title: 'Nutrition & Lifestyle Care',
    description: 'Diet and lifestyle guidance to support healing, energy and long-term well-being.',
    href: '/services/nutrition_lifestyle',
    image: SERVICE_CATEGORY_IMAGES.nutrition_lifestyle,
    imageAlt: 'Nutrition guidance',
  },
  {
    id: 'mental_wellness',
    title: 'Mental Wellness & Performance Care',
    description: 'Support for stress, focus, sleep and mental performance to help you feel your best.',
    href: '/services/mental_wellness',
    image: SERVICE_CATEGORY_IMAGES.mental_wellness,
    imageAlt: 'Mental wellness',
  },
  {
    id: 'therapeutic_yoga',
    title: 'Therapeutic Yoga & Wellness',
    description: 'Yoga-based therapies to improve flexibility, reduce stress and enhance overall well-being.',
    href: '/services/therapeutic_yoga',
    image: SERVICE_CATEGORY_IMAGES.therapeutic_yoga,
    imageAlt: 'Therapeutic yoga',
  },
  {
    id: 'sports_performance',
    title: 'Sports Performance & Athlete Development',
    description: 'Performance training, injury prevention and conditioning for athletes of all levels.',
    href: '/services/sports_performance',
    image: SERVICE_CATEGORY_IMAGES.sports_performance,
    imageAlt: 'Sports performance',
  },
  {
    id: 'digital_health',
    title: 'Digital Health & Web Solutions',
    description: 'Technology-driven solutions for better care, tracking and communication beyond the clinic.',
    href: '/services/digital_health',
    image: MARKETING_IMAGES.telehealth,
    imageAlt: 'Telehealth',
  },
];

export const mapMarkers = [
  { lat: 28.6139, lng: 77.209, size: 0.8 },   // New Delhi - HQ (larger)
  { lat: 19.076, lng: 72.8777, size: 0.5 },   // Mumbai
  { lat: 12.9716, lng: 77.5946, size: 0.5 },  // Bangalore
  { lat: 13.0827, lng: 80.2707, size: 0.4 },  // Chennai
  { lat: 22.5726, lng: 88.3639, size: 0.4 },  // Kolkata
  { lat: 17.385, lng: 78.4867, size: 0.4 },   // Hyderabad
  { lat: 25.2048, lng: 55.2708, size: 0.35 }, // Dubai
  { lat: 1.3521, lng: 103.8198, size: 0.35 }, // Singapore
  { lat: 51.5074, lng: -0.1278, size: 0.35 }, // London
  { lat: 40.7128, lng: -74.006, size: 0.35 }, // New York
];

export const globePositions = [
  { top: 50, left: 95 },      // 0°
  { top: 89, left: 72.5 },    // 60°
  { top: 89, left: 27.5 },    // 120°
  { top: 50, left: 5 },       // 180°
  { top: 11, left: 27.5 },    // 240°
  { top: 11, left: 72.5 },    // 300°
];

export const avatarUrls = [
  {
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=RS&backgroundColor=b6e3f4",
    profileUrl: "#",
  },
  {
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=PP&backgroundColor=c0aede",
    profileUrl: "#",
  },
  {
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=AK&backgroundColor=d1d4f9",
    profileUrl: "#",
  },
  {
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=MS&backgroundColor=ffd5dc",
    profileUrl: "#",
  },
];

export const loreleiAvatars = [
  { imageUrl: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Patient1&backgroundColor=b6e3f4', profileUrl: '#' },
  { imageUrl: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Patient2&backgroundColor=c0aede', profileUrl: '#' },
  { imageUrl: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Patient3&backgroundColor=d1d4f9', profileUrl: '#' },
  { imageUrl: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Patient4&backgroundColor=ffd5dc', profileUrl: '#' },
];

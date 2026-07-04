'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ABOUT_IMAGES, ABOUT_PAGE_IMAGES, MARKETING_IMAGES } from '@/constants/marketing-images';
import { Header, Footer } from '@/components/layout';
import { Highlighter } from '@/components/ui/highlighter';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const leadershipTeam = [
  {
    name: 'Dr. Sukdeb Mahanta',
    role: 'Founder · High-Performance Director',
    image: ABOUT_IMAGES.foundersGroup,
    highlights: [
      '17+ years in elite sports medicine — cricket, football, hockey, boxing & Olympic pathways',
      'Leadership across National Excellence Centre (MoYAS), SAI NCOE, ISL & national academy environments',
      'Globally credentialed — Loughborough HPCP, FIFA Sports Medicine, IOC & international taping diplomates',
    ],
  },
  {
    name: 'Dr. Akshat Singh Chouhan',
    role: 'Sports Physiotherapist',
    image: ABOUT_IMAGES.teamAkshat,
    highlights: [
      'On-field coverage - 38th National Games (Uttarakhand), U-22 Asian Boxing Championship Selection Trials & Himachal Pradesh Cricket Association (HPCA) Tournament',
      'SAI National Centre of Excellence — rehab & load management across boxing, hockey, gymnastics & more',
      'Passionate about empowering athletes through science-backed rehabilitation, injury prevention, and performance-focused care.',
    ],
  },
  {
    name: 'Dr. Deepti Ranjan Parida',
    role: 'Physiotherapist · Sports Medicine',
    image: ABOUT_IMAGES.teamDeepti,
    highlights: [
      'Team physiotherapist — Bengal men’s U-25; long tenure with CAB junior men’s squads & domestic cricket',
      'Tournament exposure including Byju’s Bengal T-20 Challenge & continuous franchise-style camp coverage',
      'Sports injury rehab, prehab, manual therapy & taping — from acute on-field care to full return-to-play',
    ],
  },
] as const;

/** Role types in the H2H network—illustrative avatars, not individual staff profiles. */
const careNetworkRoles = [
  { role: 'Physiotherapist', detail: 'Clinic & home sessions' },
  { role: 'Sports therapist', detail: 'Load & return-to-sport' },
  { role: 'Yoga instructor', detail: 'Therapeutic movement' },
  { role: 'Care coordinator', detail: 'Scheduling & follow-up' },
  { role: 'Rehab specialist', detail: 'Post-injury programmes' },
  { role: 'Patient liaison', detail: 'Questions & paperwork' },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Hero Section - Similar to Homepage */}
          <div className="grid grid-cols-1 mt-12 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div>
              {/* <p className="text-[13px] font-medium text-cyan-600 mb-4">
                About H2H Healthcare
              </p> */}
              <h2 className="text-[32px] md:text-[44px] font-medium text-gray-900 tracking-tight leading-[1.15] mb-6">
                Your Partner in{' '}
                <Highlighter action="highlight" color="#87CEFA" isView>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">
                    Recovery & Wellness
                  </span>
                </Highlighter>
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-8 max-w-md">
                H2H (Heal to Health) connects you with sports rehab, physiotherapy, pain care, and yoga—online, in clinic,
                or at home where we operate. Clear plans and clinicians who explain the &ldquo;why&rdquo; behind your exercises.
              </p>

              <p className="text-[13px] text-gray-600 mb-8 max-w-md leading-relaxed">
                Led by founder{' '}
                <span className="font-medium text-gray-900">Dr. Sukdeb Mahanta</span> and a network of specialists with
                national-level sport and hospital experience.
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium px-4 py-2 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  Expert Care
                </span>
                <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium px-4 py-2 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                  Home Visits
                </span>
              </div>
            </div>

            {/* Right — patient-first care / handshake (local lifestyle asset) */}
            <div className="relative">
              <div className="relative h-[350px] md:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={ABOUT_PAGE_IMAGES.patientFirstCareCard}
                  alt="Warm, personal care — patient-first approach at H2H"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Content Grid - Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-20">
            {/* Left — home visits lifestyle (wide, inviting) */}
            <div className="md:col-span-4">
              <div className="relative h-[420px] rounded-2xl overflow-hidden bg-gray-900 group">
                <Image
                  src={ABOUT_PAGE_IMAGES.homeVisitsWide}
                  alt="Home visit — care where you are comfortable"
                  fill
                  className="object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[12px] text-cyan-400 font-medium mb-2">Inside H2H</p>
                  <p className="text-[16px] text-white font-medium leading-tight mb-1">Care where you are</p>
                  <p className="text-[13px] text-gray-300 mb-2">
                    Home visits where available—your plan stays personal.
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Stats Cards */}
            <div className="md:col-span-4 flex flex-col gap-4">
              {/* Stat Card 1 */}
              <div className="flex-1 bg-cyan-50 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-[20px] md:text-[22px] font-semibold text-gray-900 tracking-tight mb-2">
                  Evidence-led care
                </p>
                <p className="text-[14px] font-medium text-gray-900 mb-2">
                  Plans you can follow
                </p>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Written goals, exercises, and review dates—not vague advice.
                </p>
              </div>

              <div className="flex-1 bg-gray-50 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-[20px] md:text-[22px] font-semibold text-gray-900 tracking-tight mb-2">
                  Nationwide network
                </p>
                <p className="text-[14px] font-medium text-gray-900 mb-2">
                  Major cities &amp; growing
                </p>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Check live availability for clinic, online, or home visits in your area.
                </p>
              </div>
            </div>

            {/* Right Image with Button */}
            <div className="md:col-span-4 relative">
              <div className="relative h-[350px] md:h-full min-h-[280px] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={ABOUT_PAGE_IMAGES.expertCareHands}
                  alt="Expert hands-on guidance — clinical precision at H2H"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* About Us Button */}
                <div className="absolute bottom-4 right-4">
                  <Button 
                    className="h-10 px-5 text-[13px] font-medium bg-white hover:bg-gray-50 text-gray-900 rounded-full"
                    asChild
                  >
                    <Link href="/contact">
                      About us
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Our Mission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <p className="text-[12px] font-medium text-cyan-600 uppercase tracking-wider mb-3">
                OUR MISSION
              </p>
              <h2 className="text-[28px] md:text-[32px] font-medium text-gray-900 tracking-tight leading-tight mb-4">
                Healthcare That Comes to You
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
                H2H stands for Home to Health: fewer unnecessary trips, more time on your rehab. Whether you&apos;re post-surgery,
                managing chronic pain, or chasing a sport goal, we aim for plans that fit your day—not the other way around.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-cyan-50 text-cyan-700 text-[12px] font-medium px-3 py-1.5 rounded-full">
                  Expert clinicians
                </span>
                <span className="bg-teal-50 text-teal-700 text-[12px] font-medium px-3 py-1.5 rounded-full">
                  Online booking &amp; chat
                </span>
                <span className="bg-gray-100 text-gray-700 text-[12px] font-medium px-3 py-1.5 rounded-full">
                  Home visits (where available)
                </span>
              </div>
            </div>
            <div className="relative h-[300px] md:h-[350px] rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={ABOUT_PAGE_IMAGES.evidenceLedWorkspace}
                alt="Evidence-led plans — charts, anatomy, and clear progress tracking"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Leadership team — founder & lead clinicians */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-[28px] md:text-[32px] font-medium text-gray-900 tracking-tight mb-4">
                Get to Know the{' '}
                <Highlighter action="underline" color="#22d3d1" isView>
                  People Behind the Progress
                </Highlighter>
              </h2>
              <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Founder-led leadership and nationally credentialed sports physiotherapists — from domestic cricket and franchise
                medicine to National Games and SAI high-performance centres.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {leadershipTeam.map((member) => (
                <article
                  key={member.name}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-100 transition-all duration-300"
                >
                  <div className="relative aspect-[4/5] w-full bg-gray-100">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className={
                        member.image === ABOUT_IMAGES.foundersGroup
                          ? 'object-cover object-[center_18%] group-hover:scale-[1.02] transition-transform duration-500'
                          : 'object-cover object-top group-hover:scale-[1.02] transition-transform duration-500'
                      }
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={member.image === ABOUT_IMAGES.teamAkshat}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>
                  <div className="flex flex-col flex-1 p-5 pt-6">
                    <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">{member.name}</h3>
                    <p className="text-[13px] font-medium text-cyan-700 mt-1">{member.role}</p>
                    <ul className="mt-4 space-y-2.5 flex-1">
                      {member.highlights.map((line) => (
                        <li key={line} className="flex gap-2 text-[12px] text-gray-600 leading-relaxed">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500" aria-hidden />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Team Group Photo Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-[28px] md:text-[32px] font-medium text-gray-900 tracking-tight mb-4">
                From performance sport to everyday life
              </h2>
              <p className="text-[15px] text-gray-500 max-w-2xl mx-auto mb-6">
                We support athletes, academies, and anyone who needs honest physio—the same clarity and respect, whether you&apos;re
                on a field or managing pain after work.
              </p>
              {/* <Button 
                className="h-11 px-6 text-[14px] font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-full"
                asChild
              >
                <Link href="/contact">
                  About Us
                </Link>
              </Button> */}
            </div>
            <div className="relative rounded-2xl overflow-hidden h-[400px] md:h-[500px] bg-gray-100">
              <Image
                src={MARKETING_IMAGES.aboutTrustedChampionsBanner}
                alt="Athlete strength and conditioning — sports performance and rehabilitation care"
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </main>

      {/* Ground Team Section - Dark Theme */}
      <section className="relative py-24 bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Team Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden h-[400px] bg-gray-800">
                <Image
                  src={MARKETING_IMAGES.aboutGroundTeamHands}
                  alt="Hands together — teamwork and patient-centred care"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 480px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
              </div>
              {/* Floating glow */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-[80px]" />
            </div>

            {/* Right - Content */}
            <div>
              {/* <p className="text-[13px] text-cyan-400 mb-3">Our Ground Team</p> */}
              <h2 className="text-[32px] md:text-[40px] font-medium text-white mb-6 leading-tight tracking-tight">
                The Heroes Who{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Visit Your Home</span>
              </h2>
              <p className="text-[15px] text-gray-400 mb-4 leading-relaxed">
                Home and field visits rely on a mix of physios, therapists, and coordinators. Below are{' '}
                <span className="text-gray-300">role types</span> in our network—illustrative, not a roster of individuals.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {careNetworkRoles.slice(0, 4).map((item) => (
                  <div
                    key={item.role}
                    className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(item.role)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-[13px] font-medium text-white">{item.role}</p>
                        <p className="text-[11px] text-gray-500">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                className="h-11 px-6 text-[14px] font-medium bg-cyan-500 hover:bg-cyan-600 text-white rounded-full"
                asChild
              >
                <Link href="/booking">
                  Book a Home Visit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Scrolling Team Rows */}
          <div className="mt-16 space-y-4 overflow-hidden">
            {/* Row 1 - Scroll Left */}
            <div className="flex animate-scroll-left gap-4">
              {[...careNetworkRoles, ...careNetworkRoles].map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className="flex-shrink-0 flex items-center gap-3 bg-gray-900/60 backdrop-blur border border-gray-700/50 rounded-full px-4 py-2 hover:border-cyan-500/30 transition-colors"
                >
                  <img
                    src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(item.role)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-white whitespace-nowrap">{item.role}</p>
                    <p className="text-[11px] text-gray-500 whitespace-nowrap">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex animate-scroll-right gap-4">
              {[...careNetworkRoles].reverse().concat([...careNetworkRoles]).concat([...careNetworkRoles].reverse()).concat([...careNetworkRoles]).map((item, index) => (
                <div
                  key={`r2-${item.role}-${index}`}
                  className="flex-shrink-0 flex items-center gap-3 bg-gray-900/60 backdrop-blur border border-gray-700/50 rounded-full px-4 py-2 hover:border-teal-500/30 transition-colors"
                >
                  <img
                    src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(item.role)}r2&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-white whitespace-nowrap">{item.role}</p>
                    <p className="text-[11px] text-gray-500 whitespace-nowrap">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

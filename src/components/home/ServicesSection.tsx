'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import { DotPattern } from "@/components/ui/backgrounds";
import { FEATURED_SERVICE_CARDS } from "@/constants/marketing-images";

const CARDS = [
  {
    href: "/services/pain_relief_physiotherapy",
    title: "Pain Relief & Physiotherapy Care",
    accent: "cyan" as const,
    description:
      "Comprehensive pain relief and mobilization therapy for chronic and acute conditions.",
    image: FEATURED_SERVICE_CARDS.painPhysio,
  },
  {
    href: "/services/advanced_rehabilitation",
    title: "Advanced Rehabilitation & Recovery",
    accent: "teal" as const,
    description:
      "Ortho, Neuro & Post-surgical rehabilitation for complete recovery.",
    image: FEATURED_SERVICE_CARDS.advancedRehab,
  },
  {
    href: "/services/therapeutic_yoga",
    title: "Therapeutic Yoga & Wellness",
    accent: "teal" as const,
    description:
      "Yoga sessions designed for healing, rehabilitation, and mind-body wellness.",
    image: FEATURED_SERVICE_CARDS.therapeuticYoga,
  },
  {
    href: "/services/massage_recovery",
    title: "Massage & Recovery",
    accent: "rose" as const,
    description:
      "Specialized massage and recovery sessions to relieve muscle tension and support long-term healing.",
    image: FEATURED_SERVICE_CARDS.massageRecovery,
  },
  {
    href: "/services/sports_performance",
    title: "Active Sports & Performance",
    accent: "cyan" as const,
    description:
      "Coaching and fitness for athletes and teams—stay strong, avoid injuries, and get back to play safely (H2H Absolute Performance).",
    image: FEATURED_SERVICE_CARDS.sportsPerformance,
  },
];

export function ServicesSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-28">
      <DotPattern
        className="opacity-30 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
        color="#94a3b8"
        cr={1.5}
      />
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-medium text-gray-900 mb-4 leading-tight tracking-tight">
            Comprehensive{' '}
            <Highlighter action="box" color="#06b6d4" strokeWidth={2} animationDuration={1000} isView>
              <span className="text-cyan-600">Services</span>
            </Highlighter>
          </h2>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto">
            Quality healthcare services designed around your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:items-stretch gap-6 md:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.href}
              className="group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-sm transition-all duration-300 hover:shadow-lg md:min-h-[280px] md:flex-row"
            >
              {/* Same-width strip; height follows card so every card matches */}
              <div className="relative h-[200px] w-full shrink-0 md:h-full md:w-[44%] md:shrink-0">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 260px"
                  className="object-cover object-center"
                  priority={false}
                />
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${
                    card.accent === "cyan" ? "from-cyan-600/20" : "from-teal-600/20"
                  } to-transparent`}
                />
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between p-6">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className={`h-6 w-1 shrink-0 rounded-full ${
                        card.accent === "cyan" ? "bg-cyan-500" : "bg-teal-500"
                      }`}
                    />
                    <h3 className="text-[18px] font-medium leading-snug text-gray-900">{card.title}</h3>
                  </div>
                  <p className="min-h-[4.75rem] text-[14px] leading-relaxed text-gray-500 line-clamp-4 md:min-h-[5rem]">
                    {card.description}
                  </p>
                </div>
                <Link
                  href={card.href}
                  className={`mt-4 inline-flex shrink-0 items-center gap-1 text-[14px] font-medium transition-all group-hover:gap-2 ${
                    card.accent === "cyan"
                      ? "text-cyan-600 hover:text-cyan-700"
                      : "text-teal-600 hover:text-teal-700"
                  }`}
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            className="h-12 px-8 text-[14px] font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-full"
            asChild
          >
            <Link href="/services">
              View All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

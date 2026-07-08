"use client";

import Image from "next/image";
import { DotPattern } from "@/components/ui/backgrounds";
import { trustedPartnerLogos } from "./data";

function LogoStrip({ idSuffix = "" }: { idSuffix?: string }) {
  return (
    <>
      {trustedPartnerLogos.map(({ src, alt }, i) => (
        <div
          key={`${src}-${i}${idSuffix}`}
          className="flex h-20 w-[140px] shrink-0 items-center justify-center px-2 md:h-24 md:w-[168px]"
        >
          <Image
            src={src}
            alt={idSuffix ? "" : alt}
            width={200}
            height={80}
            className="max-h-full max-w-full object-contain object-center"
            sizes="(max-width: 768px) 140px, 168px"
          />
        </div>
      ))}
    </>
  );
}

export function TrustedBySection() {
  return (
    <section className="group relative overflow-hidden bg-slate-50 py-12">
      <DotPattern
        className="opacity-30 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
        color="#94a3b8"
        cr={1.5}
      />
      <div className="relative z-10 mx-auto mb-10 max-w-[1200px] px-6 text-center">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-600 sm:text-[15px]">
            Collaborations
          </p>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500" />
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[48px] lg:leading-[1.05]">
            Where We&apos;ve{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Participated
            </span>
          </h2>
          <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500" />
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-sm leading-7 text-slate-600 sm:text-base">
            We are proud to have participated in events, tournaments and initiatives organized by leading sports and healthcare organizations.
          </p>
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-[100vw]">
        <div className="overflow-hidden py-3">
          <div className="flex w-max animate-marquee-seamless [--marquee-duration:48s] motion-reduce:animate-none group-hover:[animation-play-state:paused]">
            <div className="flex items-center gap-10 md:gap-16 lg:gap-20 pr-10 md:pr-16">
              <LogoStrip />
            </div>
            <div
              className="flex items-center gap-10 md:gap-16 lg:gap-20 pr-10 md:pr-16"
              aria-hidden
            >
              <LogoStrip idSuffix="-b" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
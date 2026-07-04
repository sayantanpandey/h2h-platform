"use client";

import Image from "next/image";
import { DotPattern } from "@/components/ui/backgrounds";
import { trustedPartnerLogos, trustedPartnerStats } from "./data";

export function TrustedBySection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbfd_0%,#ffffff_45%,#f8fbfd_100%)] py-16 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,191,198,0.12),transparent_32%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.05),transparent_28%)]" />
      <DotPattern
        className="left-0 top-0 h-48 w-48 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent_72%)]"
        color="#c8d5de"
        cr={1.5}
      />
      <DotPattern
        className="right-0 top-0 h-48 w-48 opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_72%)]"
        color="#c8d5de"
        cr={1.5}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12">
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

        <div className="mt-10 lg:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {trustedPartnerLogos.map((partner, index) => (
            <article
              key={partner.title}
              className="group/card flex  flex-col items-center rounded-md border border-slate-200/80 bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(8,47,73,0.10)] "
            >
              <div className="flex h-20 items-center justify-center sm:h-24">
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  width={170}
                  height={110}
                  priority={index < 5}
                  className="max-h-full w-auto max-w-[140px] object-contain object-center sm:max-w-[150px]"
                />
              </div>
              <h3 className="mt-4 flex min-h-[54px] items-center text-[15px] font-semibold leading-[1.2] tracking-tight text-slate-900">
                {partner.title}
              </h3>
              <div className="mt-1 h-0.5 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500" />
              <p className="mt-4 flex min-h-[50px] md:min-h-[72px]  items-start text-pretty text-[14px] leading-6 text-slate-600">
                {partner.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-md border border-cyan-100/80 bg-[linear-gradient(180deg,rgba(247,251,253,0.95),rgba(255,255,255,0.98))] px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 sm:py-4 lg:mt-8 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {trustedPartnerStats.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={[
                    "flex items-center gap-3 rounded-[18px] px-3 py-3 sm:px-4",
                    index < trustedPartnerStats.length - 1 ? "lg:border-r lg:border-cyan-100" : "",
                  ].join(" ")}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-100 bg-white text-cyan-600 shadow-[0_6px_18px_rgba(34,211,238,0.10)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-cyan-600">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700 sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-base leading-8 text-slate-600 sm:text-lg">
          Continuing to contribute, collaborate and{" "}
          <span className="font-semibold text-cyan-600">create impact</span> across sports and health.
        </p>
      </div>
    </section>
  );
}

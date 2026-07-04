'use client';

import { cn } from '@/lib/utils';

export type ServiceVisualId =
  | 'pain_relief_physiotherapy'
  | 'advanced_rehabilitation'
  | 'massage_recovery'
  | 'nutrition_lifestyle'
  | 'mental_wellness'
  | 'therapeutic_yoga'
  | 'sports_performance'
  | 'digital_health';

function PanelFrame({
  children,
  className,
  minClass = 'min-h-[400px] sm:min-h-[440px] lg:min-h-[420px]',
}: {
  children: React.ReactNode;
  className?: string;
  minClass?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center rounded-2xl bg-gradient-to-br p-6 sm:p-8 shadow-inner ring-1 ring-black/5 lg:h-full',
        minClass,
        className
      )}
    >
      <div className="absolute left-4 top-4 h-2 w-2 rotate-45 bg-gray-300/90" />
      <div className="absolute right-4 top-4 h-2 w-2 rotate-45 bg-gray-300/90" />
      <div className="absolute bottom-4 left-4 h-2 w-2 rotate-45 bg-gray-300/90" />
      <div className="absolute bottom-4 right-4 h-2 w-2 rotate-45 bg-gray-300/90" />
      {children}
    </div>
  );
}

/** 1. Classic checklist — only pain uses this “plan” pattern */
function PainVisual({ title }: { title: string }) {
  const rows = [
    { t: 'Assessment', s: 'Initial evaluation', on: true },
    { t: 'Treatment plan', s: 'Personalised care', on: true },
    { t: 'Recovery', s: 'Progress tracking', on: false },
  ];
  return (
    <PanelFrame className="from-gray-100 via-cyan-50/40 to-gray-100">
      <div className="w-full max-w-[340px] rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-snug text-gray-900 line-clamp-2">{title}</span>
          <span className="shrink-0 text-[11px] text-gray-400">H2H Healthcare</span>
        </div>
        <div className="space-y-3.5">
          {rows.map((r) => (
            <div key={r.t} className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  r.on ? 'bg-cyan-100' : 'bg-gray-100'
                )}
              >
                <div className={cn('h-3 w-3 rounded-full', r.on ? 'bg-cyan-500' : 'bg-gray-300')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-gray-800">{r.t}</div>
                <div className="text-[11px] text-gray-400">{r.s}</div>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  r.on ? 'bg-cyan-500' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    r.on ? 'left-5' : 'left-0.5'
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-400">Success rate</div>
              <div className="text-[16px] font-semibold text-gray-900">98%</div>
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 w-8 rounded-full bg-cyan-500" />
              <div className="h-1.5 w-6 rounded-full bg-cyan-300" />
              <div className="h-1.5 w-4 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

/** 2. Horizontal rehab timeline — not a duplicate checklist */
function RehabVisual({ title }: { title: string }) {
  const phases = [
    { n: '1', label: 'Assess', sub: 'Baseline' },
    { n: '2', label: 'Rehab', sub: 'Structured' },
    { n: '3', label: 'Home', sub: 'Independence' },
  ];
  return (
    <PanelFrame className="from-slate-100 via-blue-50/50 to-indigo-50/40">
      <div className="w-full max-w-[380px]">
        <p className="mb-6 text-center text-[12px] font-medium text-blue-900/80 line-clamp-2">{title}</p>
        <div className="flex items-start justify-center gap-0 sm:gap-1">
          {phases.map((p, i) => (
            <div key={p.n} className="flex items-center">
              <div className="flex flex-col items-center px-1 sm:px-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-blue-400 bg-white text-[15px] font-bold text-blue-600 shadow-sm">
                  {p.n}
                </div>
                <span className="mt-2 text-[11px] font-semibold text-gray-800">{p.label}</span>
                <span className="text-[10px] text-gray-400">{p.sub}</span>
              </div>
              {i < phases.length - 1 && (
                <div
                  className="mb-10 hidden h-1 w-6 shrink-0 rounded-full bg-gradient-to-r from-blue-300 to-blue-100 sm:block sm:w-10"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-md backdrop-blur-sm">
          <div className="text-[10px] font-medium uppercase tracking-wide text-blue-600">This week</div>
          <div className="mt-1 text-[13px] font-medium text-gray-800">Gait &amp; balance blocks · 3 sessions</div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full w-[62%] rounded-full bg-blue-500" />
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400">Week 4 of ~12 · H2H Healthcare</div>
        </div>
      </div>
    </PanelFrame>
  );
}

function RecoveryVisual({ title }: { title: string }) {
  const steps = [
    'Assessment',
    'Manual therapy',
    'Release',
    'Recovery plan',
  ];

  return (
    <PanelFrame className="from-rose-50/90 via-fuchsia-50/70 to-pink-50/40">
      <div className="w-full max-w-[380px] rounded-3xl border border-white/90 bg-white/90 p-6 shadow-xl">
        <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">{title}</p>
        <div className="grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-pink-50/90 p-3 shadow-sm ring-1 ring-pink-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500 text-[13px] font-semibold text-white shadow-sm">
                {index + 1}
              </div>
              <span className="text-[13px] font-medium text-fuchsia-900">{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-fuchsia-100/80 p-4 text-center text-[12px] leading-relaxed text-fuchsia-800">
          Gentle, expert touch that helps you move easier and recover faster.
        </div>
      </div>
    </PanelFrame>
  );
}

/** 3. Plate / balance-of-plate — nutrition-specific */
function NutritionVisual({ title }: { title: string }) {
  return (
    <PanelFrame className="from-emerald-50/80 via-lime-50/40 to-amber-50/30">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        <p className="mb-5 text-center text-[12px] font-medium text-emerald-900/90 line-clamp-2">{title}</p>
        <div className="relative h-52 w-52 sm:h-56 sm:w-56">
          <div className="absolute inset-0 rounded-full border-[5px] border-dashed border-emerald-300/90 bg-white/60 shadow-inner" />
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden rounded-full">
            <div className="flex items-center justify-center bg-lime-100/90 text-[11px] font-medium text-emerald-900">
              Veg
            </div>
            <div className="flex items-center justify-center bg-amber-100/90 text-[11px] font-medium text-amber-900">
              Carbs
            </div>
            <div className="flex items-center justify-center bg-emerald-100/90 text-[11px] font-medium text-emerald-900">
              Protein
            </div>
            <div className="flex items-center justify-center bg-sky-100/80 text-[11px] font-medium text-sky-900">
              Hydration
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Balanced', 'No crash diet', 'Your kitchen'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-medium text-emerald-800 shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-gray-500">H2H Healthcare · lifestyle nutrition</p>
      </div>
    </PanelFrame>
  );
}

/** 4. Mood / stress meter — mental wellness */
function MentalVisual({ title }: { title: string }) {
  return (
    <PanelFrame className="from-violet-50/90 via-purple-50/50 to-fuchsia-50/40">
      <div className="flex w-full max-w-[340px] flex-col items-center">
        <p className="mb-6 text-center text-[12px] font-medium text-violet-950/90 line-clamp-2">{title}</p>
        <div className="flex gap-6">
          <div className="relative h-44 w-10 overflow-hidden rounded-full bg-gradient-to-t from-violet-600 via-violet-300 to-violet-100 shadow-inner">
            <div className="absolute bottom-6 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-white bg-violet-500 shadow-lg ring-2 ring-violet-200" />
          </div>
          <div className="flex flex-col justify-center gap-3 text-[11px]">
            <div className="rounded-lg bg-white/90 px-3 py-2 shadow-md ring-1 ring-violet-100">
              <span className="text-gray-400">This week · </span>
              <span className="font-medium text-violet-800">lighter load</span>
            </div>
            <div className="rounded-lg bg-white/90 px-3 py-2 shadow-md ring-1 ring-violet-100">
              <span className="text-gray-400">Focus · </span>
              <span className="font-medium text-violet-800">sleep &amp; breath</span>
            </div>
            <div className="text-[10px] leading-snug text-gray-500">
              Private, judgement-free check-ins — H2H Healthcare
            </div>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

/** 5. Breath rings — yoga (compact card, no duplicate heading) */
function YogaVisual({ title }: { title: string }) {
  return (
    <PanelFrame
      minClass="min-h-0 py-6 sm:py-7"
      className="from-teal-50/90 via-cyan-50/40 to-slate-50 lg:h-auto"
    >
      <div
        className="flex w-full max-w-[400px] flex-col items-stretch rounded-2xl bg-white/95 p-6 shadow-lg ring-1 ring-teal-100/90 sm:p-7"
        role="img"
        aria-label={title}
      >
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-teal-600/90">
          Breath-led movement
        </p>
        <div className="relative mx-auto mt-5 flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56">
          <div className="absolute inset-0 rounded-full border-[3px] border-teal-200/90" />
          <div className="absolute inset-5 rounded-full border-2 border-teal-300/80" />
          <div className="absolute inset-[2.65rem] rounded-full border border-dashed border-teal-400/60" />
          <span className="relative z-10 text-center text-[13px] font-semibold leading-snug text-teal-900 sm:text-sm">
            Inhale
            <span className="my-1 block text-lg font-normal text-teal-500">·</span>
            Exhale
          </span>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Gentle', 'Your pace', 'Options'].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-3.5 py-2 text-[11px] font-semibold text-teal-900 ring-1 ring-teal-100"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-gray-500">H2H Healthcare</p>
      </div>
    </PanelFrame>
  );
}

/** 6. Performance bars — sports (single dense card, no duplicate heading) */
function SportsVisual({ title }: { title: string }) {
  const metrics = [
    { barClass: 'h-[60px]', label: 'Load', c: 'from-orange-300 to-orange-400' },
    { barClass: 'h-[126px]', label: 'Power', c: 'from-orange-500 to-orange-600' },
    { barClass: 'h-[88px]', label: 'Speed', c: 'from-amber-400 to-orange-500' },
  ];
  return (
    <PanelFrame
      minClass="min-h-0 py-6 sm:py-7"
      className="from-orange-50/90 via-amber-50/50 to-yellow-50/40 lg:h-auto"
    >
      <div
        className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-orange-100/90"
        role="img"
        aria-label={title}
      >
        <div className="border-b border-orange-100/80 bg-gradient-to-br from-orange-50/90 to-amber-50/50 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-orange-700/90">
            Training snapshot
          </p>
          <div className="mt-5 flex h-44 items-end justify-center gap-5 sm:gap-7">
            {metrics.map((m) => (
              <div key={m.label} className="flex w-[4.5rem] flex-col items-center gap-3 sm:w-20">
                <div className="relative flex h-36 w-full items-end justify-center rounded-t-xl bg-white/70 shadow-inner ring-1 ring-orange-100/80">
                  <div
                    className={cn(
                      'w-[70%] max-w-[52px] rounded-t-lg bg-gradient-to-t shadow-sm',
                      m.barClass,
                      m.c
                    )}
                  />
                </div>
                <span className="text-[12px] font-semibold text-gray-900">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 text-center sm:px-6 sm:py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600">
            Absolute Performance
          </div>
          <div className="mt-1.5 text-[15px] font-semibold leading-snug text-gray-900">
            Pre-season screening · week 2
          </div>
          <p className="mt-2 text-[12px] text-gray-600">Clear targets. Weekly check-ins.</p>
          <p className="mt-3 text-[11px] text-gray-400">H2H Healthcare</p>
        </div>
      </div>
    </PanelFrame>
  );
}

/** 7. Phone + chat — digital health */
function DigitalVisual({ title }: { title: string }) {
  return (
    <PanelFrame className="from-slate-100 via-sky-50/50 to-cyan-50/40">
      <div className="flex w-full flex-col items-center">
        <p className="mb-5 max-w-[280px] text-center text-[12px] font-medium text-slate-800 line-clamp-2">
          {title}
        </p>
        <div className="w-[min(260px,85vw)] rounded-[1.75rem] border-[10px] border-slate-800 bg-slate-900 p-2 shadow-2xl">
          <div className="mb-2 flex justify-center">
            <div className="h-1 w-12 rounded-full bg-slate-700" />
          </div>
          <div className="space-y-2 rounded-xl bg-slate-50 p-3">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[10px] leading-relaxed text-gray-700 shadow-sm">
              Hi! Your physio will join the video in 2 min.
            </div>
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-sky-500 px-3 py-2 text-[10px] leading-relaxed text-white shadow-sm">
              Ok — I&apos;m ready with my exercise list.
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[10px] leading-relaxed text-gray-700 shadow-sm">
              Great — we&apos;ll review your home plan today.
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 pb-1 text-[9px] text-slate-500">
            <span>Encrypted call</span>
            <span>H2H Healthcare</span>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}

/**
 * Seven different layouts — not the same card repeated. No photos.
 */
export function ServiceSectionVisual({
  serviceId,
  title,
  className,
}: {
  serviceId: ServiceVisualId;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-[240px] w-full items-center justify-center lg:min-h-0',
        className
      )}
      aria-hidden
    >
      {serviceId === 'pain_relief_physiotherapy' && <PainVisual title={title} />}
      {serviceId === 'advanced_rehabilitation' && <RehabVisual title={title} />}
      {serviceId === 'nutrition_lifestyle' && <NutritionVisual title={title} />}
      {serviceId === 'mental_wellness' && <MentalVisual title={title} />}
      {serviceId === 'therapeutic_yoga' && <YogaVisual title={title} />}
      {serviceId === 'sports_performance' && <SportsVisual title={title} />}
      {serviceId === 'massage_recovery' && <RecoveryVisual title={title} />}
      {serviceId === 'digital_health' && <DigitalVisual title={title} />}
    </div>
  );
}

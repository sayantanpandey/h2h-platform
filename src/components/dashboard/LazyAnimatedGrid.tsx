'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const AnimatedGridPattern = dynamic(
  () => import('@/components/ui/animated-grid-pattern').then((m) => ({ default: m.AnimatedGridPattern })),
  { ssr: false, loading: () => null }
);

interface LazyAnimatedGridProps {
  className?: string;
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

/** Subtle background animation for dashboard — must stay behind content (z-0, pointer-events-none). */
export function LazyAnimatedGrid({
  className,
  numSquares = 12,
  maxOpacity = 0.05,
  duration = 4,
  repeatDelay = 1.5,
}: LazyAnimatedGridProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_75%)]">
        <AnimatedGridPattern
          numSquares={numSquares}
          maxOpacity={maxOpacity}
          duration={duration}
          repeatDelay={repeatDelay}
          className={cn('fill-cyan-500/15 stroke-cyan-500/15', className)}
        />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Blip, RadarConfig } from "@/app/lib/radar-types";

interface RadarQuadrantLegendProps {
  title: string;
  blips: Blip[];
  config: RadarConfig;
  align?: "left" | "right";
}

const ringHeadingClasses = [
  "text-lime-600",
  "text-sky-600",
  "text-amber-500",
  "text-rose-300",
];

export function RadarQuadrantLegend({
  title,
  blips,
  config,
  align = "left",
}: RadarQuadrantLegendProps): ReactElement | null {
  const blipsByRing = config.rings.map((ring, ringId) => ({
    ring,
    ringId,
    blips: blips.filter((blip) => blip.ringId === ringId),
  }));

  const hasItems = blipsByRing.some(({ blips: ringBlips }) => ringBlips.length);

  if (!hasItems) {
    return null;
  }

  return (
    <section className={align === "right" ? "text-left xl:text-right" : "text-left"}>
      <h3 className="mb-5 text-2xl font-black tracking-tight text-foreground">
        {title}
      </h3>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        {blipsByRing.map(({ ring, ringId, blips: ringBlips }) => {
          if (!ringBlips.length) {
            return null;
          }

          return (
            <div key={`${title}-${ring}`} className="space-y-2">
              <h4
                className={`text-sm font-black uppercase tracking-[0.18em] ${ringHeadingClasses[ringId] ?? "text-primary"}`}
              >
                {ring}
              </h4>
              <ol className="space-y-1 text-sm leading-5 text-foreground/85">
                {ringBlips.map((blip, index) => (
                  <li key={blip.id}>
                    <Link
                      href={`/blips/${blip.id}`}
                      className="transition-colors hover:text-primary"
                    >
                      {index + 1}. {blip.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

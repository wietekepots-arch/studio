"use client";

import type { ReactElement } from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function MarkerFrame({ children }: { children: ReactElement }): ReactElement {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/35 ring-1 ring-inset ring-border/50">
      {children}
    </span>
  );
}

function CircleMarker(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="7"
        className="fill-primary stroke-white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function TriangleMarker({
  direction,
}: {
  direction: "up" | "down";
}): ReactElement {
  const points =
    direction === "up" ? "12,4 20,20 4,20" : "12,20 20,4 4,4";

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <polygon
        points={points}
        className="fill-primary stroke-white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StarMarker(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <polygon
        points="12,3 14.35,8.76 20.56,9.13 15.78,13.12 17.36,19.12 12,15.82 6.64,19.12 8.22,13.12 3.44,9.13 9.65,8.76"
        className="fill-primary stroke-white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const legendItems = [
  {
    label: "Circle",
    description: "steady in its current ring",
    preview: <CircleMarker />,
  },
  {
    label: "Triangle up",
    description: "moved inward since the last update",
    preview: <TriangleMarker direction="up" />,
  },
  {
    label: "Triangle down",
    description: "moved outward since the last update",
    preview: <TriangleMarker direction="down" />,
  },
  {
    label: "Star",
    description: "new blip from the last 14 days",
    preview: <StarMarker />,
  },
];

export function RadarBlipLegend(): ReactElement {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Explain radar blip shapes"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="w-80 max-w-[calc(100vw-2rem)] rounded-[1.5rem] border-border/60 bg-background/95 p-4 backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Radar blip shapes
              </p>
              <p className="text-sm leading-5 text-muted-foreground">
                Shape shows whether a blip is new or moved between rings.
              </p>
            </div>

            <div className="space-y-2.5">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <MarkerFrame>{item.preview}</MarkerFrame>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs leading-4 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs leading-4 text-muted-foreground">
              Color still maps to the ring each blip belongs to.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

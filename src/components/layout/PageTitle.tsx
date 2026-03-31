import React from "react";

import { cn } from "@/lib/utils";

interface PageTitleProps {
  label?: React.ReactNode;
  title: React.ReactNode;
  highlight?: React.ReactNode;
  suffix?: React.ReactNode;
  description?: React.ReactNode;
  breakBeforeHighlight?: boolean;
  breakAfterHighlight?: boolean;
  className?: string;
  labelClassName?: string;
  titleClassName?: string;
  highlightClassName?: string;
  descriptionClassName?: string;
}

export function PageTitle({
  label,
  title,
  highlight,
  suffix,
  description,
  breakBeforeHighlight = false,
  breakAfterHighlight = false,
  className,
  labelClassName,
  titleClassName,
  highlightClassName,
  descriptionClassName,
}: PageTitleProps): React.ReactElement {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] text-primary",
            labelClassName,
          )}
        >
          {label}
        </div>
      ) : null}
      <h1
        className={cn(
          "font-black uppercase leading-none tracking-tighter text-foreground",
          titleClassName,
        )}
      >
        {title}
        {highlight ? (
          <>
            {breakBeforeHighlight ? <br /> : " "}
            <span className={cn("text-primary", highlightClassName)}>
              {highlight}
            </span>
          </>
        ) : null}
        {suffix ? (
          <>
            {breakAfterHighlight ? <br /> : " "}
            {suffix}
          </>
        ) : null}
      </h1>
      {description ? (
        <p className={cn("font-medium text-muted-foreground", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

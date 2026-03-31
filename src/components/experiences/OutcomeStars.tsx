import type { ReactElement } from "react";
import { Star } from "lucide-react";
import type { OutcomeStarsProps } from "@/components/experiences";

export function OutcomeStars({
  outcomeRating,
  maxRating = 5,
}: OutcomeStarsProps): ReactElement {
  const clampedRating = Math.max(0, Math.min(outcomeRating, maxRating));

  return (
    <div
      aria-label={`${clampedRating} out of ${maxRating} stars`}
      className="flex items-center gap-1 text-yellow-500"
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const isFilled = index < clampedRating;

        return (
          <Star
            key={`outcome-star-${index}`}
            className={isFilled ? "h-4 w-4 fill-current" : "h-4 w-4 fill-transparent"}
          />
        );
      })}
    </div>
  );
}

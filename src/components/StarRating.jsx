import React, { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = "md", readOnly = false }) {
  const [hover, setHover] = useState(0);
  const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };
  const starSize = sizeMap[size] || sizeMap.md;
  const display = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer"} transition-transform ${!readOnly && hover === star ? "scale-110" : ""}`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`${starSize} transition-colors ${
              star <= display
                ? "text-saffron fill-saffron"
                : "text-muted-foreground/30 fill-muted/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
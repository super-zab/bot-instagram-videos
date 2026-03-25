// =============================================================================
// Select — minimal styled native <select> element
// Matches the dark-theme aesthetic of the rest of the UI.
// Uses a native <select> for simplicity and accessibility — no headless-ui
// or Radix dependency needed for this use case.
// =============================================================================

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional badge displayed after the label (e.g. "free", "paid") */
  badge?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          // Base layout
          "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2",
          // Typography
          "text-sm text-zinc-100",
          // Interactive states
          "cursor-pointer outline-none transition-colors",
          "hover:border-zinc-500",
          "focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.badge ? ` (${opt.badge})` : ""}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select };

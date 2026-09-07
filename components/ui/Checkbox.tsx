import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 rounded-md border-navy-200 text-emerald-700 focus:ring-emerald-600/30 accent-emerald-700",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

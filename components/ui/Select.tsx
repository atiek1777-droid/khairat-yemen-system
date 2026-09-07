import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn("input appearance-none pl-9 pr-3.5", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
    </div>
  )
);
Select.displayName = "Select";

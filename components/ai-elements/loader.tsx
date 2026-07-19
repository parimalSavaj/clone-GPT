import type { HTMLAttributes } from "react";
import { Loader2Icon, GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props for the {@link Loader} spinner component. */
export type LoaderProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  isSearching?: boolean;
};

/** Spinning loading indicator for in-progress assistant responses. */
export const Loader = ({ className, size = 16, isSearching, ...props }: LoaderProps) => (
  <div
    className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
    {...props}
  >
    {isSearching ? (
      <GlobeIcon className="animate-pulse text-primary animate-spin" size={size} />
    ) : (
      <Loader2Icon className="animate-spin text-primary" size={size} />
    )}
    <span>{isSearching ? "Searching the web..." : "Thinking..."}</span>
  </div>
);

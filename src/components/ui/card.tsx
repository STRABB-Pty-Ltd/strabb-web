import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card text-card-foreground gap-sm text-body data-[size=sm]:gap-sm data-[size=sm]:py-sm flex flex-col overflow-hidden has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      variant: {
        default: "bg-card ring-foreground/10 rounded-xl ring-1",
        /* Fill-based separation, no ring - the settings/drawer panel. */
        filled: "bg-secondary rounded-lg",
        /* The dashboard tile: rounded-xl fill that lifts on hover. */
        elevated: "bg-card rounded-xl transition-shadow hover:shadow-md",
      },
      /* Uniform padding for one-shot cards used without the compound
         header/content/footer children (which carry their own px). */
      padding: {
        default: "py-sm",
        sm: "p-sm",
        md: "p-md",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  },
);

function Card({
  className,
  size = "default",
  variant = "default",
  padding = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header gap-xs px-sm group-data-[size=sm]/card:px-sm [.border-b]:pb-sm group-data-[size=sm]/card:[.border-b]:pb-sm @container/card-header grid auto-rows-min items-start rounded-t-xl has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-subheading group-data-[size=sm]/card:text-body leading-snug font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-body", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-sm group-data-[size=sm]/card:px-sm", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "bg-muted/50 p-sm group-data-[size=sm]/card:p-sm flex items-center rounded-b-xl border-t",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

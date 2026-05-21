"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

/**
 * Thin styled wrappers around `@base-ui/react/tabs` to match STRABB's
 * surface tokens. Used by the listings settings page's accordion rows
 * (F.7) to switch between General / Rates / Restrictions / Availability
 * / Channex tabs without unmounting the row.
 *
 * Parts retain Base UI's `data-*` attribute model — selected tab is
 * `data-selected`, hover is `data-highlighted`, focus is built in.
 */

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("gap-base flex flex-wrap items-center border-b", className)}
      style={{ borderColor: "var(--border)" }}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "px-sm py-base text-body cursor-pointer rounded-t-md border-b-2 border-transparent font-medium transition-colors outline-none",
        "hover:bg-neutral-30",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        "data-[selected]:border-b-[var(--highlight-10)] data-[selected]:text-[var(--highlight-10)]",
        "text-[var(--text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("pt-md outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

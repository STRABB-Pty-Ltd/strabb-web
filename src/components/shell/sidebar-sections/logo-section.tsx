"use client";

import Image from "next/image";

export function LogoSection() {
  return (
    <div
      className="flex shrink-0 items-center"
      style={{
        paddingLeft: "var(--space-md)",
        paddingRight: "var(--space-md)",
      }}
    >
      {/* Logo renders at full sidebar width minus 21px padding either side; its
          natural 2.5:1 aspect means it's taller than the sidebar's reserved
          spacer (var(--logo-area-height)) — that's intentional, the overflow
          falls into ListingFilterTree's padding-top so the spacer/canvas
          baseline alignment is preserved. */}
      <Image
        src="/logo-strabb.png"
        alt="STRABB"
        width={1500}
        height={600}
        priority
        className="block dark:hidden"
        style={{
          width: "calc(var(--sidebar-width) - 2 * var(--space-md))",
          height: "auto",
        }}
      />
      <Image
        src="/logo-strabb-dark.png"
        alt="STRABB"
        width={1500}
        height={600}
        priority
        className="hidden dark:block"
        style={{
          width: "calc(var(--sidebar-width) - 2 * var(--space-md))",
          height: "auto",
        }}
      />
    </div>
  );
}

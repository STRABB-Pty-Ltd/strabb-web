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
      <Image
        src="/logo-strabb.png"
        alt="STRABB"
        width={1500}
        height={600}
        priority
        style={{
          // Fit width of sidebar minus 21px padding either side; height scales
          // with the 2.5:1 intrinsic aspect ratio.
          width: "calc(var(--sidebar-width) - 2 * var(--space-md))",
          height: "auto",
        }}
      />
    </div>
  );
}

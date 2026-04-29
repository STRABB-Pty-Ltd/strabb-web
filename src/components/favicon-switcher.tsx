"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function FaviconSwitcher() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const href = resolvedTheme === "dark" ? "/favicon-dark.png" : "/favicon-light.png";
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon'][data-dynamic='true']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-dynamic", "true");
      document.head.appendChild(link);
    }
    link.href = href;
  }, [resolvedTheme]);

  return null;
}

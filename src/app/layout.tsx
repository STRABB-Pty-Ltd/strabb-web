import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { FaviconSwitcher } from "@/components/favicon-switcher";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const interData = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-data",
});

export const metadata: Metadata = {
  title: "STRABB",
  description: "Short-term rental booking aggregation and automation",
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("font-sans antialiased", inter.variable, interData.variable)}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <FaviconSwitcher />
          {children}
        </Providers>
      </body>
    </html>
  );
}

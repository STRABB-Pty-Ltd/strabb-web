import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "STRABB",
  description: "Short-term rental booking aggregation and automation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

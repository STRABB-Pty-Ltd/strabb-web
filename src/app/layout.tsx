import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-data",
});

export const metadata: Metadata = {
  title: "STRABB",
  description: "Short-term rental booking aggregation and automation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans antialiased", firaSans.variable, firaCode.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

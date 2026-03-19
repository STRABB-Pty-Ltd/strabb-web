import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRABB",
  description: "Short-term rental booking aggregation and automation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

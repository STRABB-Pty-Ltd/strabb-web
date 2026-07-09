"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// App-level 404. Renders for any unmatched route and for notFound() calls that
// bubble past a segment without its own not-found boundary. Lives at the app
// root so it sits inside the root layout only (no app shell), styled to match
// the sign-in card shell.
export default function NotFound() {
  return (
    <div className="bg-muted/40 p-sm flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm" data-testid="not-found-page">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">Page not found</CardTitle>
          <CardDescription>
            We could not find the page you were looking for. It may have moved or no longer exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/dashboard" className={buttonVariants()}>
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

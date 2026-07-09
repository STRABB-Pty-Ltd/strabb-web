"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackError } from "@/lib/app-insights";

// App-level error boundary. Catches render/data errors thrown by any segment
// below the root layout and offers a recovery path. Reports to App Insights
// (F.6a, gated on the connection string, no-ops locally/CI) so crashes are
// visible without waiting on a bug report. Styled to match the sign-in card
// shell since it renders outside the app shell.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackError(error);
  }, [error]);

  return (
    <div className="bg-muted/40 p-sm flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm" data-testid="error-page">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. You can try again, or head back to your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-sm flex flex-col items-center">
          <div className="gap-sm flex">
            <Button onClick={reset}>Try again</Button>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Go to dashboard
            </Link>
          </div>
          {error.digest && (
            <p className="text-muted-foreground text-body">Reference: {error.digest}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

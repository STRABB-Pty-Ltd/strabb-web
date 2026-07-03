"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiClient } from "@/lib/api-client";
import { acceptInviteSchema, type AcceptInviteFormData } from "@/lib/schemas/auth";

// One generic message for every token failure (unknown, expired, used, revoked).
// The API returns the same 400 for all of them; the UI must not distinguish.
const GENERIC_ERROR =
  "This invitation link is invalid or has expired. Ask your team owner to send a new one.";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  async function onSubmit(data: AcceptInviteFormData) {
    setServerError(null);
    try {
      // keysToSnake maps fullName -> full_name, matching the API contract.
      await apiClient.post("/invites/accept", {
        token,
        password: data.password,
        fullName: data.fullName,
      });
      setSucceeded(true);
      router.push("/login?invited=success");
    } catch {
      setServerError(GENERIC_ERROR);
    }
  }

  return (
    <div className="gap-sm flex flex-col items-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">Accept your invitation</CardTitle>
          <CardDescription>Set up your account to join your team on STRABB.</CardDescription>
        </CardHeader>
        <CardContent>
          {succeeded ? (
            <div className="space-y-sm">
              <p className="text-body text-highlight-10">
                Your account is ready. Redirecting you to sign in...
              </p>
              <Link
                href="/login"
                className="text-body text-primary hover:underline"
                data-no-elevate
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-sm">
              <div className="space-y-base">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-destructive text-body">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-base">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-body">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-base">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-body">{errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && <p className="text-destructive text-body">{serverError}</p>}

              <Button type="submit" className="w-full min-w-[144px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="border-primary-foreground h-sm w-sm border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

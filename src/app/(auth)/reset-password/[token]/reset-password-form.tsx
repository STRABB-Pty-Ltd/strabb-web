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
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/auth";

// One generic message for every token failure (unknown, expired, already used).
// The API returns the same 400 for all of them and the UI must not distinguish -
// telling a user "this link expired" vs "already used" leaks token state.
const GENERIC_ERROR = "This reset link is invalid or has expired. Request a new one and try again.";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError(null);
    try {
      // keysToSnake maps newPassword -> new_password, matching the API contract.
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: data.password,
      });
      setSucceeded(true);
      router.push("/login?reset=success");
    } catch {
      setServerError(GENERIC_ERROR);
    }
  }

  return (
    <div className="gap-sm flex flex-col items-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">Choose a new password</CardTitle>
          <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {succeeded ? (
            <div className="space-y-sm">
              <p className="text-body text-highlight-10">
                Your password has been reset. Redirecting you to sign in...
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
                <Label htmlFor="password">New password</Label>
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
                <Label htmlFor="confirmPassword">Confirm new password</Label>
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
                    Saving...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-body text-muted-foreground hover:underline"
                  data-no-elevate
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiClient } from "@/lib/api-client";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/auth";

export function ForgotPasswordForm() {
  // The API always returns an identical 202 for known and unknown emails to
  // avoid account enumeration, so the UI mirrors that: once submitted we show
  // the same confirmation regardless of the response (including transport or
  // rate-limit errors). Never reveal whether the address matched an account.
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await apiClient.post("/auth/forgot-password", { email: data.email });
    } catch {
      // Swallow: the confirmation is identical whether or not the email exists,
      // so a failed request must not leak a different outcome to the user.
    }
    setSubmitted(true);
  }

  return (
    <div className="gap-sm flex flex-col items-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-subheading font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we will send you a link to reset it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-sm">
              <p className="text-body text-highlight-10">
                If that email address has an account, a password reset link is on its way. Check
                your inbox and follow the link to choose a new password.
              </p>
              <Link
                href="/login"
                className="text-body text-primary hover:underline"
                data-no-elevate
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-sm">
              <div className="space-y-base">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-destructive text-body">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full min-w-[144px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="border-primary-foreground h-sm w-sm border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
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

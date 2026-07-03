import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Password policy - mirrors the API exactly (app/services/password_policy.py):
 * at least 10 characters, with at least one letter and at least one digit.
 * Keep these in lockstep with the backend; the API 422s on the same rules, so
 * the client is a fast-fail convenience, never the enforcement layer.
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const acceptInviteSchema = z
  .object({
    fullName: z.string().min(1, "Enter your full name"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

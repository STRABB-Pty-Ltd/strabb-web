import { z } from "zod";

export interface PhoneStatusResponse {
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
  hasPending: boolean;
}

export interface SmsUsageSummaryResponse {
  userTodayCount: number;
  tenantTodayCount: number;
  userDailyCap: number;
  tenantDailyCap: number;
  canSend: boolean;
}

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(8, "Phone number must be at least 8 characters")
  .max(32, "Phone number must be at most 32 characters");

export const otpCodeSchema = z
  .string()
  .trim()
  .min(4, "Code must be at least 4 digits")
  .max(10, "Code must be at most 10 digits");

export type PhoneNumberInput = z.infer<typeof phoneNumberSchema>;
export type OtpCodeInput = z.infer<typeof otpCodeSchema>;

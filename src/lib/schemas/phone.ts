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
  .regex(
    /^\+\d{8,15}$/,
    "Phone must be E.164 format starting with + (e.g. +61412345678)",
  );

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, "Code must be 4-10 digits, numbers only");

export type PhoneNumberInput = z.infer<typeof phoneNumberSchema>;
export type OtpCodeInput = z.infer<typeof otpCodeSchema>;

"use client";

import { CheckCircle2, Phone, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useClearPhone,
  useConfirmPhoneVerification,
  usePhoneStatus,
  useRequestPhoneVerification,
  useSmsUsage,
} from "@/hooks/use-phone";
import { ApiError } from "@/lib/api-client";
import { otpCodeSchema, phoneNumberSchema } from "@/lib/schemas/phone";
import { useAppStore } from "@/stores/app-store";

const RESEND_COOLDOWN_SECONDS = 30;

function formatVerifiedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhoneSection() {
  const addToast = useAppStore((s) => s.addToast);

  const surfaceError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 429) {
      addToast({
        type: "error",
        message: "Too many attempts - try again in a few minutes.",
      });
      return;
    }
    const message = err instanceof Error ? err.message : "Something went wrong";
    addToast({ type: "error", message });
  };
  const { data: status, isLoading } = usePhoneStatus();
  const { data: usage } = useSmsUsage();
  const requestVerification = useRequestPhoneVerification();
  const confirmVerification = useConfirmPhoneVerification();
  const clearPhone = useClearPhone();

  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleRequest = () => {
    const parsed = phoneNumberSchema.safeParse(phoneInput);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? "Invalid phone number");
      return;
    }
    setPhoneError(null);
    requestVerification.mutate(parsed.data, {
      onSuccess: () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        addToast({ type: "success", message: "Verification code sent" });
      },
      onError: surfaceError,
    });
  };

  const handleConfirm = () => {
    const parsed = otpCodeSchema.safeParse(otpInput);
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    setOtpError(null);
    confirmVerification.mutate(parsed.data, {
      onSuccess: () => {
        setOtpInput("");
        addToast({ type: "success", message: "Phone number verified" });
      },
      onError: (err) => {
        setOtpInput("");
        surfaceError(err);
      },
    });
  };

  const handleClear = () => {
    clearPhone.mutate(undefined, {
      onSuccess: () => {
        setPhoneInput("");
        setOtpInput("");
        setCooldown(0);
        setConfirmRemove(false);
        addToast({ type: "success", message: "Phone number removed" });
      },
      onError: surfaceError,
    });
  };

  const header = (
    <div>
      <h2 className="text-subheading font-semibold text-gray-900">Phone</h2>
      <p className="text-body text-gray-500">
        Verify a mobile number to receive and send SMS for guest messaging.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-md">
        {header}
        <p className="text-body text-gray-400">Loading…</p>
      </div>
    );
  }

  const isVerified = !!status?.phoneNumber && !!status?.phoneVerifiedAt;
  const isPending = !!status?.hasPending && !isVerified;
  const showEntry = !isVerified && !isPending;

  return (
    <div className="space-y-md">
      {header}

      {isVerified && (
        <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <div className="gap-sm flex items-start justify-between">
            <div className="gap-sm flex items-start">
              <CheckCircle2 size={20} style={{ color: "var(--semantic-success)", marginTop: 2 }} />
              <div>
                <p className="text-body font-medium text-gray-800">{status?.phoneNumber}</p>
                <p className="text-body text-gray-500">
                  Verified {formatVerifiedAt(status?.phoneVerifiedAt ?? null)}
                </p>
              </div>
            </div>
            {!confirmRemove ? (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="px-sm py-xs text-body rounded-lg border font-medium text-gray-700 hover:bg-gray-50"
                style={{ borderColor: "var(--border)" }}
              >
                Remove phone
              </button>
            ) : (
              <div className="gap-xs flex">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearPhone.isPending}
                  className="px-sm py-xs text-body rounded-lg font-medium text-white"
                  style={{ backgroundColor: "var(--status-danger)" }}
                >
                  {clearPhone.isPending ? "Removing…" : "Yes, remove"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="px-sm py-xs text-body rounded-lg border font-medium text-gray-700"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <p className="mb-sm text-body text-gray-700">
            We sent a verification code to your phone. Enter it below to confirm.
          </p>
          <div className="space-y-xs">
            <label className="text-body block font-medium text-gray-700" htmlFor="otp-input">
              Verification code
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value);
                setOtpError(null);
              }}
              placeholder="123456"
              className="px-sm py-base text-body font-data w-full rounded-lg border tracking-widest"
              style={{ borderColor: otpError ? "var(--status-danger)" : "var(--border)" }}
            />
            {otpError && (
              <p className="text-body" style={{ color: "var(--status-danger)" }}>
                {otpError}
              </p>
            )}
          </div>
          <div className="mt-sm gap-xs flex items-center">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmVerification.isPending || otpInput.length === 0}
              className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)" }}
            >
              {confirmVerification.isPending ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearPhone.isPending}
              className="px-sm py-base text-body font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEntry && (
        <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <div className="gap-xs flex items-start">
            <Phone size={18} style={{ color: "var(--strabb-secondary)", marginTop: 10 }} />
            <div className="space-y-xs flex-1">
              <label className="text-body block font-medium text-gray-700" htmlFor="phone-input">
                Mobile number
              </label>
              <input
                id="phone-input"
                type="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="+61 400 000 000"
                className="px-sm py-base text-body w-full rounded-lg border"
                style={{ borderColor: phoneError ? "var(--status-danger)" : "var(--border)" }}
              />
              {phoneError && (
                <p className="text-body" style={{ color: "var(--status-danger)" }}>
                  {phoneError}
                </p>
              )}
              <p className="text-body text-gray-500">
                Include your country code, e.g. +61 for Australia.
              </p>
            </div>
          </div>
          <div className="mt-sm">
            <button
              type="button"
              onClick={handleRequest}
              disabled={requestVerification.isPending || cooldown > 0}
              className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)" }}
            >
              {requestVerification.isPending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Send code"}
            </button>
          </div>
        </div>
      )}

      {usage && (
        <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <h3 className="mb-sm text-body font-semibold text-gray-700">SMS usage today</h3>
          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">You</p>
              <p className="font-data text-subheading font-semibold text-gray-900">
                {usage.userTodayCount} / {usage.userDailyCap}
              </p>
            </div>
            <div>
              <p className="text-body text-gray-500">Your team</p>
              <p className="font-data text-subheading font-semibold text-gray-900">
                {usage.tenantTodayCount} / {usage.tenantDailyCap}
              </p>
            </div>
          </div>
          {!usage.canSend && (
            <div
              className="mt-sm gap-xs p-xs text-body flex items-center rounded-md"
              style={{
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                color: "var(--status-danger)",
              }}
            >
              <ShieldAlert size={14} />
              Daily cap reached - SMS sending paused until tomorrow.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

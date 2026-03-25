import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground mb-4 text-sm">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert space-y-4">
        <h2 className="text-xl font-semibold">1. Service Description</h2>
        <p>
          STRABB is a short-term rental management platform that centralises booking data from
          multiple platforms, automates cleaning task scheduling, and sends automated guest
          communications. STRABB does not manage bookings directly on third-party platforms.
        </p>

        <h2 className="text-xl font-semibold">2. Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the security of your account credentials and for all
          activity under your account. You must provide accurate property and listing information.
        </p>

        <h2 className="text-xl font-semibold">3. Booking Data</h2>
        <p>
          STRABB imports booking data via iCal feeds provided by you. Booking data is eventually
          consistent and may not reflect real-time changes on source platforms. STRABB detects but
          does not prevent booking conflicts — resolution must be done on the source platform.
        </p>

        <h2 className="text-xl font-semibold">4. Billing</h2>
        <p>
          STRABB offers a 14-day free trial. After the trial, a subscription is required based on
          the number of active listings. Billing is handled via Stripe. You may cancel at any time.
        </p>

        <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
        <p>
          STRABB is provided &quot;as is&quot; without warranty. We are not liable for missed
          bookings, scheduling errors, or email delivery failures. STRABB is an operational tool,
          not a replacement for booking platforms.
        </p>

        <h2 className="text-xl font-semibold">6. Termination</h2>
        <p>
          Either party may terminate the agreement at any time. Upon termination, your data will be
          retained for 30 days before deletion unless you request earlier removal.
        </p>

        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>
          For questions about these terms, email{" "}
          <a href="mailto:support@strabb.io" className="underline">
            support@strabb.io
          </a>
          .
        </p>
      </div>

      <div className="mt-8">
        <Link href="/login" className="text-sm underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="px-sm py-xl mx-auto max-w-2xl">
      <h1 className="mb-md text-heading font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-sm text-body">Last updated: March 2026</p>

      <div className="prose prose-sm dark:prose-invert space-y-sm">
        <h2 className="text-subheading font-semibold">1. Information We Collect</h2>
        <p>
          STRABB collects information you provide when creating an account (name, email), property
          and listing details, and booking data imported from third-party platforms via iCal feeds.
        </p>

        <h2 className="text-subheading font-semibold">2. How We Use Your Information</h2>
        <p>
          We use your information to provide our short-term rental management services, including
          booking synchronisation, cleaning task scheduling, and guest communication. We do not sell
          your data to third parties.
        </p>

        <h2 className="text-subheading font-semibold">3. Data Storage</h2>
        <p>
          Your data is stored securely on Australian-hosted infrastructure. We use industry-standard
          encryption for data in transit and at rest.
        </p>

        <h2 className="text-subheading font-semibold">4. Third-Party Services</h2>
        <p>
          We use SendGrid for email delivery and Stripe for payment processing. These services have
          their own privacy policies. Booking data is imported from platforms you connect via iCal
          feeds.
        </p>

        <h2 className="text-subheading font-semibold">5. Your Rights</h2>
        <p>
          Under Australian Privacy Principles, you have the right to access, correct, or delete your
          personal information. Contact us at privacy@strabb.io to make a request.
        </p>

        <h2 className="text-subheading font-semibold">6. Contact</h2>
        <p>
          For privacy-related enquiries, email{" "}
          <a href="mailto:privacy@strabb.io" className="underline" data-no-elevate>
            privacy@strabb.io
          </a>
          .
        </p>
      </div>

      <div className="mt-lg">
        <Link href="/login" className="text-body underline" data-no-elevate>
          Back to login
        </Link>
      </div>
    </div>
  );
}

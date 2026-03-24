import { MailIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Manage automated workflows for your properties."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/automations/cleaning"
          className="hover:bg-muted/50 flex items-start gap-4 rounded-xl border p-4 transition-colors"
        >
          <SparklesIcon className="text-muted-foreground mt-0.5 size-5" />
          <div>
            <p className="font-medium">Cleaning Tasks</p>
            <p className="text-muted-foreground text-sm">
              Automatically scheduled from confirmed bookings.
            </p>
          </div>
        </Link>
        <Link
          href="/automations/messages"
          className="hover:bg-muted/50 flex items-start gap-4 rounded-xl border p-4 transition-colors"
        >
          <MailIcon className="text-muted-foreground mt-0.5 size-5" />
          <div>
            <p className="font-medium">Guest Messages</p>
            <p className="text-muted-foreground text-sm">
              Automated emails for booking confirmation, check-in, and reminders.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

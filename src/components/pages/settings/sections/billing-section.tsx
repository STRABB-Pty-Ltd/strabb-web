"use client";

export function BillingSection() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-500">
          Manage your subscription and payment details.
        </p>
      </div>

      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Current Plan</p>
            <p className="text-xs text-gray-500">Professional</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: "var(--semantic-success)" }}
          >
            Active
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Monthly Cost</p>
            <p className="font-data text-lg font-semibold text-gray-900">
              $49/mo
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Listings</p>
            <p className="font-data text-lg font-semibold text-gray-900">
              6
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Next Billing Date</p>
            <p className="text-sm text-gray-700">01-05-2026</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="text-sm text-gray-700">**** **** **** 4242</p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          Manage Subscription
        </button>
      </div>

      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Usage Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Listings</span>
            <span className="font-data text-gray-900">6 / 10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">iCal Syncs (this month)</span>
            <span className="font-data text-gray-900">1,247</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Messages Processed</span>
            <span className="font-data text-gray-900">89</span>
          </div>
        </div>
      </div>
    </div>
  );
}

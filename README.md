# STRABB Web

Next.js frontend for STRABB — short-term rental booking aggregation and automation.

## Prerequisites

- Node.js 20+
- STRABB API running (http://localhost:8000)

## Setup

```bash
# Clone and enter directory
cd strabb-web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

## Running

```bash
npm run dev
```

App available at http://localhost:3100.

## Demo Account

Login with: `demo@strabb.io` / `demo1234` (after seeding the API database).

## Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
```

## Linting & Formatting

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint autofix
npm run format        # Prettier check
npm run format:fix    # Prettier autofix
```

## Project Structure

```
src/
  app/
    (authenticated)/    — Protected pages (dashboard, properties, listings, bookings, etc.)
    (public)/           — Public pages (privacy, terms)
    login/              — Login page
    api/auth/           — NextAuth API route
  components/
    ui/                 — Reusable UI components (Button, DataTable, Dialog, etc.)
    billing/            — Billing banner
    bookings/           — Booking detail dialog
    cleaning-tasks/     — Cleaning task dialog
    listings/           — Listing form + delete dialogs
    properties/         — Property form + delete dialogs
    layout/             — Sidebar, account menu
  hooks/                — React Query hooks for API calls
  lib/
    schemas/            — TypeScript types + Zod validation
    auth.ts             — NextAuth configuration
    api-client.ts       — Authenticated HTTP client
    case-utils.ts       — camelCase/snake_case conversion
    date-utils.ts       — Timezone-aware date formatting
  test-utils/           — Shared test mocks
```

## Pages

| Page           | Path                  | Description                    |
| -------------- | --------------------- | ------------------------------ |
| Dashboard      | /dashboard            | Stats + recent bookings        |
| Properties     | /properties           | Property CRUD                  |
| Listings       | /listings             | Listing CRUD + sync button     |
| Bookings       | /bookings             | Filtered booking list + detail |
| Cleaning Tasks | /automations/cleaning | Auto-generated tasks           |
| Guest Messages | /automations/messages | Email templates                |
| Settings       | /settings             | Billing + system health        |
| Onboarding     | /onboarding           | Setup wizard                   |

# STRABB Web Implementation Plan -- Phases 13-24

## Overview

This plan rebuilds the strabb-web frontend to match the strabb-desktop-v1.3.html mockup exactly. The mockup defines 6 pages (Dashboard, Calendar, Messaging, Cleaning, Reporting, Settings), a top-nav-bar architecture (not sidebar navigation), a submenu chip system, a contextual sidebar, and an overlay/panel system. Every element in this plan traces to the mockup. Nothing is invented.

**Decision Log:**
- D-01: Mock data factories in `src/lib/mock-data/` per domain, toggled by `NEXT_PUBLIC_USE_MOCK_DATA`
- D-02: Recharts for all charting (revenue trend, channel breakdown, occupancy, expenses, revenue by listing)
- D-03: Custom CSS grid Gantt chart (no library)
- D-04: dnd-kit for drag-and-drop (@dnd-kit/core + @dnd-kit/sortable)
- D-05: Zustand for state management (one store, slices per concern, matching mockup state machine)

**New Dependencies to Install:**
- `recharts` -- charting library
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` -- drag and drop
- `zustand` -- state management
- `sonner` -- toast notifications (bottom-right per mockup)

**Pages (ONLY these 6, matching mockup):**
1. Dashboard -- KPI grid + alert strip + compare mode + preview grid
2. Calendar -- Gantt view + Calendar view (month/week/day/fortnight) + List view
3. Messaging -- Kanban view + List view (split-pane with thread overlay)
4. Cleaning -- Kanban view + Calendar view + List view + Gantt view + shopping list modal
5. Reporting -- KPI cards + chart grid + saved reports
6. Settings -- Two-column left-nav + content pane

**NOT building (not in mockup):**
- Guests page (standalone)
- Maintenance page (standalone -- maintenance exists only as a data model/triage action)
- Integrations page (standalone -- covered within Settings)
- Property Detail page
- Booking Detail page
- Automations page (standalone)

---

## Wave Structure

| Wave | Phases | Description | Can Start |
|------|--------|-------------|-----------|
| 1 | 13, 14, 15 | Foundation (tokens, types+mock, Zustand store) | Immediately, all parallel |
| 2 | 16, 17 | App shell + Shared view components | After Wave 1 |
| 3 | 18, 19, 20, 21, 22, 23 | All 6 pages (parallel, each depends on shell + views) | After Wave 2 |
| 4 | 24 | Route migration, API wiring, cross-cutting polish | After Wave 3 |

---

## Phase 13: Design Tokens + Typography Migration

**Wave:** 1 (no dependencies)
**Goal:** Establish the mockup's design token system (colors, spacing, typography, shadows) as CSS custom properties and Tailwind theme extensions, replacing the current generic shadcn defaults.

### Task 13.1: Install New Dependencies

**Files:**
- `package.json`

**Action:**
```bash
npm install recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand sonner
```

**Verify:** `npm run build` completes without errors.
**Done:** All new libraries in `dependencies`.

---

### Task 13.2: Establish Design Tokens in CSS + Tailwind

**Files to modify:**
- `src/app/globals.css`

**Action:** Replace the current shadcn default `:root` variables with the mockup's design token system. Keep the shadcn structural variables (--radius, --border, etc.) but override colors to match mockup.

Design tokens to define as CSS custom properties:

```css
:root {
  /* Primary palette */
  --strabb-primary: #1E40AF;
  --strabb-secondary: #3B82F6;
  --strabb-accent: #D97706;

  /* Channel colors */
  --channel-airbnb: #FF5A5F;
  --channel-booking: #003580;
  --channel-vrbo: #3B5998;
  --channel-direct: #D97706;

  /* Semantic colors */
  --semantic-success: #16A34A;
  --semantic-warning: #92400E;
  --semantic-destructive: #DC2626;
  --semantic-in-progress: #8B5CF6;

  /* Cleaning status colors */
  --status-pending: #D97706;
  --status-confirmed: #3B82F6;
  --status-in-progress: #8B5CF6;
  --status-completed: #16A34A;
  --status-issues: #DC2626;
  --status-cancelled: #6B7280;

  /* Booking status colors */
  --booking-checked-out: #6B7280;
  --booking-checked-in: #16A34A;
  --booking-confirmed: #3B82F6;
  --booking-pending: #D97706;
  --booking-cancelled: #DC2626;

  /* Layout dimensions */
  --topnav-height: 56px;
  --submenu-height: 44px;
  --sidebar-width: 260px;
  --drilldown-width: 420px;
  --thread-width: 520px;

  /* Spacing scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);

  /* Chip (submenu) styling */
  --chip-radius: 20px;
  --chip-height: 32px;
}
```

Also override the shadcn `--primary` to use `--strabb-primary` (oklch equivalent of #1E40AF) and `--destructive` to use `--semantic-destructive`.

Add font-face declarations or Google Fonts import for Fira Sans (UI text) and Fira Code (data values/titles). Set body font-family to `'Fira Sans', sans-serif`. Data value elements will use `font-family: 'Fira Code', monospace` via a utility class `.font-data`.

**Verify:** `npm run build` passes; dev server shows updated colors on existing pages.
**Done:** All mockup design tokens are CSS custom properties; fonts are Fira Sans + Fira Code; shadcn overrides applied.

---

## Phase 14: TypeScript Domain Types + Mock Data Factories

**Wave:** 1 (parallel with Phase 13 and 15)
**Goal:** Define all 8 domain model types from the mockup and create mock data factories that produce realistic sample data.

**Auth session type note:** The existing `src/types/auth.ts` defines the client session shape. The client session exposes `accessToken`, `tenantId`, `userId`, `role`, `currentUser`, and `error` — but NOT `refreshToken`. The refresh token stays server-side in the JWT only (see `src/lib/auth.ts` session callback). Any new types or hooks in this phase or later phases that reference session fields must respect this contract.

### Task 14.1: Create All 8 Domain Model Type Definitions

**Files to create:**
- `src/types/listing.ts`
- `src/types/booking.ts`
- `src/types/message.ts`
- `src/types/cleaning-task.ts`
- `src/types/financial.ts`
- `src/types/shopping-item.ts`
- `src/types/vacancy.ts`
- `src/types/maintenance.ts`

**Action:** Define TypeScript interfaces for exactly the 8 models specified in the mockup. Each type must include every field listed in the mockup's data model specification.

```typescript
// src/types/listing.ts
export type ListingRelationship = "parent" | "child" | "standalone";
export interface Listing {
  id: string;
  name: string;
  relationship: ListingRelationship;
  parentId: string | null;       // null for parent/standalone
  children: string[];            // child listing IDs (empty for child/standalone)
  color: string;                 // hex color for UI display
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  nightlyRate: number;           // AUD
  location: string;
  propertyId: string;
  isActive: boolean;
}

// src/types/booking.ts
export type BookingChannel = "airbnb" | "booking_com" | "vrbo" | "direct" | "internal_notes";
export type BookingStatus = "checked_out" | "checked_in" | "confirmed" | "pending" | "cancelled";
export interface Booking {
  id: string;
  listingId: string;
  listingName: string;
  guestName: string;
  guestEmail: string | null;
  channel: BookingChannel;
  checkIn: string;               // ISO date
  checkOut: string;              // ISO date
  guestCount: number;
  nightlyRate: number;           // AUD
  totalAmount: number;           // AUD
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}

// src/types/message.ts
export type MessagePriority = "high" | "medium" | "low";  // frontend can display "low" as "Normal" in UI
export type MessageStatus = "unread" | "flagged" | "read" | "archived";
export interface Message {
  id: string;
  bookingId: string;
  listingId: string;
  listingName: string;
  guestName: string;
  channel: BookingChannel;
  status: MessageStatus;
  priority: MessagePriority;
  subject: string;
  lastMessageTime: string;       // ISO datetime
  messageCount: number;
  isGuest: boolean;              // true if last message was from guest
  previewText: string;
  checkIn: string;
  checkOut: string;
}

export interface ThreadMessage {
  id: string;
  messageId: string;             // parent Message.id
  content: string;
  sentAt: string;                // ISO datetime
  isGuest: boolean;              // true = guest (left-aligned), false = host (right-aligned, blue bg)
  senderName: string;
}

// src/types/cleaning-task.ts
export type CleaningStatus = "pending" | "confirmed" | "in_progress" | "completed" | "issues" | "cancelled";
export type CleaningPriority = "low" | "medium" | "high" | "urgent";
export type CleaningType = "checkout" | "checkin" | "deep_clean" | "mid_stay" | "inspection" | "turnover";
export interface CleaningTask {
  id: string;
  listingId: string;
  listingName: string;
  listingColor: string;          // hex, for card border-left
  bookingId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  scheduledTime: string;         // ISO datetime
  completedTime: string | null;
  checklistTotal: number;
  checklistDone: number;
  priority: CleaningPriority;
  status: CleaningStatus;
  type: CleaningType;
  estimatedHours: number;
  notes: string | null;
}

// src/types/financial.ts
export interface Financial {
  id: string;
  month: string;                 // "2026-01", "2026-02", etc.
  listingId: string;
  listingName: string;
  revenue: number;               // AUD
  cleaningCost: number;          // AUD
  maintenanceCost: number;       // AUD
  suppliesCost: number;          // AUD
  platformFees: number;          // AUD
  occupancyRate: number;         // 0-100
  avgNightlyRate: number;        // AUD
  bookingCount: number;
}

// src/types/shopping-item.ts
export type ShoppingItemStatus = "requested" | "approved" | "purchased";
export type ShoppingItemPriority = "low" | "medium" | "high";
export interface ShoppingItem {
  id: string;
  listingId: string;
  listingName: string;
  item: string;
  quantity: number;
  status: ShoppingItemStatus;
  requestedDate: string;         // ISO date
  priority: ShoppingItemPriority;
  notes: string | null;
}

// src/types/vacancy.ts
export interface Vacancy {
  id: string;
  listingId: string;
  listingName: string;
  startDate: string;             // ISO date
  endDate: string;               // ISO date
  gapDays: number;
}

// src/types/maintenance.ts
export type MaintenancePriority = "low" | "medium" | "high" | "urgent";
export type MaintenanceStatus = "reported" | "scheduled" | "in_progress" | "completed" | "cancelled";
export interface Maintenance {
  id: string;
  listingId: string;
  listingName: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dateReported: string;          // ISO date
  dateScheduled: string | null;  // ISO date
  notes: string | null;
}
```

Also create a barrel export:
- `src/types/domain.ts` -- re-exports all 8 model types and their enums

**Verify:** `npm run build` passes; all 8 type files importable from `@/types/domain`.
**Done:** All 8 domain models typed with every mockup-specified field.

---

### Task 14.2: Create Mock Data Factories

**Files to create:**
- `src/lib/mock-data/index.ts`
- `src/lib/mock-data/listings.ts`
- `src/lib/mock-data/bookings.ts`
- `src/lib/mock-data/messages.ts`
- `src/lib/mock-data/cleaning-tasks.ts`
- `src/lib/mock-data/financials.ts`
- `src/lib/mock-data/shopping-items.ts`
- `src/lib/mock-data/vacancies.ts`
- `src/lib/mock-data/maintenance.ts`

**Action:** Create factory functions and pre-built mock datasets for all 8 domains. Each factory file exports:
1. `create{Entity}(overrides?: Partial<Entity>): Entity` -- factory with defaults + merge
2. `mock{Entity}List: Entity[]` -- pre-built array of 8-15 entries with realistic data

Key rules for mock data:
- Use deterministic IDs (e.g., `"lst-001"`, `"bk-001"`, `"msg-001"`)
- Dates relative to `new Date()` for realism
- Australian short-term rental context ($150-$500/night AUD)
- Listing names: "Bondi Beach Apartment", "Manly Surf Lodge", "Coogee Bay Studio", "Newtown Terrace", "Surry Hills Loft" (with parent/child relationships: Bondi Beach is parent with 2 children)
- Channel distribution: ~45% Airbnb, ~30% Booking.com, ~15% VRBO, ~10% Direct
- Each listing has a distinct color (e.g., Bondi=#3B82F6, Manly=#10B981, Coogee=#F59E0B, Newtown=#8B5CF6, Surry=#EC4899)
- Cleaning tasks spread across all 6 statuses
- Messages spread across all 4 statuses (unread/flagged/read/archived)
- Bookings spread across all 5 statuses
- Financial data for last 6 months

The index file exports the `USE_MOCK` toggle:
```typescript
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
```

**Verify:** Each factory file imports cleanly; `createListing()` returns a valid `Listing`; `mockBookingList` has entries across all channels; `mockCleaningTaskList` has entries across all 6 statuses.
**Done:** Mock data factories for all 8 domains with environment toggle.

---

### Task 14.3: Mock Data Tests

**Files to create:**
- `src/lib/mock-data/__tests__/factories.test.ts`

**Action:** Test that:
- Each `create{Entity}()` returns an object conforming to its type (all required fields present)
- Each `create{Entity}(overrides)` correctly merges overrides
- Each `mock{Entity}List` has at least 5 entries
- `mockBookingList` contains entries for all 5 booking statuses
- `mockCleaningTaskList` contains entries for all 6 cleaning statuses
- `mockMessageList` contains entries for all 4 message statuses
- `mockListingList` contains at least one parent, one child, and one standalone listing

**Verify:** `npm run test -- --filter=factories` passes.
**Done:** Factory tests pass.

---

## Phase 15: Zustand Store (Full State Machine)

**Wave:** 1 (parallel with Phase 13 and 14)
**Goal:** Implement the complete Zustand store matching the mockup's state machine specification. One store, slices per concern.

### Task 15.1: Create Zustand Store with All Slices

**Files to create:**
- `src/stores/app-store.ts`
- `src/stores/slices/navigation-slice.ts`
- `src/stores/slices/sidebar-slice.ts`
- `src/stores/slices/listings-slice.ts`
- `src/stores/slices/dashboard-slice.ts`
- `src/stores/slices/calendar-slice.ts`
- `src/stores/slices/messaging-slice.ts`
- `src/stores/slices/cleaning-slice.ts`
- `src/stores/slices/reporting-slice.ts`
- `src/stores/slices/settings-slice.ts`
- `src/stores/slices/overlay-slice.ts`

**Action:** Implement the full state machine from the mockup specification. The store shape MUST match:

```typescript
interface AppState {
  // Navigation
  currentPage: "dashboard" | "calendar" | "messaging" | "cleaning" | "reporting" | "settings";
  previousPage: string | null;
  sidebarOpen: boolean;

  // Listings (shared across pages)
  selectedListings: string[];       // listing IDs
  expandedGroups: Record<string, boolean>;
  customGroups: CustomGroup[];

  // Per-page state
  pages: {
    dashboard: {
      timeframe: string;            // "this_month", "last_month", "this_quarter", etc.
      submenu: string[];            // active submenu chips
      compare: boolean;
      moreOpen: boolean;
      drillDown: DrillDownState | null;
    };
    calendar: {
      view: "gantt" | "calendar" | "list";
      timeframe: string;
      submenu: string[];
      moreOpen: boolean;
      listSort: string;
      detailItem: string | null;    // booking/event ID for drill-down
    };
    messaging: {
      view: "kanban" | "list";
      submenu: string[];
      channels: string[];           // active channel filters
      selectedMessage: string | null;
      threadMessage: string | null;  // message ID for thread overlay
    };
    cleaning: {
      view: "kanban" | "calendar" | "list" | "gantt";
      timeframe: string;
      submenu: string[];
      moreOpen: boolean;
      listSort: string;
      ganttZoom: "day" | "week" | "month";
      shoppingDrawerOpen: boolean;
      boughtItems: string[];         // shopping item IDs marked as bought
    };
    reporting: {
      timeframe: string;
      submenu: string[];
      moreOpen: boolean;
      savedReportsOpen: boolean;
      activeSavedReport: string | null;
      savedReports: SavedReport[];
    };
    settings: {
      section: string;              // "general" | "team" | "billing" | "notifications" | "integrations" | "cleaning" | "channels"
    };
  };

  // Popups / overlays
  calendarDate: Date;
  tfPopup: { open: boolean; anchor: "sidebar" };
  customRange: { start: string; end: string } | null;
  shareFields: Record<string, boolean>;
}
```

Each slice file exports a `create{Name}Slice` function using the Zustand slice pattern. Include action methods:
- `setCurrentPage(page)` -- also sets `previousPage`
- `toggleSidebar()`, `setSidebarOpen(open)`
- `setSelectedListings(ids)`, `toggleListing(id)`, `selectAllListings()`, `clearListings()`
- `toggleGroup(groupId)`, `createCustomGroup(name, listingIds)`, `deleteCustomGroup(id)`
- Per-page: `setView(page, view)`, `setTimeframe(page, tf)`, `toggleSubmenuChip(page, chip)`, `setSubmenu(page, chips[])`
- Dashboard: `toggleCompare()`, `setDrillDown(item)`, `clearDrillDown()`
- Calendar: `setListSort(sort)`, `setDetailItem(id)`
- Messaging: `setSelectedMessage(id)`, `setThreadMessage(id)`, `toggleChannel(channel)`
- Cleaning: `setGanttZoom(zoom)`, `toggleShoppingDrawer()`, `toggleBoughtItem(id)`
- Reporting: `toggleSavedReports()`, `setActiveSavedReport(id)`, `addSavedReport(report)`, `deleteSavedReport(id)`
- Settings: `setSection(section)`
- Overlay: `openTimeframePopup()`, `closeTimeframePopup()`, `setCustomRange(range)`, `setShareFields(fields)`

The overlay slice also manages:
- `drillDownPanel: { open: boolean; type: string; itemId: string } | null`
- `threadOverlay: { open: boolean; messageId: string } | null`
- `sharePopup: { open: boolean }`
- `shoppingListPopup: { open: boolean }`
- `toasts: Toast[]`

**Verify:** `useAppStore.getState()` returns the full state shape; all action methods mutate state correctly; `npm run build` passes.
**Done:** Complete Zustand store matching mockup state machine.

---

### Task 15.2: Store Unit Tests

**Files to create:**
- `src/stores/__tests__/app-store.test.ts`

**Action:** Test key state transitions:
- `setCurrentPage("calendar")` sets currentPage and previousPage
- `toggleSubmenuChip("dashboard", "compare")` toggles compare flag for dashboard
- `toggleListing("lst-001")` adds/removes from selectedListings
- `setView("cleaning", "gantt")` updates cleaning view
- `toggleShoppingDrawer()` flips shoppingDrawerOpen
- `setThreadMessage("msg-001")` sets threadOverlay state
- `selectAllListings()` / `clearListings()` work correctly
- `createCustomGroup()` / `deleteCustomGroup()` manage custom groups

**Verify:** `npm run test -- --filter=app-store` passes.
**Done:** Store tests cover critical state transitions.

---

## Phase 16: App Shell Rebuild

**Wave:** 2 (depends on Phase 13 tokens, Phase 15 Zustand store)
**Goal:** Replace the current sidebar-first layout with the mockup's top-nav-bar architecture: 56px top nav for page switching, 44px submenu bar with chip filters, contextual 260px sidebar, and overlay/panel infrastructure.

### Task 16.1: Build Top Navigation Bar

**Files to create:**
- `src/components/shell/top-nav.tsx`

**Files to modify:**
- `src/lib/navigation.ts`

**Action:** Build the top navigation bar matching the mockup exactly.

Specs:
- 56px height, background `var(--strabb-primary)` (#1E40AF), white text
- Logo "STRABB" on the far left (padding-left 16px, font-weight 700, font-family Fira Code)
- 5 page buttons in a horizontal row: Dashboard, Calendar, Messaging, Cleaning, Reporting
  - Each button has an SVG icon (24x24) above the label text (12px)
  - Active page button has lighter background (`var(--strabb-secondary)` / #3B82F6), border-radius 8px
  - `aria-current="page"` on the active item
  - Buttons use `next/link` for client-side navigation
- Settings button (gear icon) on the far right, same styling pattern
- On click, updates Zustand `currentPage` via `setCurrentPage()`

Update `src/lib/navigation.ts` to export a `topNavItems` array (5 main pages) and a separate `settingsNavItem`, replacing the old sidebar-oriented `navItems`. Keep the old export temporarily for backward compatibility during migration.

**Verify:** Top nav renders at 56px with blue background; 5 page buttons + settings; active state highlights correctly; clicking navigates and updates Zustand store.
**Done:** Top nav bar matches mockup.

---

### Task 16.2: Build Submenu Bar

**Files to create:**
- `src/components/shell/submenu-bar.tsx`
- `src/lib/submenu-config.ts`

**Action:** Build the submenu chip bar that sits below the top nav.

Specs:
- 44px height, white background, border-bottom 1px solid var(--border)
- Horizontal scrollable overflow (overflow-x: auto, hide scrollbar)
- Chips are pill-shaped: border-radius var(--chip-radius) (20px), height var(--chip-height) (32px), padding 0 16px
- Inactive chip: border 1px solid #E5E7EB, background white, text #374151
- Active chip: background var(--strabb-secondary) (#3B82F6), text white, no border
- Gap between chips: 8px
- Left padding: 16px (aligns with sidebar width when sidebar is open)

Per-page chip configurations (defined in `src/lib/submenu-config.ts`):

```typescript
type ChipBehavior = "single-default" | "toggle" | "multi" | "exclusive" | "more-dropdown";

interface SubmenuChip {
  id: string;
  label: string;
  behavior: ChipBehavior;
  defaultActive?: boolean;
}

// Dashboard chips (mockup: Overview + Compare only)
dashboard: [
  { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
  { id: "compare", label: "Compare", behavior: "toggle" },
]

// Calendar chips (mockup: Overview + Bookings/Cleaning/Vacancy/Maintenance as multi)
calendar: [
  { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
  { id: "bookings", label: "Bookings", behavior: "multi" },
  { id: "cleaning", label: "Cleaning", behavior: "multi" },
  { id: "vacancy", label: "Vacancy", behavior: "multi" },
  { id: "maintenance", label: "Maintenance", behavior: "multi" },
]

// Messaging chips (mockup: Overview + Unread/Flagged/Read as multi + Archived as exclusive)
messaging: [
  { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
  { id: "unread", label: "Unread", behavior: "multi" },
  { id: "flagged", label: "Flagged", behavior: "multi" },
  { id: "read", label: "Read", behavior: "multi" },
  { id: "archived", label: "Archived", behavior: "exclusive" },
]

// Cleaning chips (mockup: Overview + Tickets/Confirmed/Pending as multi + Archived as exclusive)
cleaning: [
  { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
  { id: "tickets", label: "Tickets", behavior: "multi" },
  { id: "confirmed", label: "Confirmed", behavior: "multi" },
  { id: "pending", label: "Pending", behavior: "multi" },
  { id: "archived", label: "Archived", behavior: "exclusive" },
]

// Reporting chips (mockup: Overview + Revenue/Expenses/Bookings as multi + More as dropdown)
reporting: [
  { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
  { id: "revenue", label: "Revenue", behavior: "multi" },
  { id: "expenses", label: "Expenses", behavior: "multi" },
  { id: "bookings", label: "Bookings", behavior: "multi" },
  { id: "more", label: "More", behavior: "more-dropdown" },
]
```

Chip interaction logic:
- `single-default`: clicking any chip with this behavior resets submenu to `["overview"]`
- `toggle`: boolean flip (e.g., Compare). Clicking activates/deactivates it without affecting other chips.
- `multi`: additive. Clicking adds/removes. If removing the last `multi` chip, revert submenu to `["overview"]`.
- `exclusive`: only one `exclusive` chip selected at a time. Selecting one deselects others. Deselecting reverts to `["overview"]`.
- `more-dropdown`: renders as a chip but opens a dropdown menu on click. For now, show "Coming soon" items. The `moreOpen` state in Zustand tracks this.

The component reads `currentPage` from Zustand and renders the correct chip set. Clicking chips calls `toggleSubmenuChip(page, chipId)` or the appropriate Zustand action based on behavior type.

**Verify:** Submenu bar shows correct chips per page; chip click behavior matches all 5 types; visual styling matches mockup (pills, blue active, white inactive).
**Done:** Submenu bar with all chip configurations and interaction logic.

---

### Task 16.3: Build Contextual Sidebar

**Files to create:**
- `src/components/shell/contextual-sidebar.tsx`
- `src/components/shell/sidebar-sections/logo-section.tsx`
- `src/components/shell/sidebar-sections/view-switcher.tsx`
- `src/components/shell/sidebar-sections/listing-filter-tree.tsx`
- `src/components/shell/sidebar-sections/timeframe-selector.tsx`
- `src/components/shell/sidebar-sections/channel-filter.tsx`
- `src/components/shell/sidebar-sections/actions-section.tsx`

**Action:** Build the contextual sidebar that changes content based on `currentPage`. This is NOT a navigation sidebar -- it is a control panel.

Specs:
- 260px width (var(--sidebar-width)), full height below top nav + submenu
- Background white, border-right 1px solid var(--border)
- Collapsible on desktop: clicking a toggle button slides sidebar out via margin-left transition (margin-left: 0 -> -260px on canvas), sidebar itself uses transform: translateX(0) -> translateX(-100%)
- On mobile (<1024px): sidebar is floating overlay with scrim, triggered by a hamburger button in the top nav
- `sidebarOpen` state managed in Zustand

Section visibility by page:

| Section | Dashboard | Calendar | Messaging | Cleaning | Reporting | Settings |
|---------|-----------|----------|-----------|----------|-----------|----------|
| Logo | yes | yes | yes | yes | yes | no |
| View Switcher | no | yes (gantt/calendar/list) | yes (kanban/list) | yes (kanban/calendar/list/gantt) | no | no |
| Listing Filter Tree | yes | yes | yes | yes | yes | no |
| Timeframe Selector | yes | yes | no | yes | yes | no |
| Channel Filter | no | no | yes | no | no | no |
| Shopping List btn | no | no | no | yes | no | no |
| Saved Reports | no | no | no | no | yes | no |
| Actions (Share/Configure/Automations) | yes | yes | yes | yes | yes | no |

**Logo Section:** "STRABB" text with small logo mark. Always shown except Settings.

**View Switcher:** Radio-button style list of view options. Shows the views available for the current page. Clicking sets `setView(page, view)` in Zustand. Active view has a colored left border + bold text.

**Listing Filter Tree:** Hierarchical tree of listings with:
- Parent listings (expandable, show children on expand)
- Child listings (indented under parent)
- Standalone listings
- Custom groups (user-created, expandable, can be deleted)
- Each listing row: color dot (listing.color) + name + checkbox
- "Select All" / "Clear" links at top
- "Create Group" button at bottom (opens inline name input)
- Checking/unchecking updates `selectedListings` in Zustand
- Expanding/collapsing updates `expandedGroups` in Zustand

**Timeframe Selector:** 
- Primary timeframe chips specific to each page:
  - Dashboard: This Month, Last Month, This Quarter, YTD
  - Calendar: Day, Week, Fortnight, Month
  - Cleaning: Today, This Week, This Month
  - Reporting: This Month, Last Month, This Quarter, This Year, YTD
- Clicking a chip sets `setTimeframe(page, value)` in Zustand
- Active chip has filled background
- "Custom" chip that opens the timeframe popup (see Phase 17)
- Small "More" expander for additional timeframe options

**Channel Filter (Messaging only):** Checkbox list of channels (Airbnb, Booking.com, VRBO, Direct) with channel-colored icons. Toggles `toggleChannel()` in Zustand.

**Shopping List Button (Cleaning only):** Button that opens the shopping list popup modal. Sets `shoppingDrawerOpen` in Zustand.

**Saved Reports (Reporting only):** Collapsible drawer listing saved report presets. Each has a name and a "load" action. "Save Current" button at top.

**Actions Section:** Three buttons:
- Share -- opens share popup (overlay-slice)
- Configure -- placeholder (disabled)
- Automations -- placeholder (disabled)

**Verify:** Sidebar shows correct sections for each page; listing tree renders with parent/child hierarchy; view switcher changes view state; timeframe selector updates state; sidebar collapses/expands with animation.
**Done:** Contextual sidebar with all page-specific sections.

---

### Task 16.4: Assemble New App Shell Layout

**Files to create:**
- `src/components/shell/app-shell.tsx`
- `src/components/shell/canvas.tsx`

**Files to modify:**
- `src/app/(authenticated)/layout.tsx`

**Action:** Create the new app shell that composes top nav + submenu + sidebar + canvas.

Layout structure:
```
<div class="h-screen flex flex-col">
  <TopNav />              <!-- 56px, fixed top -->
  <SubmenuBar />          <!-- 44px, below top nav -->
  <div class="flex flex-1 overflow-hidden">
    <ContextualSidebar />  <!-- 260px, left -->
    <Canvas>               <!-- flex-1, scrollable -->
      {children}
    </Canvas>
  </div>
</div>
```

The Canvas component:
- Takes the remaining space (flex-1)
- Has overflow-y: auto for page content scrolling
- Padding: var(--space-md) (16px)
- When sidebar collapses, canvas expands to fill

Update the authenticated layout to use the new `AppShell` instead of the old one. The old `src/components/layout/app-shell.tsx`, `sidebar.tsx`, and `top-nav.tsx` remain in place (not deleted yet -- Phase 24 handles cleanup).

**Verify:** Dev server shows top nav (blue, 56px) + submenu (white, 44px, chips) + sidebar (260px, contextual) + canvas; navigating between pages updates all three zones; sidebar collapse/expand works; `npm run build` passes.
**Done:** Complete app shell matching mockup architecture.

---

## Phase 17: Shared View Component Library

**Wave:** 2 (depends on Phase 13 tokens, Phase 14 types, Phase 15 store)
**Goal:** Build all reusable view components that pages share: Gantt, Kanban, CalendarGrid, SortableList, chart wrappers, drill-down panel, thread overlay, timeframe popup, share popup, shopping list popup, and toast system.

### Task 17.1: Gantt View Component

**Files to create:**
- `src/components/views/gantt-view.tsx`
- `src/components/views/gantt-bar.tsx`
- `src/components/views/gantt-header.tsx`

**Action:** Build a reusable Gantt chart component (per D-03, custom CSS grid, no library). Used by Calendar page (bookings) and Cleaning page (tasks).

Specs:
- Left column: 160px wide, sticky (position: sticky, left: 0), shows listing/property names. Each row is one listing.
- Right area: CSS grid where each column = 1 day. Number of columns = date range span.
- Grid header row: day labels (Mon 7, Tue 8, etc.)
- Bars: absolutely positioned within grid cells, spanning start→end date columns
  - Calendar Gantt: bars colored by `channel` (Airbnb=#FF5A5F, Booking.com=#003580, VRBO=#3B5998, Direct=#D97706)
  - Cleaning Gantt: bars colored by `status` (pending=#D97706, confirmed=#3B82F6, in_progress=#8B5CF6, completed=#16A34A, issues=#DC2626, cancelled=#6B7280)
  - Bar height: 28px, border-radius: 4px, margin: 2px vertical
  - Bar content: truncated text (guest name for bookings, task type for cleaning)
- Today line: vertical dashed red line (border-left: 2px dashed #DC2626) at today's column
- Click on bar: opens drill-down panel (calls `setDrillDown(item)` in Zustand)
- Horizontal scroll on the grid area (left column stays fixed)

Props interface:
```typescript
interface GanttViewProps<T> {
  rows: { id: string; label: string; color?: string }[];
  items: T[];
  getRowId: (item: T) => string;
  getDateRange: (item: T) => { start: Date; end: Date };
  getColor: (item: T) => string;
  getLabel: (item: T) => string;
  dateRange: { start: Date; end: Date };
  onItemClick: (item: T) => void;
  todayLineColor?: string;
}
```

**Verify:** Gantt renders with mock booking data; bars span correct date columns; today line visible; clicking bar fires onItemClick; horizontal scroll works with sticky left column.
**Done:** Reusable Gantt view component.

---

### Task 17.2: Kanban Board Component

**Files to create:**
- `src/components/views/kanban-board.tsx`
- `src/components/views/kanban-column.tsx`
- `src/components/views/kanban-card.tsx`

**Action:** Build a reusable Kanban board with drag-and-drop (per D-04, dnd-kit).

Specs:
- Flex row of columns, horizontal scrollable if needed
- Each column: 280px min-width, flex-shrink: 0, background #F9FAFB, border-radius 8px
- Column header: status label + count badge (e.g., "Pending (3)")
- Column body: vertical scroll (max-height: calc(100vh - topnav - submenu - column-header))
- Cards: white background, border-radius 8px, box-shadow var(--shadow-sm), margin 8px
  - Border-left: 4px solid (channel color for Messaging, listing color for Cleaning)
  - Card content is generic (render prop or children)
- Drag-and-drop: dragging a card between columns changes its status
  - Uses `@dnd-kit/core` DndContext + `@dnd-kit/sortable` for within-column reordering
  - `onDragEnd` callback receives `{itemId, sourceColumn, targetColumn}`
  - Visual feedback: dragged card has elevated shadow, target column highlights

Props interface:
```typescript
interface KanbanBoardProps<T> {
  columns: { id: string; label: string; items: T[] }[];
  renderCard: (item: T) => React.ReactNode;
  onDragEnd: (result: { itemId: string; sourceColumn: string; targetColumn: string }) => void;
  getItemId: (item: T) => string;
  getBorderColor: (item: T) => string;
}
```

Messaging Kanban: 4 columns (Unread, Flagged, Read, Archived)
Cleaning Kanban: 5 columns (Pending, Confirmed, In Progress, Completed, Issues)

**Verify:** Kanban renders columns with cards; drag-and-drop moves cards between columns; column counts update; border-left colors render correctly.
**Done:** Reusable Kanban board with dnd-kit integration.

---

### Task 17.3: Calendar Grid Component

**Files to create:**
- `src/components/views/calendar-grid.tsx`
- `src/components/views/calendar-day-cell.tsx`
- `src/components/views/calendar-event-chip.tsx`

**Action:** Build a reusable calendar grid supporting month, week, day, and fortnight modes. Used by Calendar page and Cleaning page.

Specs:
- **Month view:** 7-column grid (Mon-Sun header), 5-6 rows of day cells
  - Day cell: date number top-left, event chips stacked below
  - Event chip: small colored bar with truncated text, colored by channel/status
  - "+N more" link when >3 events in a cell (clicking expands or opens day view)
  - Today's cell: light blue background highlight
  - Days outside current month: dimmed text
- **Week view:** 7-column grid with larger cells (more room for event detail)
- **Day view:** single column, events listed vertically with full detail
- **Fortnight view:** 14-day layout (2 weeks side by side)
- Clicking an event chip opens the drill-down panel
- Navigation arrows (prev/next period) above the grid

Props interface:
```typescript
interface CalendarGridProps<T> {
  mode: "month" | "week" | "day" | "fortnight";
  currentDate: Date;
  events: T[];
  getEventDate: (event: T) => { start: Date; end: Date };
  getEventColor: (event: T) => string;
  getEventLabel: (event: T) => string;
  onEventClick: (event: T) => void;
  onDateChange: (date: Date) => void;
  maxEventsPerCell?: number;   // default 3
}
```

**Verify:** Month grid renders 7 columns x 5-6 rows; events show as colored chips; "+N more" shows when >3 events; today is highlighted; week/day/fortnight modes render correctly.
**Done:** Reusable calendar grid with 4 display modes.

---

### Task 17.4: Sortable List Component

**Files to create:**
- `src/components/views/sortable-list.tsx`
- `src/components/views/sortable-list-header.tsx`
- `src/components/views/sortable-list-row.tsx`

**Action:** Build a reusable sortable list/table component. Used by Calendar List view, Cleaning List view, and as a base for other list displays.

Specs:
- Table-style layout with sortable column headers
- Column header: label + sort indicator (arrow up/down/neutral)
- Clicking header sorts by that column (toggle asc/desc/none)
- Rows: alternating background (white / #F9FAFB), hover highlight
- Row height: 48px
- Clicking a row opens the drill-down panel
- Responsive: on mobile, switch to card-style layout

Props interface:
```typescript
interface SortableListProps<T> {
  columns: { key: string; label: string; width?: string; sortable?: boolean; render?: (item: T) => React.ReactNode }[];
  data: T[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  onRowClick: (item: T) => void;
  getRowId: (item: T) => string;
}
```

**Verify:** List renders with correct columns; clicking headers sorts data; rows are clickable; alternating row colors work.
**Done:** Reusable sortable list component.

---

### Task 17.5: Overlay and Panel System

**Files to create:**
- `src/components/overlays/drill-down-panel.tsx`
- `src/components/overlays/thread-overlay.tsx`
- `src/components/overlays/share-popup.tsx`
- `src/components/overlays/shopping-list-popup.tsx`
- `src/components/overlays/timeframe-popup.tsx`
- `src/components/overlays/toast-container.tsx`

**Action:** Build all overlay/panel components from the mockup.

**Drill-Down Panel (420px):**
- Slides from right edge: `transform: translateX(100%)` -> `translateX(0)`, transition 300ms ease
- Colored accent bar at top (8px height, color based on content type: channel color for bookings, status color for cleaning, semantic color for alerts)
- Header: title text + close button (X icon, top-right)
- Body: scrollable content area
- Closes on: Escape key, close button, click outside panel
- z-index: 150
- Content is generic (render prop) -- pages provide the body content based on what was clicked

**Thread Overlay (520px):**
- Slides from right edge (same animation as drill-down but wider)
- Semi-transparent scrim behind it (background: rgba(0,0,0,0.3), z-index: 175)
- Used ONLY by Messaging page
- Structure:
  - Booking context header: guest name, listing name, check-in/check-out dates, channel badge
  - Thread body (scrollable): message bubbles
    - Guest messages: left-aligned, gray background (#F3F4F6), border-radius 12px 12px 12px 0
    - Host messages: right-aligned, blue background (var(--strabb-secondary)), white text, border-radius 12px 12px 0 12px
    - Each bubble: sender name, timestamp, message content
  - Triage bar: row of action buttons (Resolved, Follow Up, Priority, Convert to Maintenance)
  - Compose area: textarea + send button (blue, right-aligned)
- Closes on: Escape, close button (no click-outside due to scrim)

**Share Popup (modal):**
- Centered modal with scrim
- Title: "Share Report" / "Share View"
- Body: list of field toggles (checkboxes) -- which data fields to include
- Preview section showing what will be shared
- Footer: Copy Link, Download PDF (disabled placeholder), Cancel
- Uses Zustand `shareFields` state

**Shopping List Popup (modal):**
- Centered modal with scrim
- Title: "Shopping List"
- Body: list of shopping items grouped by listing
  - Each item: checkbox (bought/not), item name, quantity, priority badge
  - Checking marks as bought (updates `boughtItems` in Zustand)
- Footer: Copy List (copies text to clipboard), Share Link (placeholder), Close
- Filter: show all / show needed only

**Timeframe Popup:**
- NOT centered -- positioned adjacent to sidebar right edge + 8px gap
- Anchored below the timeframe selector in sidebar
- Content depends on current timeframe type:
  - Day: month calendar grid, click to select a day
  - Week/Fortnight: month calendar with full-week-row highlighting on hover/click
  - Month: grid of 12 month cells for the year
  - Quarter: 4 quarter cells
  - Year: decade grid (10 years)
  - Custom: two date inputs (start + end) + Apply button
- Navigation arrows: prev/next (period depends on view -- prev/next month for day/week, prev/next year for month/quarter)
- Current period highlighted with filled background
- Closes on selection or Escape

**Toast Container:**
- Fixed position: bottom-right (bottom: 24px, right: 24px)
- Uses `sonner` library for toast management
- Toast types: success (green icon), error (red icon), warning (amber icon), info (blue icon)
- Auto-dismiss: 5 seconds
- Stacks vertically (newest on top)

**Verify:** Drill-down panel slides in/out from right; thread overlay shows scrim + 520px panel; share popup renders as centered modal with field toggles; shopping list popup renders item checkboxes; timeframe popup positions next to sidebar; toasts appear bottom-right and auto-dismiss.
**Done:** Complete overlay/panel system.

---

### Task 17.6: Chart Wrapper Components

**Files to create:**
- `src/components/charts/chart-container.tsx`
- `src/components/charts/revenue-trend-chart.tsx`
- `src/components/charts/channel-breakdown-chart.tsx`
- `src/components/charts/occupancy-chart.tsx`
- `src/components/charts/expense-chart.tsx`
- `src/components/charts/revenue-by-listing-chart.tsx`

**Action:** Build Recharts (per D-02) wrapper components for the 5 chart types used in Dashboard and Reporting pages.

**ChartContainer:** Wrapper that handles loading state, error state, empty state, and consistent sizing (min-height 300px). Uses `<ResponsiveContainer>` from Recharts.

**Revenue Trend:** Recharts `<AreaChart>` with gradient fill. X-axis: months/weeks/days. Y-axis: AUD formatted. Tooltip shows exact value + booking count. Line color: var(--strabb-primary).

**Channel Breakdown:** Recharts `<BarChart layout="vertical">`. Bars colored per channel (Airbnb=#FF5A5F, Booking.com=#003580, VRBO=#3B5998, Direct=#D97706). Labels show percentage + AUD value.

**Occupancy by Listing:** Recharts `<BarChart>`. Horizontal bars showing occupancy % per listing. Color gradient: red (<50%) -> yellow (50-80%) -> green (>80%).

**Expense Breakdown:** Recharts `<PieChart>` with legend. Categories: Cleaning, Maintenance, Supplies, Platform Fees. Donut style (innerRadius 60%).

**Revenue by Listing:** Recharts `<BarChart>`. Vertical bars per listing, sorted descending by revenue. Bar color matches listing color.

All charts: format currency as AUD (`Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" })`), use Fira Code font for data values (`.font-data` class).

**Verify:** Each chart renders with mock financial data; tooltips show correct values; responsive resizing works; empty state renders gracefully.
**Done:** 5 chart components + chart container wrapper.

---

### Task 17.7: View Component Tests

**Files to create:**
- `src/components/views/__tests__/gantt-view.test.tsx`
- `src/components/views/__tests__/kanban-board.test.tsx`
- `src/components/views/__tests__/calendar-grid.test.tsx`
- `src/components/overlays/__tests__/drill-down-panel.test.tsx`

**Action:** Test key behaviors:
- Gantt: renders correct number of rows; bars span correct columns; today line positioned correctly
- Kanban: renders correct number of columns; cards appear in correct columns; drag-end callback fires
- Calendar grid: month mode renders 7 columns; events render as chips; "+N more" shows at threshold
- Drill-down panel: renders when open; closes on Escape; close button works; does not render when closed

**Verify:** `npm run test -- --filter=views --filter=overlays` passes.
**Done:** View component tests pass.

---

## Phase 18: Dashboard Page

**Wave:** 3 (depends on Phase 16 app shell, Phase 17 charts + drill-down panel)
**Goal:** Build the Dashboard page matching the mockup: KPI grid, alert strip, compare mode, and preview grid.

### Task 18.1: Dashboard Data Hooks

**Files to create:**
- `src/hooks/use-dashboard.ts`

**Action:** Create hooks that serve dashboard data with mock fallback:
- `useDashboardKPIs(timeframe, selectedListings)` -- returns KPI card data (total revenue, total bookings, avg occupancy, avg nightly rate, upcoming check-ins, active tasks)
- `useDashboardAlerts(selectedListings)` -- returns alert items (conflicts, overdue cleanings, unread messages, sync errors)
- `useDashboardPreview(selectedListings, timeframe)` -- returns preview grid data (mini calendar, mini revenue chart, upcoming bookings list, task summary)

Each hook: if `USE_MOCK` is true, return mock data. Otherwise, call API endpoints via `useAuthenticatedQuery` from existing TanStack Query setup.

**Verify:** Hooks return correctly shaped mock data; loading/error states handled.
**Done:** Dashboard hooks with mock fallback.

---

### Task 18.2: Build Dashboard Page

**Files to create:**
- `src/app/(authenticated)/dashboard/page.tsx` (overwrite existing)
- `src/components/pages/dashboard/kpi-grid.tsx`
- `src/components/pages/dashboard/alert-strip.tsx`
- `src/components/pages/dashboard/compare-panel.tsx`
- `src/components/pages/dashboard/preview-grid.tsx`
- `src/components/pages/dashboard/kpi-card.tsx`

**Action:** Build the Dashboard page with:

**KPI Grid (top section):**
- 6 KPI cards in a responsive grid (3 cols on xl, 2 cols on lg, 1 col on sm)
- Each KPI card: icon (top-left), value (large, Fira Code), label (small, below value), trend indicator (percentage change with up/down arrow, green/red)
- KPI cards: Total Revenue, Total Bookings, Avg Occupancy %, Avg Nightly Rate, Upcoming Check-ins, Active Cleaning Tasks
- Clicking a KPI card opens the drill-down panel with detailed breakdown (e.g., clicking Revenue shows revenue by listing)

**Alert Strip (below KPIs):**
- Horizontal scrollable row of alert cards (only shown when alerts exist)
- Alert card: colored left border (red for conflicts, amber for overdue, blue for info), icon, brief description, "View" link
- Clicking opens drill-down panel with alert details
- Dismissible (x button on each alert)

**Compare Mode:**
- Activated by the "Compare" submenu chip (toggle behavior)
- When active: each KPI card shows two values (current period + comparison period) with delta
- A secondary timeframe selector appears for the comparison period
- Charts show overlaid data (current + comparison as dashed line)

**Preview Grid (bottom section):**
- 2x2 grid (lg) / stacked (sm) of preview panels:
  - Mini calendar (next 7 days, compact)
  - Revenue mini chart (sparkline for current period)
  - Upcoming bookings (next 5, compact list)
  - Task summary (status breakdown counts)
- Each panel: Card with title, content, "View All" link that navigates to the relevant page

Page reads state from Zustand: `pages.dashboard.timeframe`, `pages.dashboard.submenu`, `pages.dashboard.compare`, `selectedListings`.

**Verify:** Dashboard shows 6 KPI cards with mock data; alert strip renders when alerts exist; compare mode toggles via submenu chip; preview grid shows 4 panels; drill-down panel opens on KPI card click; `npm run build` passes.
**Done:** Complete Dashboard page matching mockup.

---

## Phase 19: Calendar Page

**Wave:** 3 (depends on Phase 16 shell, Phase 17 Gantt + CalendarGrid + SortableList + drill-down panel)
**Goal:** Build the Calendar page with all 3 views: Gantt, Calendar (month/week/day/fortnight), and List.

### Task 19.1: Calendar Data Hooks

**Files to create:**
- `src/hooks/use-calendar.ts`

**Action:** Create hooks:
- `useCalendarEvents(dateRange, selectedListings, submenuFilters)` -- returns bookings, vacancies, and maintenance items as calendar events. Filters based on submenu chips (bookings, vacancies, maintenance) and selected listings.
- `useCalendarListSort(events, sortKey, sortDirection)` -- returns sorted events for list view

Mock fallback: generate events from `mockBookingList`, `mockVacancyList`, `mockMaintenanceList`.

**Verify:** Hook returns events filtered by date range and listings; list sort works correctly.
**Done:** Calendar hooks with mock fallback.

---

### Task 19.2: Build Calendar Page with 3 Views

**Files to create:**
- `src/app/(authenticated)/calendar/page.tsx`
- `src/components/pages/calendar/calendar-gantt-view.tsx`
- `src/components/pages/calendar/calendar-month-view.tsx`
- `src/components/pages/calendar/calendar-list-view.tsx`

**Action:** Build the Calendar page with view switching controlled by the sidebar View Switcher.

**Gantt View (default):**
- Uses `<GanttView>` from Phase 17
- Rows = selected listings (grouped by property)
- Items = bookings + vacancies + maintenance blocks
- Bar colors: bookings by channel color, vacancies gray, maintenance amber
- Date range: controlled by sidebar timeframe selector
- Click bar -> drill-down panel showing booking/vacancy/maintenance detail

**Calendar View (month/week/day/fortnight):**
- Uses `<CalendarGrid>` from Phase 17
- Mode controlled by sidebar timeframe: "month" chip -> month mode, "week" -> week, "day" -> day, "fortnight" -> fortnight
- Events colored by channel
- Click event -> drill-down panel

**List View:**
- Uses `<SortableList>` from Phase 17
- Columns: Listing, Guest, Channel (colored badge), Check-in, Check-out, Status, Amount
- Sort controlled by `listSort` state in Zustand
- Click row -> drill-down panel

Page reads Zustand state: `pages.calendar.view`, `pages.calendar.timeframe`, `pages.calendar.submenu`, `pages.calendar.listSort`, `selectedListings`.

View switch happens in sidebar View Switcher (Phase 16.3). Submenu chips filter event types (bookings, vacancies, maintenance). Timeframe changes date range for all views.

**Verify:** All 3 views render with mock data; switching views via sidebar works; submenu chips filter events; timeframe changes date range; clicking items opens drill-down panel; `npm run build` passes.
**Done:** Calendar page with Gantt, Calendar, and List views.

---

## Phase 20: Messaging Page

**Wave:** 3 (depends on Phase 16 shell, Phase 17 Kanban + thread overlay)
**Goal:** Build the Messaging page with Kanban and List views, plus the thread overlay.

### Task 20.1: Messaging Data Hooks

**Files to create:**
- `src/hooks/use-messaging.ts`

**Action:** Create hooks:
- `useMessages(channels, submenuFilters, selectedListings)` -- returns messages filtered by channel, status (from submenu chips: unread/flagged/urgent), and selected listings
- `useMessageThread(messageId)` -- returns thread messages for the thread overlay
- `useMessageActions()` -- returns mutation functions: `markAsRead(id)`, `toggleFlag(id)`, `archive(id)`, `sendReply(conversationId, content)` (calls `POST /conversations/{conversationId}/messages`), `convertToMaintenance(conversationId)`

Mock fallback from `mockMessageList` and generated thread messages.

**Verify:** Hooks return filtered messages; thread returns ordered messages; actions update mock state.
**Done:** Messaging hooks with mock fallback.

---

### Task 20.2: Build Messaging Page with 2 Views + Thread Overlay

**Files to create:**
- `src/app/(authenticated)/messaging/page.tsx`
- `src/components/pages/messaging/messaging-kanban-view.tsx`
- `src/components/pages/messaging/messaging-list-view.tsx`
- `src/components/pages/messaging/message-card.tsx`
- `src/components/pages/messaging/message-thread.tsx`

**Action:** Build the Messaging page with view switching.

**Kanban View (default):**
- Uses `<KanbanBoard>` from Phase 17
- 4 columns: Unread, Flagged, Read, Archived
- Message cards show: guest name, listing name (with color dot), channel badge, subject preview, timestamp, message count badge, priority indicator
- Card border-left: colored by channel (Airbnb red, Booking.com blue, VRBO navy, Direct amber)
- Dragging cards between columns changes message status
- Clicking a card: sets `selectedMessage` in Zustand and opens the thread overlay

**List View (split-pane):**
- Left pane (40% width): message list with compact rows
  - Each row: unread indicator (blue dot), guest name, listing, subject preview, timestamp
  - Clicking selects the message (highlights row)
- Right pane (60% width): selected message detail / thread
  - Shows full thread inline (same layout as thread overlay but embedded)
  - Compose area at bottom
- If no message selected: right pane shows empty state "Select a message to view"

**Thread Overlay (from Phase 17.5):**
- Opens when clicking a message card in Kanban view
- Populated with thread data from `useMessageThread(messageId)`
- Triage bar actions: Resolved (marks as read + archives), Follow Up (flags), Priority (sets urgent), Convert to Maintenance (creates maintenance item from message context)
- Compose area: textarea + send button. Sending calls `sendReply()` and adds message to thread

Page reads Zustand: `pages.messaging.view`, `pages.messaging.submenu`, `pages.messaging.channels`, `pages.messaging.selectedMessage`, `pages.messaging.threadMessage`.

Sidebar Channel Filter (Phase 16.3) filters messages by channel. Submenu chips filter by status.

**Verify:** Kanban renders 4 columns with message cards; drag-drop changes status; clicking card opens thread overlay; list view shows split-pane with thread; thread shows bubbles (guest left, host right blue); compose + send works; `npm run build` passes.
**Done:** Messaging page with Kanban, List, and Thread overlay.

---

## Phase 21: Cleaning Page

**Wave:** 3 (depends on Phase 16 shell, Phase 17 Kanban + CalendarGrid + SortableList + Gantt)
**Goal:** Build the Cleaning page with all 4 views plus the shopping list popup.

### Task 21.1: Cleaning Data Hooks

**Files to create:**
- `src/hooks/use-cleaning.ts`

**Action:** Create hooks:
- `useCleaningTasks(timeframe, submenuFilters, selectedListings)` -- returns cleaning tasks filtered by timeframe, status (from submenu chips: pending/in_progress/issues), and selected listings
- `useShoppingList(selectedListings)` -- returns shopping items for selected listings
- `useCleaningActions()` -- returns mutation functions: `updateTaskStatus(id, status)`, `toggleBoughtItem(itemId)`, `assignTask(taskId, assignee)`

Mock fallback from `mockCleaningTaskList` and `mockShoppingItemList`.

**Verify:** Hooks return filtered tasks; shopping list returns items grouped by listing; actions work.
**Done:** Cleaning hooks with mock fallback.

---

### Task 21.2: Build Cleaning Page with 4 Views + Shopping List

**Files to create:**
- `src/app/(authenticated)/cleaning/page.tsx`
- `src/components/pages/cleaning/cleaning-kanban-view.tsx`
- `src/components/pages/cleaning/cleaning-calendar-view.tsx`
- `src/components/pages/cleaning/cleaning-list-view.tsx`
- `src/components/pages/cleaning/cleaning-gantt-view.tsx`
- `src/components/pages/cleaning/cleaning-task-card.tsx`
- `src/components/pages/cleaning/shopping-list-content.tsx`

**Action:** Build the Cleaning page with 4 views controlled by sidebar View Switcher.

**Kanban View (default):**
- Uses `<KanbanBoard>` from Phase 17
- 5 columns: Pending, Confirmed, In Progress, Completed, Issues
- Task cards show: listing name (with color dot), scheduled time, assignee, checklist progress (e.g., "3/8"), type badge, priority indicator
- Card border-left: colored by listing color
- Drag-drop changes task status (calls `updateTaskStatus`)
- Click card -> drill-down panel with full task detail

**Calendar View:**
- Uses `<CalendarGrid>` from Phase 17
- Events are cleaning tasks, colored by status
- Event chip shows: listing name + time + type
- Click event -> drill-down panel

**List View:**
- Uses `<SortableList>` from Phase 17
- Columns: Listing, Type, Scheduled, Assignee, Status, Priority, Checklist, Est. Hours
- Sort controlled by `listSort` in Zustand
- Click row -> drill-down panel

**Gantt View:**
- Uses `<GanttView>` from Phase 17
- Rows = selected listings
- Bars = cleaning tasks, colored by status
- Bar labels: task type + assignee
- Zoom levels: day/week/month (controlled by `ganttZoom` in Zustand)
- Click bar -> drill-down panel

**Shopping List:**
- Opens as popup modal when clicking "Shopping List" button in sidebar (Phase 16.3)
- Uses `<ShoppingListPopup>` from Phase 17.5
- Populated with data from `useShoppingList()` hook
- Items grouped by listing, each with checkbox, name, quantity, priority badge
- Checking items updates `boughtItems` in Zustand via `toggleBoughtItem()`
- "Copy List" button copies text summary to clipboard
- "Share Link" button is a placeholder

Page reads Zustand: `pages.cleaning.view`, `pages.cleaning.timeframe`, `pages.cleaning.submenu`, `pages.cleaning.listSort`, `pages.cleaning.ganttZoom`, `pages.cleaning.shoppingDrawerOpen`, `pages.cleaning.boughtItems`, `selectedListings`.

**Verify:** All 4 views render with mock cleaning tasks; Kanban drag-drop changes status; calendar shows task events; list sorts correctly; Gantt bars span correct times; shopping list popup opens from sidebar, items checkable, copy works; `npm run build` passes.
**Done:** Cleaning page with Kanban, Calendar, List, Gantt, and Shopping List.

---

## Phase 22: Reporting Page

**Wave:** 3 (depends on Phase 16 shell, Phase 17 charts + drill-down panel)
**Goal:** Build the Reporting page with KPI summary cards, 5 chart types, and saved reports.

### Task 22.1: Reporting Data Hooks

**Files to create:**
- `src/hooks/use-reporting.ts`

**Action:** Create hooks:
- `useReportingKPIs(timeframe, selectedListings)` -- returns summary KPI data (total revenue, avg occupancy, total bookings, avg nightly rate, total expenses, net profit)
- `useReportingChartData(chartType, timeframe, selectedListings)` -- returns chart data for the selected chart type (revenue_trend, channel_breakdown, occupancy, expenses, revenue_by_listing)
- `useSavedReports()` -- returns saved report presets from Zustand + load/save/delete actions

Mock fallback from `mockFinancialList`.

**Verify:** Hooks return correctly shaped data for each chart type; KPIs aggregate correctly from mock financial data.
**Done:** Reporting hooks with mock fallback.

---

### Task 22.2: Build Reporting Page

**Files to create:**
- `src/app/(authenticated)/reporting/page.tsx`
- `src/components/pages/reporting/reporting-kpi-row.tsx`
- `src/components/pages/reporting/reporting-chart-grid.tsx`
- `src/components/pages/reporting/saved-reports-drawer.tsx`

**Action:** Build the Reporting page. This is a single layout (not multi-view), but content changes based on submenu chips.

**KPI Summary Row (top):**
- 6 KPI cards in a row (same style as Dashboard KPIs)
- Total Revenue, Avg Occupancy, Total Bookings, Avg Nightly Rate, Total Expenses, Net Profit
- Clicking a KPI card opens drill-down panel with detailed breakdown by listing

**Chart Grid (main content):**
- Submenu chips control which charts are shown:
  - "Overview" (default): shows a 2x2 grid with revenue trend (top-left), channel breakdown (top-right), occupancy (bottom-left), expenses (bottom-right)
  - "Revenue" (exclusive): full-width revenue trend chart + revenue by listing chart below
  - "Occupancy" (exclusive): full-width occupancy by listing chart
  - "Expenses" (exclusive): full-width expense breakdown pie + expense by listing bar chart below
  - "Channels" (exclusive): full-width channel breakdown chart
- Uses chart components from Phase 17.6
- Each chart has a header with title + "Export" button (placeholder)

**Saved Reports (sidebar drawer, Phase 16.3):**
- List of saved report presets in sidebar
- Each preset: name, timeframe, active filters
- Clicking "Load" applies the preset's timeframe and filters
- "Save Current" button saves current view state as a new preset (name via inline input)
- Presets stored in Zustand `pages.reporting.savedReports`

Page reads Zustand: `pages.reporting.timeframe`, `pages.reporting.submenu`, `pages.reporting.savedReportsOpen`, `pages.reporting.activeSavedReport`, `selectedListings`.

**Verify:** KPI row shows 6 cards; overview shows 2x2 chart grid; exclusive chips show full-width charts; saved reports drawer opens from sidebar; load/save presets work; drill-down opens on KPI click; `npm run build` passes.
**Done:** Reporting page with KPIs, conditional chart grid, and saved reports.

---

## Phase 23: Settings Page

**Wave:** 3 (depends on Phase 16 shell only -- no view components needed)
**Goal:** Build the Settings page as a two-column layout with left navigation and content pane.

### Task 23.1: Build Settings Page

**Files to create:**
- `src/app/(authenticated)/settings/page.tsx` (overwrite existing)
- `src/components/pages/settings/settings-layout.tsx`
- `src/components/pages/settings/settings-nav.tsx`
- `src/components/pages/settings/sections/general-section.tsx`
- `src/components/pages/settings/sections/team-section.tsx`
- `src/components/pages/settings/sections/billing-section.tsx`
- `src/components/pages/settings/sections/notifications-section.tsx`
- `src/components/pages/settings/sections/integrations-section.tsx`
- `src/components/pages/settings/sections/cleaning-section.tsx`
- `src/components/pages/settings/sections/channels-section.tsx`

**Action:** Build the Settings page. Note: Settings does NOT use the contextual sidebar (sidebar hidden), submenu bar is empty/hidden, and the page has its own internal two-column layout.

**Settings Layout:**
- Two-column: left nav (200px) + content pane (flex-1)
- Left nav: vertical list of section links (General, Team, Billing, Notifications, Integrations, Cleaning, Channels)
- Active section has colored left border + bold text (same pattern as sidebar View Switcher)
- Content pane: scrollable, shows the active section component
- Section controlled by `pages.settings.section` in Zustand

**General Section:**
- Company name input
- Default timezone select
- Default currency select
- Save button

**Team Section:**
- Team member list (table: name, email, role badge, last login, status)
- "Invite Member" button (opens dialog with email + role select)
- Role editing (dropdown on each member row)

**Billing Section:**
- Current plan display
- Usage summary
- "Manage Subscription" button (placeholder -- Stripe portal)
- Payment method display (masked card)

**Notifications Section:**
- Toggle switches for: Email on new booking, Email on conflict, Email on cleaning due, Email on sync error
- Save button

**Integrations Section:**
- List of platform connections (Airbnb, Booking.com, VRBO)
- Each: platform logo, connection status badge, last sync time, listing count, Connect/Disconnect button
- iCal URL input for manual calendar feeds

**Cleaning Section:**
- Default cleaning duration input
- Auto-assign toggle
- Default cleaner name + email inputs
- Checklist template management (placeholder list)

**Channels Section:**
- Channel-specific settings per connected platform
- Sync frequency controls
- Default pricing rules (placeholder)

All sections use mock data when `USE_MOCK` is true. Forms show pre-filled mock values and toast on "save" (no actual API call in mock mode).

**Verify:** Settings page shows two-column layout; left nav switches sections; all 7 sections render with appropriate form fields; sidebar is hidden on Settings page; `npm run build` passes.
**Done:** Settings page with all 7 sections.

---

## Phase 24: Route Migration, API Wiring, Cross-Cutting Polish

**Wave:** 4 (depends on all page phases 18-23)
**Goal:** Clean up old routes, wire pages to real API endpoints, add cross-cutting behaviors (keyboard shortcuts, responsive polish, error boundaries), and verify the complete application.

### Task 24.1: Route Migration and Old Code Cleanup

**Files to modify:**
- `src/app/(authenticated)/layout.tsx` -- ensure new shell is wired (should already be from Phase 16.4)
- `src/lib/navigation.ts` -- remove old `navItems` export, keep only `topNavItems` + `settingsNavItem`
- `src/middleware.ts` -- update route matchers for new page routes; preserve existing public page bypass for `/privacy` and `/terms`

**Files to delete (or mark deprecated):**
- `src/components/layout/sidebar.tsx` (old sidebar navigation)
- `src/components/layout/top-nav.tsx` (old top nav)
- `src/components/layout/app-shell.tsx` (old app shell)
- Old page stubs that don't match mockup: `src/app/(authenticated)/automations/` (entire directory), `src/app/(authenticated)/properties/page.tsx`, `src/app/(authenticated)/listings/page.tsx`, `src/app/(authenticated)/bookings/page.tsx`, `src/app/(authenticated)/onboarding/page.tsx`

**Files to create:**
- Redirect routes if needed (e.g., `/bookings` -> `/calendar`, `/properties` -> `/dashboard`)

**Action:** 
1. Remove old layout components and the old sidebar-based navigation
2. Remove or redirect old routes that don't exist in the mockup
3. Update middleware to protect new routes: `/dashboard`, `/calendar`, `/messaging`, `/cleaning`, `/reporting`, `/settings`. Preserve the existing `isPublicPage` bypass so `/privacy` and `/terms` remain accessible without authentication (already implemented in `src/middleware.ts`).
4. Ensure the root authenticated route `/` redirects to `/dashboard`
5. Update any remaining imports that reference old layout components

**Route table (middleware):**
- Auth API routes (`/api/auth/*`): bypass — handled by Auth.js
- Public pages (`/privacy`, `/terms`): bypass — unauthenticated access allowed
- Login (`/login`): accessible unauthenticated; authenticated users redirected to `/dashboard`
- App pages (`/dashboard`, `/calendar`, `/messaging`, `/cleaning`, `/reporting`, `/settings`): require authentication
- Root (`/`): redirects to `/dashboard`

**Verify:** All old routes either redirect or 404 cleanly; no broken imports; `npm run build` passes with zero errors; `npm run lint` passes.
**Done:** Clean route structure matching mockup's 6 pages.

---

### Task 24.2: API Wiring Layer

**Files to create:**
- `src/lib/api-hooks/dashboard-api.ts`
- `src/lib/api-hooks/calendar-api.ts`
- `src/lib/api-hooks/messaging-api.ts`
- `src/lib/api-hooks/cleaning-api.ts`
- `src/lib/api-hooks/reporting-api.ts`
- `src/lib/api-hooks/settings-api.ts`
- `src/lib/api-hooks/listings-api.ts`
- `src/lib/api-hooks/maintenance-api.ts`

**Action:** Create the real API integration layer that sits alongside the mock hooks. Each file exports the same hook interface as the mock hooks but calls real API endpoints.

The mock/real switching is handled at the hook level:
```typescript
// src/hooks/use-dashboard.ts (updated)
import { USE_MOCK } from "@/lib/mock-data";
import { useDashboardKPIsMock } from "@/lib/mock-data/dashboard-hooks";
import { useDashboardKPIsAPI } from "@/lib/api-hooks/dashboard-api";

export function useDashboardKPIs(timeframe: string, selectedListings: string[]) {
  if (USE_MOCK) return useDashboardKPIsMock(timeframe, selectedListings);
  return useDashboardKPIsAPI(timeframe, selectedListings);
}
```

**Auth contract:** The client session exposes `accessToken`, `tenantId`, `userId`, `role` — but NOT `refreshToken`. The refresh token is server-side only (stored in the Auth.js JWT, never sent to the browser session). All API hooks should obtain the access token via `session.accessToken` for `Authorization: Bearer` headers. Token refresh is handled automatically by the Auth.js JWT callback in `src/lib/auth.ts` — API hooks do not need to manage refresh logic.

API endpoints to wire per hook file (using existing `apiClient` from `src/lib/api-client.ts`):

**dashboard-api.ts:**
- `GET /dashboard/kpis?listing_ids[]=&start_date=&end_date=`
- `GET /dashboard/alerts`
- `GET /dashboard/compare?listing_ids[]=&start_date=&end_date=`
- `GET /dashboard/preview?listing_ids[]=`

**calendar-api.ts:**
- `GET /calendar/events?listing_ids[]=&start_date=&end_date=&types[]=`

**messaging-api.ts:**
- `GET /conversations?status=&channel=&listing_id=&priority=`
- `GET /conversations/{id}`
- `POST /conversations`
- `PATCH /conversations/{id}/status`
- `PATCH /conversations/{id}/priority`
- `GET /conversations/{id}/messages?page=&page_size=`
- `POST /conversations/{id}/messages`
- `POST /conversations/{id}/convert-to-maintenance`

**cleaning-api.ts:**
- `GET /cleaning-tasks?property_id=&listing_id=&task_type=&priority=&status=&date_from=&date_to=`
- `POST /cleaning-tasks`
- `PATCH /cleaning-tasks/{id}`
- `GET /cleaning-tasks/shopping-list?property_id=&listing_id=&status=`
- `POST /cleaning-tasks/shopping-list`
- `PUT /cleaning-tasks/shopping-list/{id}`
- `DELETE /cleaning-tasks/shopping-list/{id}`

**reporting-api.ts:**
- `GET /reporting/financials?listing_ids[]=&start_date=&end_date=`
- `GET /reporting/occupancy?listing_ids[]=&start_date=&end_date=`
- `GET /reporting/revenue-breakdown?listing_ids[]=&start_date=&end_date=`
- `GET /reporting/expense-breakdown?listing_ids[]=&start_date=&end_date=`
- `GET /saved-reports`
- `POST /saved-reports`
- `PUT /saved-reports/{id}`
- `DELETE /saved-reports/{id}`

**settings-api.ts:**
- `GET /settings/{section}`
- `PUT /settings/{section}`

**listings-api.ts:**
- `GET /listings?property_id=&listing_type=&page=&page_size=`
- `GET /listings/hierarchy`
- `POST /listing-groups`
- `GET /listing-groups`
- `PUT /listing-groups/{id}`
- `DELETE /listing-groups/{id}`

**maintenance-api.ts:**
- `GET /maintenance?property_id=&listing_id=&status=&priority=&date_from=&date_to=`
- `POST /maintenance`
- `PUT /maintenance/{id}`
- `DELETE /maintenance/{id}`
- `GET /vacancy?listing_ids[]=&start_date=&end_date=&min_gap_days=`

For endpoints that don't exist yet in the backend, the API hook should gracefully fall back to mock data with a console.warn. This ensures the frontend works standalone.

**Verify:** With `NEXT_PUBLIC_USE_MOCK_DATA=false`, hooks attempt real API calls; with `=true`, mock data is used; no crashes in either mode; `npm run build` passes.
**Done:** API wiring layer with graceful mock fallback.

---

### Task 24.3: Cross-Cutting Polish and Error Boundaries

**Files to create:**
- `src/components/shell/error-boundary.tsx`
- `src/components/shell/page-loading.tsx`

**Files to modify:**
- `src/app/(authenticated)/layout.tsx` -- wrap with error boundary

**Action:**
1. **Error Boundary:** React error boundary component that catches render errors and shows a friendly error state with "Reload" button. Wraps the canvas area.

2. **Page Loading:** Skeleton loading component that matches the app shell layout (shows skeleton top nav + submenu + sidebar outline + content placeholders). Used as Suspense fallback.

3. **Keyboard Shortcuts:**
   - `Escape` closes any open overlay (drill-down, thread, popup)
   - `[` / `]` collapse/expand sidebar
   - `1-5` number keys switch pages (when no input is focused)
   - `?` opens keyboard shortcut help (small modal listing all shortcuts)

4. **Responsive Behavior:**
   - < 1024px: sidebar becomes floating overlay (already in Phase 16.3)
   - < 768px: Gantt/Calendar views auto-switch to list view with a banner "Switch to desktop for Gantt/Calendar view"
   - Submenu bar scrolls horizontally on small screens
   - KPI grids reflow to single column

5. **Accessibility:**
   - All interactive elements have focus styles (ring)
   - Overlay panels trap focus when open
   - Screen reader announcements for view changes, toast notifications
   - `role="main"` on canvas, `role="navigation"` on top nav, `role="complementary"` on sidebar

**Verify:** Error boundary catches and displays errors gracefully; keyboard shortcuts work; responsive layouts reflow correctly; `npm run build` passes; `npm run lint` passes.
**Done:** Cross-cutting polish applied across the application.

---

### Task 24.4: Integration Tests

**Files to create:**
- `src/__tests__/integration/navigation.test.tsx`
- `src/__tests__/integration/view-switching.test.tsx`
- `src/__tests__/integration/submenu-chips.test.tsx`

**Action:** Integration tests covering cross-component behavior:
- **Navigation:** Clicking top nav buttons changes page content and updates Zustand state; sidebar sections change per page; submenu chips change per page
- **View switching:** Sidebar view switcher changes the active view component for Calendar, Messaging, Cleaning pages
- **Submenu chips:** Chip interactions follow behavior rules (single-default resets, toggle flips, multi additive, exclusive replaces); chip state persists within a page session

Use Testing Library + Vitest. Mock the Zustand store with initial state. Render the AppShell with children.

**Verify:** `npm run test -- --filter=integration` passes.
**Done:** Integration tests for navigation, view switching, and submenu chips.

---

## Decision Coverage Matrix

| Decision | Phase | Task | Coverage |
|----------|-------|------|----------|
| D-01: Mock data factories with NEXT_PUBLIC_USE_MOCK_DATA toggle | 14 | 14.2 | Full |
| D-02: Recharts for charting | 17 | 17.6 | Full |
| D-03: Custom CSS grid Gantt (no library) | 17 | 17.1 | Full |
| D-04: dnd-kit for drag-and-drop | 17 | 17.2 | Full |
| D-05: Zustand one store with slices | 15 | 15.1 | Full |

## Mockup Coverage Matrix

| Mockup Element | Phase | Task(s) | Coverage |
|----------------|-------|---------|----------|
| Top Nav (56px, blue, 5 pages + settings) | 16 | 16.1 | Full |
| Submenu Bar (44px, chips, 5 behaviors) | 16 | 16.2 | Full |
| Contextual Sidebar (260px, per-page sections) | 16 | 16.3 | Full |
| Listing Filter Tree (parent/child/custom groups) | 16 | 16.3 | Full |
| View Switcher (per page) | 16 | 16.3 | Full |
| Timeframe Selector + Popup | 16, 17 | 16.3, 17.5 | Full |
| Channel Filter (Messaging) | 16 | 16.3 | Full |
| Shopping List button (Cleaning) | 16 | 16.3 | Full |
| Saved Reports (Reporting) | 22 | 22.2 | Full |
| Actions (Share/Configure/Automations) | 16 | 16.3 | Full |
| Drill-Down Panel (420px, slide right) | 17 | 17.5 | Full |
| Thread Overlay (520px, slide right + scrim) | 17 | 17.5 | Full |
| Share Popup (modal, field toggles) | 17 | 17.5 | Full |
| Shopping List Popup (modal, checkboxes) | 17 | 17.5 | Full |
| Timeframe Popup (positioned, calendar pickers) | 17 | 17.5 | Full |
| Toast Notifications (bottom-right) | 17 | 17.5 | Full |
| Gantt View (CSS grid, today line, bars) | 17 | 17.1 | Full |
| Kanban Board (dnd-kit, columns, cards) | 17 | 17.2 | Full |
| Calendar Grid (month/week/day/fortnight) | 17 | 17.3 | Full |
| Sortable List | 17 | 17.4 | Full |
| 5 Chart Types (Recharts) | 17 | 17.6 | Full |
| Dashboard: KPI grid | 18 | 18.2 | Full |
| Dashboard: Alert strip | 18 | 18.2 | Full |
| Dashboard: Compare mode | 18 | 18.2 | Full |
| Dashboard: Preview grid | 18 | 18.2 | Full |
| Calendar: Gantt view | 19 | 19.2 | Full |
| Calendar: Calendar view (4 modes) | 19 | 19.2 | Full |
| Calendar: List view | 19 | 19.2 | Full |
| Messaging: Kanban view (4 columns) | 20 | 20.2 | Full |
| Messaging: List view (split-pane) | 20 | 20.2 | Full |
| Messaging: Thread overlay | 20 | 20.2 | Full |
| Cleaning: Kanban view (5 columns) | 21 | 21.2 | Full |
| Cleaning: Calendar view | 21 | 21.2 | Full |
| Cleaning: List view | 21 | 21.2 | Full |
| Cleaning: Gantt view | 21 | 21.2 | Full |
| Cleaning: Shopping list popup | 21 | 21.2 | Full |
| Reporting: KPI summary cards | 22 | 22.2 | Full |
| Reporting: 5 charts (conditional rendering) | 22 | 22.2 | Full |
| Reporting: Saved reports | 22 | 22.2 | Full |
| Settings: Two-column layout | 23 | 23.1 | Full |
| Settings: 7 sections | 23 | 23.1 | Full |
| 8 Data Models typed | 14 | 14.1 | Full |
| Full State Machine (Zustand) | 15 | 15.1 | Full |
| Design Tokens (colors, fonts, spacing, shadows) | 13 | 13.2 | Full |

## NOT Building (explicitly excluded -- not in mockup)

- Guests page (standalone)
- Maintenance page (standalone)
- Integrations page (standalone)
- Property Detail page
- Booking Detail page
- Automations page (standalone)
- Properties page (standalone CRUD)
- Listings page (standalone CRUD)
- Bookings page (standalone CRUD)
- Onboarding page

## Known Deviations to Resolve During Implementation

The following items deviate slightly from the HTML mockup spec. They should be corrected during implementation of the relevant phase:

### Warning-Level Issues

1. **Settings nav structure (Phase 23):** The mockup specifies two nav groups — Product (Dashboard, Calendar, Messaging, Cleaning, Reporting configs) and Account (Profile, Team, Integrations, Billing) — with a "Back to {previousPage}" button. The current plan has a flat 7-section list. During implementation, restructure the left-nav into Product/Account groups matching the mockup, add a Profile section, and implement the back button using `previousPage` from Zustand.

2. **Reporting chart types (Phase 22):** The mockup specifies 5 exact charts: (a) Revenue vs Expenses grouped bar chart, (b) Occupancy by Listing horizontal bar, (c) Expense Breakdown stacked horizontal bar, (d) Revenue by Listing horizontal bar, (e) Bookings Summary. During implementation, replace: (a) AreaChart with grouped BarChart showing revenue + expenses side-by-side, (c) PieChart with stacked horizontal BarChart for expenses, (e) add a Bookings Summary chart. Remove the "channel breakdown" chart (it belongs on Dashboard preview, not Reporting).

3. **Dashboard preview grid (Phase 18):** The mockup specifies 4 blocks: Revenue Trend bar chart, Upcoming Bookings table, Cleaning Status table, Channel Breakdown horizontal bar chart. During implementation, match these 4 exactly instead of substituting mini-calendar or task-summary blocks.

4. **Calendar child-blocking (Phase 19):** The mockup implements child-blocking logic where a parent listing booking auto-blocks child listings. This must be implemented in the calendar event normalization (Phase 19, Task 19.1) — when a parent listing has a booking, generate synthetic "blocked" events for all child listings for the same date range.

5. **Saved reports localStorage (Phase 22):** The mockup persists saved reports to localStorage. Add `persist` middleware to the Zustand reporting slice or manually sync `savedReports` to/from localStorage on load/save.

6. **Calendar "Cleaning" events (Phase 19):** The Calendar page should include cleaning tasks as calendar events (controlled by the "Cleaning" submenu chip). The `useCalendarEvents` hook should merge cleaning tasks alongside bookings, vacancy, and maintenance.

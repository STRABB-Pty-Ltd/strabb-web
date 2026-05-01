import { describe, expect, it } from "vitest";

import {
  createBooking,
  createCleaningTask,
  createFinancial,
  createListing,
  createMessage,
  createShoppingItem,
  createTicket,
  createVacancy,
  mockBookingList,
  mockCleaningTaskList,
  mockFinancialList,
  mockListingList,
  mockMessageList,
  mockShoppingItemList,
  mockTicketsList,
  mockVacancyList,
} from "../index";

describe("Listing factory", () => {
  it("returns an object with all required fields", () => {
    const listing = createListing();
    expect(listing.id).toBeDefined();
    expect(listing.name).toBeDefined();
    expect(listing.relationship).toBeDefined();
    expect(listing.color).toBeDefined();
    expect(typeof listing.bedrooms).toBe("number");
    expect(typeof listing.bathrooms).toBe("number");
    expect(typeof listing.maxGuests).toBe("number");
    expect(typeof listing.nightlyRate).toBe("number");
    expect(listing.location).toBeDefined();
    expect(listing.propertyId).toBeDefined();
    expect(typeof listing.isActive).toBe("boolean");
  });

  it("merges overrides correctly", () => {
    const listing = createListing({ name: "Test Listing", bedrooms: 5 });
    expect(listing.name).toBe("Test Listing");
    expect(listing.bedrooms).toBe(5);
    expect(listing.id).toBe("lst-001"); // default preserved
  });

  it("mockListingList has at least 5 entries", () => {
    expect(mockListingList.length).toBeGreaterThanOrEqual(5);
  });

  it("contains at least one parent, one child, and one standalone", () => {
    const relationships = mockListingList.map((l) => l.relationship);
    expect(relationships).toContain("parent");
    expect(relationships).toContain("child");
    expect(relationships).toContain("standalone");
  });
});

describe("Booking factory", () => {
  it("returns an object with all required fields", () => {
    const booking = createBooking();
    expect(booking.id).toBeDefined();
    expect(booking.listingId).toBeDefined();
    expect(booking.guestName).toBeDefined();
    expect(booking.channel).toBeDefined();
    expect(booking.checkIn).toBeDefined();
    expect(booking.checkOut).toBeDefined();
    expect(typeof booking.nightlyRate).toBe("number");
    expect(typeof booking.totalAmount).toBe("number");
    expect(booking.status).toBeDefined();
    expect(booking.createdAt).toBeDefined();
  });

  it("merges overrides correctly", () => {
    const booking = createBooking({ guestName: "Override Guest", guestCount: 10 });
    expect(booking.guestName).toBe("Override Guest");
    expect(booking.guestCount).toBe(10);
    expect(booking.id).toBe("bk-001");
  });

  it("mockBookingList has at least 5 entries", () => {
    expect(mockBookingList.length).toBeGreaterThanOrEqual(5);
  });

  it("covers all 5 booking statuses", () => {
    const statuses = new Set(mockBookingList.map((b) => b.status));
    expect(statuses).toContain("checked_out");
    expect(statuses).toContain("checked_in");
    expect(statuses).toContain("confirmed");
    expect(statuses).toContain("pending");
    expect(statuses).toContain("cancelled");
  });
});

describe("Message factory", () => {
  it("returns an object with all required fields", () => {
    const message = createMessage();
    expect(message.id).toBeDefined();
    expect(message.bookingId).toBeDefined();
    expect(message.listingId).toBeDefined();
    expect(message.guestName).toBeDefined();
    expect(message.channel).toBeDefined();
    expect(message.status).toBeDefined();
    expect(message.priority).toBeDefined();
    expect(message.subject).toBeDefined();
    expect(message.lastMessageTime).toBeDefined();
    expect(typeof message.messageCount).toBe("number");
    expect(typeof message.isGuest).toBe("boolean");
    expect(message.previewText).toBeDefined();
  });

  it("merges overrides correctly", () => {
    const message = createMessage({ subject: "Test Subject", priority: "low" });
    expect(message.subject).toBe("Test Subject");
    expect(message.priority).toBe("low");
    expect(message.id).toBe("msg-001");
  });

  it("mockMessageList has at least 5 entries", () => {
    expect(mockMessageList.length).toBeGreaterThanOrEqual(5);
  });

  it("covers all 4 message statuses", () => {
    const statuses = new Set(mockMessageList.map((m) => m.status));
    expect(statuses).toContain("unread");
    expect(statuses).toContain("flagged");
    expect(statuses).toContain("read");
    expect(statuses).toContain("archived");
  });
});

describe("CleaningTask factory", () => {
  it("returns an object with all required fields", () => {
    const task = createCleaningTask();
    expect(task.id).toBeDefined();
    expect(task.listingId).toBeDefined();
    expect(task.listingName).toBeDefined();
    expect(task.listingColor).toBeDefined();
    expect(task.scheduledTime).toBeDefined();
    expect(typeof task.checklistTotal).toBe("number");
    expect(typeof task.checklistDone).toBe("number");
    expect(task.priority).toBeDefined();
    expect(task.status).toBeDefined();
    expect(task.type).toBeDefined();
    expect(typeof task.estimatedHours).toBe("number");
  });

  it("merges overrides correctly", () => {
    const task = createCleaningTask({ status: "completed", checklistDone: 12 });
    expect(task.status).toBe("completed");
    expect(task.checklistDone).toBe(12);
    expect(task.id).toBe("ct-001");
  });

  it("mockCleaningTaskList has at least 5 entries", () => {
    expect(mockCleaningTaskList.length).toBeGreaterThanOrEqual(5);
  });

  it("covers all 5 cleaning statuses", () => {
    const statuses = new Set(mockCleaningTaskList.map((t) => t.status));
    expect(statuses).toContain("pending");
    expect(statuses).toContain("confirmed");
    expect(statuses).toContain("in_progress");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("cancelled");
  });
});

describe("Financial factory", () => {
  it("returns an object with all required fields", () => {
    const financial = createFinancial();
    expect(financial.id).toBeDefined();
    expect(financial.month).toBeDefined();
    expect(financial.listingId).toBeDefined();
    expect(typeof financial.revenue).toBe("number");
    expect(typeof financial.cleaningCost).toBe("number");
    expect(typeof financial.ticketCost).toBe("number");
    expect(typeof financial.suppliesCost).toBe("number");
    expect(typeof financial.platformFees).toBe("number");
    expect(typeof financial.occupancyRate).toBe("number");
    expect(typeof financial.avgNightlyRate).toBe("number");
    expect(typeof financial.bookingCount).toBe("number");
  });

  it("merges overrides correctly", () => {
    const financial = createFinancial({ revenue: 9999, month: "2026-01" });
    expect(financial.revenue).toBe(9999);
    expect(financial.month).toBe("2026-01");
    expect(financial.id).toBe("fin-001");
  });

  it("mockFinancialList has at least 5 entries", () => {
    expect(mockFinancialList.length).toBeGreaterThanOrEqual(5);
  });
});

describe("ShoppingItem factory", () => {
  it("returns an object with all required fields", () => {
    const item = createShoppingItem();
    expect(item.id).toBeDefined();
    expect(item.listingId).toBeDefined();
    expect(item.item).toBeDefined();
    expect(typeof item.quantity).toBe("number");
    expect(item.status).toBeDefined();
    expect(item.requestedDate).toBeDefined();
    expect(item.priority).toBeDefined();
  });

  it("merges overrides correctly", () => {
    const item = createShoppingItem({ item: "Test Item", quantity: 99 });
    expect(item.item).toBe("Test Item");
    expect(item.quantity).toBe(99);
    expect(item.id).toBe("si-001");
  });

  it("mockShoppingItemList has at least 5 entries", () => {
    expect(mockShoppingItemList.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Vacancy factory", () => {
  it("returns an object with all required fields", () => {
    const vacancy = createVacancy();
    expect(vacancy.id).toBeDefined();
    expect(vacancy.listingId).toBeDefined();
    expect(vacancy.startDate).toBeDefined();
    expect(vacancy.endDate).toBeDefined();
    expect(typeof vacancy.gapDays).toBe("number");
  });

  it("merges overrides correctly", () => {
    const vacancy = createVacancy({ gapDays: 15, listingName: "Test" });
    expect(vacancy.gapDays).toBe(15);
    expect(vacancy.listingName).toBe("Test");
    expect(vacancy.id).toBe("vac-001");
  });

  it("mockVacancyList has at least 5 entries", () => {
    expect(mockVacancyList.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Ticket factory", () => {
  it("returns an object with all required fields", () => {
    const ticket = createTicket();
    expect(ticket.id).toBeDefined();
    expect(ticket.listingId).toBeDefined();
    expect(ticket.description).toBeDefined();
    expect(ticket.priority).toBeDefined();
    expect(ticket.status).toBeDefined();
    expect(ticket.dateReported).toBeDefined();
  });

  it("merges overrides correctly", () => {
    const ticket = createTicket({
      description: "Test issue",
      priority: "low",
    });
    expect(ticket.description).toBe("Test issue");
    expect(ticket.priority).toBe("low");
    expect(ticket.id).toBe("tkt-001");
  });

  it("mockTicketsList has at least 5 entries", () => {
    expect(mockTicketsList.length).toBeGreaterThanOrEqual(5);
  });
});

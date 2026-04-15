import type { Message } from "@/types/message";
import { REFERENCE_NOW } from "./reference-date";

const hours = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCHours(d.getUTCHours() + offset);
  return d.toISOString();
};
const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const defaults: Message = {
  id: "msg-001",
  bookingId: "bk-001",
  listingId: "lst-002",
  listingName: "Bondi Beach Apartment — Unit A",
  guestName: "Sarah Mitchell",
  channel: "airbnb",
  status: "unread",
  priority: "high",
  subject: "Early check-in request",
  lastMessageTime: hours(-1),
  messageCount: 3,
  isGuest: true,
  previewText: "Hi, would it be possible to check in at 12pm instead of 2pm?",
  checkIn: day(-3),
  checkOut: day(2),
};

export function createMessage(overrides?: Partial<Message>): Message {
  return { ...defaults, ...overrides };
}

export const mockMessageList: Message[] = [
  // unread — high priority
  createMessage(),
  // unread — medium priority
  createMessage({
    id: "msg-002",
    bookingId: "bk-002",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    guestName: "James O'Brien",
    channel: "booking_com",
    status: "unread",
    priority: "medium",
    subject: "WiFi password",
    lastMessageTime: hours(-3),
    messageCount: 1,
    isGuest: true,
    previewText: "Could you please send me the WiFi password? I can't find it in the listing.",
    checkIn: day(-2),
    checkOut: day(4),
  }),
  // unread — low priority
  createMessage({
    id: "msg-003",
    bookingId: "bk-003",
    listingId: "lst-003",
    listingName: "Bondi Beach Apartment — Unit B",
    guestName: "Emma Chen",
    channel: "airbnb",
    status: "unread",
    priority: "low",
    subject: "Parking availability",
    lastMessageTime: hours(-5),
    messageCount: 2,
    isGuest: true,
    previewText: "Is there parking available at the property? We'll be driving from Melbourne.",
    checkIn: day(5),
    checkOut: day(10),
  }),
  // flagged — high priority
  createMessage({
    id: "msg-004",
    bookingId: "bk-005",
    listingId: "lst-005",
    listingName: "Coogee Bay Studio",
    guestName: "Olivia Kim",
    channel: "booking_com",
    status: "flagged",
    priority: "high",
    subject: "Accessibility needs",
    lastMessageTime: hours(-8),
    messageCount: 4,
    isGuest: true,
    previewText: "I need to confirm the property has step-free access for my wheelchair.",
    checkIn: day(10),
    checkOut: day(14),
  }),
  // flagged — medium priority
  createMessage({
    id: "msg-005",
    bookingId: "bk-004",
    listingId: "lst-006",
    listingName: "Newtown Terrace",
    guestName: "Liam Watson",
    channel: "vrbo",
    status: "flagged",
    priority: "medium",
    subject: "Late checkout request",
    lastMessageTime: hours(-12),
    messageCount: 2,
    isGuest: true,
    previewText: "Would it be possible to check out at 1pm? Our flight isn't until 5pm.",
    checkIn: day(7),
    checkOut: day(12),
  }),
  // read — low priority
  createMessage({
    id: "msg-006",
    bookingId: "bk-006",
    listingId: "lst-007",
    listingName: "Surry Hills Loft",
    guestName: "Noah Taylor",
    channel: "direct",
    status: "read",
    priority: "low",
    subject: "Booking confirmation",
    lastMessageTime: hours(-24),
    messageCount: 2,
    isGuest: false,
    previewText: "Thanks for confirming! Looking forward to our stay.",
    checkIn: day(14),
    checkOut: day(18),
  }),
  // read — medium priority
  createMessage({
    id: "msg-007",
    bookingId: "bk-010",
    listingId: "lst-007",
    listingName: "Surry Hills Loft",
    guestName: "William Hughes",
    channel: "vrbo",
    status: "read",
    priority: "medium",
    subject: "Transport options",
    lastMessageTime: hours(-36),
    messageCount: 3,
    isGuest: false,
    previewText: "The closest station is Central, about a 10 minute walk.",
    checkIn: day(3),
    checkOut: day(6),
  }),
  // archived — low priority
  createMessage({
    id: "msg-008",
    bookingId: "bk-007",
    listingId: "lst-005",
    listingName: "Coogee Bay Studio",
    guestName: "Mia Rodriguez",
    channel: "airbnb",
    status: "archived",
    priority: "low",
    subject: "Thank you!",
    lastMessageTime: hours(-72),
    messageCount: 5,
    isGuest: true,
    previewText: "We had a wonderful stay, thank you for everything!",
    checkIn: day(-10),
    checkOut: day(-5),
  }),
  // archived — medium priority
  createMessage({
    id: "msg-009",
    bookingId: "bk-008",
    listingId: "lst-006",
    listingName: "Newtown Terrace",
    guestName: "Daniel Park",
    channel: "booking_com",
    status: "archived",
    priority: "medium",
    subject: "Review reminder",
    lastMessageTime: hours(-96),
    messageCount: 1,
    isGuest: false,
    previewText: "Hope you enjoyed your stay! We'd appreciate a review.",
    checkIn: day(-8),
    checkOut: day(-3),
  }),
  // unread — medium priority
  createMessage({
    id: "msg-010",
    bookingId: "bk-011",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    guestName: "Isabella Brown",
    channel: "airbnb",
    status: "unread",
    priority: "medium",
    subject: "Beach towels",
    lastMessageTime: hours(-2),
    messageCount: 1,
    isGuest: true,
    previewText: "Do you provide beach towels or should we bring our own?",
    checkIn: day(12),
    checkOut: day(17),
  }),
];

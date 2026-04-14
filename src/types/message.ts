import type { BookingChannel } from "./booking";

export type MessagePriority = "high" | "medium" | "low";

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
  lastMessageTime: string;
  messageCount: number;
  isGuest: boolean;
  previewText: string;
  checkIn: string;
  checkOut: string;
}

export interface ThreadMessage {
  id: string;
  messageId: string;
  content: string;
  sentAt: string;
  isGuest: boolean;
  senderName: string;
}

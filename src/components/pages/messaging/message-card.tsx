"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

import type { Message } from "@/types/message";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "VRBO",
  direct: "Direct",
};

const priorityDot: Record<string, string> = {
  high: "#DC2626",
  medium: "#D97706",
  low: "#9CA3AF",
};

interface MessageCardProps {
  message: Message;
  onClick: () => void;
}

export function MessageCard({ message, onClick }: MessageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            {message.guestName}
          </span>
          {message.priority !== "low" && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: priorityDot[message.priority] }}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: channelColors[message.channel] ?? "#6B7280",
            }}
          />
          <span className="truncate text-xs text-gray-500">
            {message.listingName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{
              backgroundColor: channelColors[message.channel] ?? "#6B7280",
            }}
          >
            {channelLabels[message.channel] ?? message.channel}
          </span>
          <span className="truncate text-xs text-gray-600">
            {message.subject}
          </span>
        </div>

        <p className="truncate text-xs text-gray-400">{message.previewText}</p>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>
            {format(new Date(message.lastMessageTime), "d MMM, HH:mm")}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageSquare size={10} />
            {message.messageCount}
          </span>
        </div>
      </div>
    </button>
  );
}

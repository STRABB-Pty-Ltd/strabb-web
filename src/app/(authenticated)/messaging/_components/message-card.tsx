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
  high: "var(--status-danger)",
  medium: "var(--status-danger)",
  low: "var(--brand-10)",
};

interface MessageCardProps {
  message: Message;
  onClick: () => void;
}

export function MessageCard({ message, onClick }: MessageCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left" data-no-elevate>
      <div className="space-y-xs">
        <div className="gap-base flex items-center justify-between">
          <div className="gap-base flex min-w-0 items-center">
            <span className="text-body truncate font-medium text-gray-800">
              {message.guestName}
            </span>
            {message.priority !== "low" && (
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{ backgroundColor: priorityDot[message.priority] }}
              />
            )}
          </div>
          <span className="text-body shrink-0 truncate text-gray-500">{message.listingName}</span>
        </div>

        <div className="gap-base flex items-center">
          <span
            className="px-xs py-xs text-body text-text-on-color shrink-0 rounded-sm font-medium"
            style={{
              backgroundColor: channelColors[message.channel] ?? "var(--channel-direct)",
            }}
          >
            {channelLabels[message.channel] ?? message.channel}
          </span>
          <span className="text-body truncate text-gray-600">{message.subject}</span>
        </div>

        <p className="text-body truncate text-gray-400">{message.previewText}</p>

        <div className="gap-base text-body flex items-center text-gray-400">
          <span>{format(new Date(message.lastMessageTime), "d MMM, HH:mm")}</span>
          <span className="gap-xs flex items-center">
            <MessageSquare size={10} />
            {message.messageCount}
          </span>
        </div>
      </div>
    </button>
  );
}

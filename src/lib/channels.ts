export const CHANNEL_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "VRBO",
  direct: "Direct",
  // Channex ingest fallback for a conversation whose provider it can't map
  // to a named OTA - see strabb-api app/services/channex/message_ingest.py.
  ota: "OTA",
};

export function formatChannel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

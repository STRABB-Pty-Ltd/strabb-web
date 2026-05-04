export const CHANNEL_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "VRBO",
  direct: "Direct",
};

export function formatChannel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

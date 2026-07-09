import { NextResponse } from "next/server";

// Liveness endpoint (F.5). Cheap, unauthenticated, no DB or backend hop, so
// the Docker HEALTHCHECK and external uptime checks can probe the web
// container itself. Force dynamic so it is never statically cached.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "healthy" });
}

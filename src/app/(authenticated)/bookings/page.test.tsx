import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

import BookingsRedirect from "./page";

// A.10: /bookings is a zero-maintenance URL alias, not a stranded page - pin
// the redirect target so it can't silently rot. Called directly rather than
// through React's renderer: real Next.js never mounts this as a client
// component either, it just invokes the page function server-side and lets
// redirect() throw; mocked here so the assertion can inspect the argument.
describe("BookingsRedirect", () => {
  it("redirects to /calendar", () => {
    BookingsRedirect();
    expect(redirectMock).toHaveBeenCalledWith("/calendar");
  });
});

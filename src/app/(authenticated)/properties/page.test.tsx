import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

import PropertiesRedirect from "./page";

// A.10: /properties is a zero-maintenance URL alias, not a stranded page -
// pin the redirect target so it can't silently rot. Called directly rather
// than through React's renderer: real Next.js never mounts this as a client
// component either, it just invokes the page function server-side and lets
// redirect() throw; mocked here so the assertion can inspect the argument.
describe("PropertiesRedirect", () => {
  it("redirects to /operations", () => {
    PropertiesRedirect();
    expect(redirectMock).toHaveBeenCalledWith("/operations");
  });
});

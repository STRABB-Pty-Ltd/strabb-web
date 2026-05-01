import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./use-properties", () => ({ useProperties: vi.fn() }));
vi.mock("./use-listings", () => ({ useListings: vi.fn() }));

import { useListings } from "./use-listings";
import { useProperties } from "./use-properties";
import {
  DEFAULT_TIMEZONE,
  usePropertyTimezone,
  useTimezoneForListing,
} from "./use-property-timezone";

const mockProperties = useProperties as unknown as ReturnType<typeof vi.fn>;
const mockListings = useListings as unknown as ReturnType<typeof vi.fn>;

describe("usePropertyTimezone", () => {
  it("returns the matching property's timezone", () => {
    mockProperties.mockReturnValue({
      data: { data: [{ id: "p1", timezone: "America/New_York" }] },
    });
    const { result } = renderHook(() => usePropertyTimezone("p1"));
    expect(result.current).toBe("America/New_York");
  });

  it("falls back to DEFAULT_TIMEZONE when propertyId is null", () => {
    mockProperties.mockReturnValue({ data: { data: [] } });
    const { result } = renderHook(() => usePropertyTimezone(null));
    expect(result.current).toBe(DEFAULT_TIMEZONE);
  });

  it("falls back when propertyId has no match", () => {
    mockProperties.mockReturnValue({
      data: { data: [{ id: "p1", timezone: "America/New_York" }] },
    });
    const { result } = renderHook(() => usePropertyTimezone("missing"));
    expect(result.current).toBe(DEFAULT_TIMEZONE);
  });

  it("falls back when properties haven't loaded yet", () => {
    mockProperties.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => usePropertyTimezone("p1"));
    expect(result.current).toBe(DEFAULT_TIMEZONE);
  });
});

describe("useTimezoneForListing", () => {
  it("chains listing → property → timezone", () => {
    mockListings.mockReturnValue({
      data: { data: [{ id: "l1", propertyId: "p1" }] },
    });
    mockProperties.mockReturnValue({
      data: { data: [{ id: "p1", timezone: "Europe/London" }] },
    });
    const { result } = renderHook(() => useTimezoneForListing("l1"));
    expect(result.current).toBe("Europe/London");
  });

  it("falls back when listing is missing", () => {
    mockListings.mockReturnValue({ data: { data: [] } });
    mockProperties.mockReturnValue({ data: { data: [] } });
    const { result } = renderHook(() => useTimezoneForListing("l1"));
    expect(result.current).toBe(DEFAULT_TIMEZONE);
  });

  it("falls back when listing's property is missing", () => {
    mockListings.mockReturnValue({
      data: { data: [{ id: "l1", propertyId: "p1" }] },
    });
    mockProperties.mockReturnValue({ data: { data: [] } });
    const { result } = renderHook(() => useTimezoneForListing("l1"));
    expect(result.current).toBe(DEFAULT_TIMEZONE);
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChannelSummaryResponse } from "@/lib/schemas/listing";

const { channelsMock, settingsFormMock, patchMock, saveMock, syncLogsMock, triggerSyncMock } =
  vi.hoisted(() => ({
    channelsMock: vi.fn(),
    settingsFormMock: vi.fn(),
    patchMock: vi.fn(),
    saveMock: vi.fn(),
    syncLogsMock: vi.fn(),
    triggerSyncMock: vi.fn(),
  }));

vi.mock("@/lib/api-hooks/listings-api", () => ({
  useListingsChannels: () => channelsMock(),
}));

vi.mock("@/lib/api-hooks/settings-api", () => ({
  useSettingsForm: () => settingsFormMock(),
}));

vi.mock("@/hooks/use-sync", () => ({
  useSyncLogs: () => syncLogsMock(),
  useTriggerSync: () => triggerSyncMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof vi.fn }) => unknown) =>
    selector({ addToast: vi.fn() }),
}));

import { ChannelsSection } from "./channels-section";

function channel(overrides: Partial<ChannelSummaryResponse> = {}): ChannelSummaryResponse {
  return {
    id: "airbnb",
    name: "Airbnb",
    status: "connected",
    listingCount: 2,
    mappedListings: [],
    ...overrides,
  };
}

function setup(
  channels: ChannelSummaryResponse[] | undefined,
  settingsValues: Record<string, unknown> = {},
  channelsLoading = false,
) {
  channelsMock.mockReturnValue({ data: channels, isLoading: channelsLoading });
  syncLogsMock.mockReturnValue({ data: undefined, isLoading: false });
  triggerSyncMock.mockReturnValue({ isPending: false, mutate: vi.fn() });
  settingsFormMock.mockReturnValue({
    values: { channels: {}, ...settingsValues },
    patch: patchMock,
    save: saveMock,
    isSaving: false,
    dirty: true,
  });
}

describe("ChannelsSection", () => {
  beforeEach(() => {
    channelsMock.mockReset();
    settingsFormMock.mockReset();
    patchMock.mockReset();
    saveMock.mockReset();
    syncLogsMock.mockReset();
    triggerSyncMock.mockReset();
  });

  it("renders real channels from the API, not the old static mock list", () => {
    setup([
      channel({ id: "airbnb", name: "Airbnb", status: "connected", listingCount: 2 }),
      channel({ id: "vrbo", name: "Vrbo", status: "not_connected", listingCount: 0 }),
    ]);
    render(<ChannelsSection />);

    expect(screen.getByText("Airbnb")).toBeInTheDocument();
    expect(screen.getByText("Vrbo")).toBeInTheDocument();
    expect(screen.getByText("2 listings mapped")).toBeInTheDocument();
    expect(screen.getByText("No listings mapped")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("excludes non-OTA channels (email, internal_notes) from the sync/pricing rows", () => {
    setup([
      channel({ id: "airbnb", name: "Airbnb" }),
      channel({ id: "email", name: "Email", listingCount: 0, status: "not_connected" }),
      channel({
        id: "internal_notes",
        name: "Internal Notes",
        listingCount: 0,
        status: "not_connected",
      }),
    ]);
    render(<ChannelsSection />);

    expect(screen.getByText("Airbnb")).toBeInTheDocument();
    expect(screen.queryByText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal Notes")).not.toBeInTheDocument();
  });

  it("shows a loading state while channels are fetching", () => {
    setup(undefined, {}, true);
    render(<ChannelsSection />);
    expect(screen.getByText("Loading channels...")).toBeInTheDocument();
  });

  it("shows a saved per-channel preference, defaulting unset channels", () => {
    setup([channel({ id: "airbnb" }), channel({ id: "vrbo", name: "Vrbo" })], {
      channels: { airbnb: { syncFrequency: "60", pricingRule: "discount_10" } },
    });
    render(<ChannelsSection />);

    const airbnbRow = screen.getByText("Airbnb").closest("div.px-sm.py-sm") as HTMLElement;
    expect(within(airbnbRow).getByLabelText("Sync Frequency")).toHaveValue("60");
    expect(within(airbnbRow).getByLabelText("Default Pricing Rule")).toHaveValue("discount_10");

    const vrboRow = screen.getByText("Vrbo").closest("div.px-sm.py-sm") as HTMLElement;
    expect(within(vrboRow).getByLabelText("Sync Frequency")).toHaveValue("15");
    expect(within(vrboRow).getByLabelText("Default Pricing Rule")).toHaveValue("base");
  });

  it("patches only the edited channel's prefs, keyed by channel id", async () => {
    setup([channel({ id: "airbnb" }), channel({ id: "vrbo", name: "Vrbo" })], {
      channels: { vrbo: { syncFrequency: "30", pricingRule: "base_plus_10" } },
    });
    render(<ChannelsSection />);

    const airbnbRow = screen.getByText("Airbnb").closest("div.px-sm.py-sm") as HTMLElement;
    await userEvent.selectOptions(within(airbnbRow).getByLabelText("Sync Frequency"), "60");

    expect(patchMock).toHaveBeenCalledWith(expect.any(Function));
    const updater = patchMock.mock.calls[0][0] as (current: {
      channels: Record<string, unknown>;
    }) => unknown;
    expect(
      updater({ channels: { vrbo: { syncFrequency: "30", pricingRule: "base_plus_10" } } }),
    ).toEqual({
      channels: {
        vrbo: { syncFrequency: "30", pricingRule: "base_plus_10" },
        airbnb: { syncFrequency: "60", pricingRule: "base" },
      },
    });
  });
});

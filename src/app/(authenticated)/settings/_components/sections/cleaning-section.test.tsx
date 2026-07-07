import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamMember } from "@/lib/schemas/team";

const { membersMock, settingsFormMock, patchMock, saveMock } = vi.hoisted(() => ({
  membersMock: vi.fn(),
  settingsFormMock: vi.fn(),
  patchMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock("@/hooks/use-team", () => ({
  useTeamMembers: () => membersMock(),
}));

vi.mock("@/lib/api-hooks/settings-api", () => ({
  useSettingsForm: () => settingsFormMock(),
}));

import { CleaningSection } from "./cleaning-section";

function cleaner(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: "u-cara",
    email: "cara@example.com",
    fullName: "Cara Cleaner",
    role: "cleaner",
    isActive: true,
    lastLoginAt: null,
    hourlyRate: null,
    ...overrides,
  };
}

function setup(
  values: Record<string, unknown> = {},
  cleaners: TeamMember[] = [cleaner(), cleaner({ id: "u-sam", fullName: "Sam Sweeper" })],
) {
  membersMock.mockReturnValue({ data: { data: cleaners }, isLoading: false });
  settingsFormMock.mockReturnValue({
    values: {
      defaultDuration: "2",
      defaultTime: "",
      autoAssign: false,
      defaultCleanerId: "",
      defaultCleaner: "",
      defaultCleanerEmail: "",
      ...values,
    },
    patch: patchMock,
    save: saveMock,
    isSaving: false,
    dirty: true,
  });
}

describe("CleaningSection default-cleaner dropdown", () => {
  beforeEach(() => {
    membersMock.mockReset();
    settingsFormMock.mockReset();
    patchMock.mockReset();
    saveMock.mockReset();
  });

  it("renders the real cleaner roster as dropdown options plus a None option", () => {
    setup();
    render(<CleaningSection />);
    const select = screen.getByLabelText("Default Cleaner");
    const options = within(select)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).textContent);
    expect(options).toEqual(["None", "Cara Cleaner", "Sam Sweeper"]);
  });

  it("persists the selected cleaner id (plus denormalised name + email)", async () => {
    setup();
    render(<CleaningSection />);
    await userEvent.selectOptions(screen.getByLabelText("Default Cleaner"), "u-cara");

    expect(patchMock).toHaveBeenCalledWith({
      defaultCleanerId: "u-cara",
      defaultCleaner: "Cara Cleaner",
      defaultCleanerEmail: "cara@example.com",
    });
  });

  it("clears the cleaner when None is chosen", async () => {
    setup({ defaultCleanerId: "u-cara", defaultCleaner: "Cara Cleaner" });
    render(<CleaningSection />);
    await userEvent.selectOptions(screen.getByLabelText("Default Cleaner"), "");

    expect(patchMock).toHaveBeenCalledWith({
      defaultCleanerId: "",
      defaultCleaner: "",
      defaultCleanerEmail: "",
    });
  });

  it("shows an empty-roster hint when there are no cleaners", () => {
    setup({}, []);
    render(<CleaningSection />);
    expect(screen.getByText(/no cleaners on the team yet/i)).toBeInTheDocument();
  });
});

describe("CleaningSection default start time", () => {
  beforeEach(() => {
    membersMock.mockReset();
    settingsFormMock.mockReset();
    patchMock.mockReset();
    saveMock.mockReset();
  });

  it("renders the saved default start time and patches edits back", () => {
    setup({ defaultTime: "11:00" });
    render(<CleaningSection />);

    const input = screen.getByLabelText("Default Start Time") as HTMLInputElement;
    expect(input.value).toBe("11:00");

    fireEvent.change(input, { target: { value: "09:30" } });
    expect(patchMock).toHaveBeenCalledWith({ defaultTime: "09:30" });
  });
});

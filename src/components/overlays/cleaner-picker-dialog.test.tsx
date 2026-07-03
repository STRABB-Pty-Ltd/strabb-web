import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamMember } from "@/lib/schemas/team";

const { membersMock } = vi.hoisted(() => ({ membersMock: vi.fn() }));

vi.mock("@/hooks/use-team", () => ({
  useTeamMembers: () => membersMock(),
}));

import { CleanerPickerDialog, type CleanerAssignment } from "./cleaner-picker-dialog";

const cleaners: TeamMember[] = [
  {
    id: "u-cara",
    email: "cara@example.com",
    fullName: "Cara Cleaner",
    role: "cleaner",
    isActive: true,
    lastLoginAt: null,
    hourlyRate: null,
  },
  {
    id: "u-sam",
    email: "sam@example.com",
    fullName: "Sam Sweeper",
    role: "cleaner",
    isActive: true,
    lastLoginAt: null,
    hourlyRate: null,
  },
];

const emptyInitial: CleanerAssignment = {
  assignedUserId: null,
  cleanerName: "",
  cleanerEmail: "",
  cleanerPhone: "",
};

function renderPicker(onSave: (next: CleanerAssignment) => void, initial = emptyInitial) {
  return render(
    <CleanerPickerDialog
      open
      onOpenChange={() => {}}
      initial={initial}
      onSave={onSave}
      saving={false}
    />,
  );
}

describe("CleanerPickerDialog", () => {
  beforeEach(() => {
    membersMock.mockReset();
    membersMock.mockReturnValue({ data: { data: cleaners }, isLoading: false });
  });

  it("lists the real API cleaners (GET /users?role=cleaner), not a bundled array", async () => {
    renderPicker(vi.fn());
    await userEvent.click(screen.getByRole("button", { name: /choose from team/i }));

    expect(screen.getByText("Cara Cleaner")).toBeInTheDocument();
    expect(screen.getByText("Sam Sweeper")).toBeInTheDocument();
  });

  it("writes assignedUserId when a team cleaner is selected", async () => {
    const onSave = vi.fn();
    renderPicker(onSave);
    await userEvent.click(screen.getByRole("button", { name: /choose from team/i }));
    await userEvent.click(screen.getByRole("button", { name: /Cara Cleaner/i }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      assignedUserId: "u-cara",
      cleanerName: "Cara Cleaner",
      cleanerEmail: "cara@example.com",
      cleanerPhone: "",
    });
  });

  it("writes the free-text trio with a null FK in manual mode", async () => {
    const onSave = vi.fn();
    renderPicker(onSave);
    await userEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    await userEvent.type(screen.getByLabelText("Cleaner name"), "One Off");
    await userEvent.type(screen.getByLabelText("Cleaner email"), "oneoff@example.com");
    await userEvent.type(screen.getByLabelText("Cleaner phone"), "+61400999888");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      assignedUserId: null,
      cleanerName: "One Off",
      cleanerEmail: "oneoff@example.com",
      cleanerPhone: "+61400999888",
    });
  });

  it("preselects the already-assigned cleaner by its FK", async () => {
    const onSave = vi.fn();
    renderPicker(onSave, { ...emptyInitial, assignedUserId: "u-sam" });
    await userEvent.click(screen.getByRole("button", { name: /choose from team/i }));
    // Save is enabled immediately because a selection already exists; saving
    // without re-picking keeps the assigned user.
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ assignedUserId: "u-sam", cleanerName: "Sam Sweeper" }),
    );
  });
});

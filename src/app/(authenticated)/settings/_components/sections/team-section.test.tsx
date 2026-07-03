import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";
import type { Invite, TeamMember } from "@/lib/schemas/team";

const {
  membersMock,
  invitesMock,
  createMock,
  revokeMock,
  resendMock,
  updateRoleMock,
  deactivateMock,
  reactivateMock,
  addToastMock,
} = vi.hoisted(() => ({
  membersMock: vi.fn(),
  invitesMock: vi.fn(),
  createMock: vi.fn(),
  revokeMock: vi.fn(),
  resendMock: vi.fn(),
  updateRoleMock: vi.fn(),
  deactivateMock: vi.fn(),
  reactivateMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-team", () => ({
  useTeamMembers: () => membersMock(),
  useInvites: () => invitesMock(),
}));

vi.mock("@/lib/api-hooks/team-api", () => ({
  useCreateInvite: () => ({ mutate: createMock, isPending: false }),
  useRevokeInvite: () => ({ mutate: revokeMock, isPending: false }),
  useResendInvite: () => ({ mutate: resendMock, isPending: false }),
  useUpdateUserRole: () => ({ mutate: updateRoleMock, isPending: false }),
  useDeactivateUser: () => ({ mutate: deactivateMock, isPending: false }),
  useReactivateUser: () => ({ mutate: reactivateMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { TeamSection } from "./team-section";

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: "u-1",
    email: "owner@example.com",
    fullName: "Olivia Owner",
    role: "owner",
    isActive: true,
    lastLoginAt: "2026-06-30T09:00:00Z",
    ...overrides,
  };
}

function invite(overrides: Partial<Invite> = {}): Invite {
  return {
    id: "inv-1",
    email: "pending@example.com",
    role: "cleaner",
    expiresAt: "2026-07-10T00:00:00Z",
    ...overrides,
  };
}

function setup(members: TeamMember[], invites: Invite[]) {
  membersMock.mockReturnValue({ data: { data: members }, isLoading: false });
  invitesMock.mockReturnValue({ data: { data: invites }, isLoading: false });
}

describe("TeamSection", () => {
  beforeEach(() => {
    membersMock.mockReset();
    invitesMock.mockReset();
    createMock.mockReset();
    revokeMock.mockReset();
    resendMock.mockReset();
    updateRoleMock.mockReset();
    deactivateMock.mockReset();
    reactivateMock.mockReset();
    addToastMock.mockReset();
  });

  it("renders real members and pending invites from the hooks", () => {
    setup([member(), member({ id: "u-2", fullName: "Cara Cleaner", role: "cleaner" })], [invite()]);
    render(<TeamSection />);

    expect(screen.getByText("Olivia Owner")).toBeInTheDocument();
    expect(screen.getByText("Cara Cleaner")).toBeInTheDocument();
    expect(screen.getByText("Pending invitations")).toBeInTheDocument();
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
  });

  it("shows an empty state when there are no members", () => {
    setup([], []);
    render(<TeamSection />);
    expect(screen.getByText(/no team members yet/i)).toBeInTheDocument();
  });

  it("offers exactly the admin/owner/cleaner roles in the invite picker (no manager/viewer)", async () => {
    setup([member()], []);
    render(<TeamSection />);
    await userEvent.click(screen.getByRole("button", { name: /invite member/i }));

    const roleSelect = screen.getByLabelText("Role");
    const values = within(roleSelect)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value)
      .sort();
    expect(values).toEqual(["admin", "cleaner", "owner"]);
  });

  it("fires the real invite mutation with the email + role (no fake toast-only path)", async () => {
    setup([member()], []);
    render(<TeamSection />);
    await userEvent.click(screen.getByRole("button", { name: /invite member/i }));
    await userEvent.type(screen.getByLabelText("Email"), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0]).toEqual({ email: "new@example.com", role: "cleaner" });
  });

  it("does not call the API for an invalid invite email", async () => {
    setup([member()], []);
    render(<TeamSection />);
    await userEvent.click(screen.getByRole("button", { name: /invite member/i }));
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /send invite/i }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("surfaces the last-owner 409 as an error toast on deactivate", async () => {
    deactivateMock.mockImplementation((_id: string, opts: { onError: (e: unknown) => void }) => {
      opts.onError(new ApiError(409, "Cannot deactivate the last active owner"));
    });
    setup([member()], []);
    render(<TeamSection />);
    await userEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({
        type: "error",
        message: "Cannot deactivate the last active owner",
      }),
    );
  });

  it("reactivates an inactive member", async () => {
    reactivateMock.mockImplementation((_id: string, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    setup([member({ isActive: false })], []);
    render(<TeamSection />);
    await userEvent.click(screen.getByRole("button", { name: /reactivate/i }));

    expect(reactivateMock).toHaveBeenCalledWith("u-1", expect.anything());
  });

  it("resends and revokes pending invites", async () => {
    setup([member()], [invite()]);
    render(<TeamSection />);

    await userEvent.click(screen.getByRole("button", { name: /resend/i }));
    expect(resendMock).toHaveBeenCalledWith("inv-1", expect.anything());

    await userEvent.click(screen.getByRole("button", { name: /revoke/i }));
    expect(revokeMock).toHaveBeenCalledWith("inv-1", expect.anything());
  });
});

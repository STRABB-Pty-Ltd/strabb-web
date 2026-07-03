import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, updateMock, addToastMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-messages", () => ({
  useCreateTemplate: () => ({ mutateAsync: createMock, isPending: false }),
  useUpdateTemplate: () => ({ mutateAsync: updateMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: addToastMock }),
}));

import { TemplateFormDialog } from "./template-form-dialog";

function renderCreate() {
  return render(
    <TemplateFormDialog
      open
      onOpenChange={vi.fn()}
      mode={{ kind: "create" }}
      propertyOptions={[{ value: "p1", label: "Prop One" }]}
    />,
  );
}

describe("TemplateFormDialog", () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    addToastMock.mockReset();
    createMock.mockResolvedValue({});
  });

  it("shows the days-before-check-in field only for the days_before_checkin trigger", async () => {
    renderCreate();
    await screen.findByLabelText(/^body/i);

    expect(screen.queryByLabelText(/days before check-in/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^send/i), {
      target: { value: "days_before_checkin" },
    });

    expect(screen.getByLabelText(/days before check-in/i)).toBeInTheDocument();
  });

  it("inserts a token into the last-focused field when a token chip is clicked", async () => {
    renderCreate();
    const body = (await screen.findByLabelText(/^body/i)) as HTMLTextAreaElement;

    fireEvent.focus(body);
    fireEvent.click(screen.getByRole("button", { name: "{guest_name}" }));

    expect(body).toHaveValue("{guest_name}");
  });

  it("live-previews substituting known tokens and leaving unknown ones raw", async () => {
    renderCreate();
    const body = await screen.findByLabelText(/^body/i);

    fireEvent.change(body, { target: { value: "Hi {guest_name} and {foo}" } });

    // Known token -> sample value; unknown {foo} stays raw as the typo cue.
    expect(screen.getByText(/Hi Sarah Chen and \{foo\}/)).toBeInTheDocument();
  });

  it("submits a create with trigger_days null for on_confirmation", async () => {
    renderCreate();
    await screen.findByLabelText(/^body/i);

    fireEvent.change(screen.getByLabelText(/template key/i), {
      target: { value: "welcome_message" },
    });
    fireEvent.change(screen.getByLabelText(/^subject/i), {
      target: { value: "Welcome {guest_name}" },
    });
    fireEvent.change(screen.getByLabelText(/^body/i), {
      target: { value: "Hi {guest_name}" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: "welcome_message",
        propertyId: null,
        triggerType: "on_confirmation",
        triggerDays: null,
        isActive: true,
      }),
    );
  });
});

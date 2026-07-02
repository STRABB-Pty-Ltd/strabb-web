import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

const { templatesMock, seedMock, addToastMock } = vi.hoisted(() => ({
  templatesMock: vi.fn(),
  seedMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-messages", () => ({
  useMessageTemplates: () => templatesMock(),
  useSeedDefaults: () => ({ mutate: seedMock, isPending: false }),
  useCreateTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTemplate: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useDeleteTemplate: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({ data: { data: [] } }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector({ addToast: addToastMock }),
}));

import MessageTemplatesPage from "./page";

describe("MessageTemplatesPage", () => {
  beforeEach(() => {
    templatesMock.mockReset();
    seedMock.mockReset();
    addToastMock.mockReset();
  });

  it("offers the seed-defaults flow when there are no templates", () => {
    templatesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<MessageTemplatesPage />);

    expect(screen.getByText(/no templates yet/i)).toBeInTheDocument();
    const seedButton = screen.getByRole("button", { name: /set up default templates/i });
    fireEvent.click(seedButton);
    expect(seedMock).toHaveBeenCalledTimes(1);
  });

  it("degrades quietly to a permission notice on a 403 (B.4)", () => {
    templatesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(403, "Insufficient role"),
    });
    render(<MessageTemplatesPage />);

    expect(screen.getByText(/do not have access to messaging templates/i)).toBeInTheDocument();
    expect(screen.queryByText(/no templates yet/i)).not.toBeInTheDocument();
  });
});

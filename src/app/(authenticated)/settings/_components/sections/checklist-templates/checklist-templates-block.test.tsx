import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";
import { applyOrder } from "@/lib/api-hooks/checklist-templates-api";
import type { ChecklistItem, ChecklistTemplate } from "@/lib/schemas/checklist-template";

const {
  templatesMock,
  createMock,
  renameMock,
  deleteMock,
  addItemMock,
  updateItemMock,
  deleteItemMock,
  reorderMock,
  addToastMock,
} = vi.hoisted(() => ({
  templatesMock: vi.fn(),
  createMock: vi.fn(),
  renameMock: vi.fn(),
  deleteMock: vi.fn(),
  addItemMock: vi.fn(),
  updateItemMock: vi.fn(),
  deleteItemMock: vi.fn(),
  reorderMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-checklist-templates", () => ({
  useChecklistTemplates: () => templatesMock(),
}));

vi.mock("@/lib/api-hooks/checklist-templates-api", async (importOriginal) => {
  // Keep the real applyOrder (pure helper) while stubbing the hooks.
  const actual = await importOriginal<typeof import("@/lib/api-hooks/checklist-templates-api")>();
  return {
    applyOrder: actual.applyOrder,
    useCreateTemplate: () => ({ mutate: createMock, isPending: false }),
    useRenameTemplate: () => ({ mutate: renameMock, isPending: false }),
    useDeleteTemplate: () => ({ mutate: deleteMock, isPending: false }),
    useAddItem: () => ({ mutate: addItemMock, isPending: false }),
    useUpdateItem: () => ({ mutate: updateItemMock, isPending: false }),
    useDeleteItem: () => ({ mutate: deleteItemMock, isPending: false }),
    useReorderItems: () => ({ mutate: reorderMock, isPending: false }),
  };
});

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { ChecklistTemplatesBlock } from "./checklist-templates-block";

function item(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: "i-1",
    label: "Beds",
    description: null,
    position: 0,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function template(overrides: Partial<ChecklistTemplate> = {}): ChecklistTemplate {
  return {
    id: "t-1",
    name: "Standard Clean",
    items: [],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function setup(templates: ChecklistTemplate[], isLoading = false) {
  templatesMock.mockReturnValue({ data: { data: templates }, isLoading });
}

describe("ChecklistTemplatesBlock", () => {
  beforeEach(() => {
    templatesMock.mockReset();
    createMock.mockReset();
    renameMock.mockReset();
    deleteMock.mockReset();
    addItemMock.mockReset();
    updateItemMock.mockReset();
    deleteItemMock.mockReset();
    reorderMock.mockReset();
    addToastMock.mockReset();
  });

  it("renders templates and their items from the hook (no hardcoded placeholders)", () => {
    setup([
      template({
        items: [
          item({ id: "i-1", label: "Beds" }),
          item({ id: "i-2", label: "Bathroom", position: 1 }),
        ],
      }),
    ]);
    render(<ChecklistTemplatesBlock />);

    expect(screen.getByDisplayValue("Standard Clean")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beds")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    // The old fake rows are gone.
    expect(screen.queryByText("Deep Clean")).not.toBeInTheDocument();
    expect(screen.queryByText("Quick Inspection")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no templates", () => {
    setup([]);
    render(<ChecklistTemplatesBlock />);
    expect(screen.getByText(/no checklist templates yet/i)).toBeInTheDocument();
  });

  it("shows a loading state while templates are loading", () => {
    setup([], true);
    render(<ChecklistTemplatesBlock />);
    expect(screen.getByText(/loading templates/i)).toBeInTheDocument();
  });

  it("creates a template with the entered name", async () => {
    createMock.mockImplementation((_vars, opts: { onSuccess?: () => void }) => opts?.onSuccess?.());
    setup([]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.click(screen.getByRole("button", { name: /add template/i }));
    await userEvent.type(screen.getByLabelText("Template name"), "Deep Clean");
    await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0]).toEqual({ name: "Deep Clean" });
    expect(addToastMock).toHaveBeenCalledWith({
      type: "success",
      message: 'Template "Deep Clean" created',
    });
  });

  it("does not create a template with a blank name", async () => {
    setup([]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.click(screen.getByRole("button", { name: /add template/i }));
    await userEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(await screen.findByText("Enter a template name")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("adds an item to a template", async () => {
    setup([template({ items: [item()] })]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.type(screen.getByLabelText("New checklist item"), "Kitchen");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(addItemMock).toHaveBeenCalledTimes(1);
    expect(addItemMock.mock.calls[0][0]).toEqual({ templateId: "t-1", label: "Kitchen" });
  });

  it("renames a template on blur", async () => {
    setup([template({ items: [item()] })]);
    render(<ChecklistTemplatesBlock />);

    const nameInput = screen.getByLabelText("Template name Standard Clean");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Standard Checkout Clean");
    await userEvent.tab();

    expect(renameMock).toHaveBeenCalledTimes(1);
    expect(renameMock.mock.calls[0][0]).toEqual({ id: "t-1", name: "Standard Checkout Clean" });
  });

  it("renames an item on blur", async () => {
    setup([template({ items: [item({ id: "i-1", label: "Beds" })] })]);
    render(<ChecklistTemplatesBlock />);

    const itemInput = screen.getByLabelText("Checklist item Beds");
    await userEvent.clear(itemInput);
    await userEvent.type(itemInput, "Make beds");
    await userEvent.tab();

    expect(updateItemMock).toHaveBeenCalledTimes(1);
    expect(updateItemMock.mock.calls[0][0]).toEqual({
      templateId: "t-1",
      itemId: "i-1",
      label: "Make beds",
    });
  });

  it("adds a description to an item on blur", async () => {
    setup([template({ items: [item({ id: "i-1", label: "Beds", description: null })] })]);
    render(<ChecklistTemplatesBlock />);

    // The description field is revealed once the row is focused (compact rows).
    await userEvent.click(screen.getByLabelText("Checklist item Beds"));
    const descInput = screen.getByLabelText("Description for Beds");
    await userEvent.type(descInput, "Hospital corners");
    await userEvent.tab();

    expect(updateItemMock).toHaveBeenCalledTimes(1);
    expect(updateItemMock.mock.calls[0][0]).toEqual({
      templateId: "t-1",
      itemId: "i-1",
      description: "Hospital corners",
    });
  });

  it("clears a description (sends null) when emptied", async () => {
    setup([template({ items: [item({ id: "i-1", label: "Beds", description: "old note" })] })]);
    render(<ChecklistTemplatesBlock />);

    const descInput = screen.getByLabelText("Description for Beds");
    await userEvent.clear(descInput);
    await userEvent.tab();

    expect(updateItemMock).toHaveBeenCalledTimes(1);
    expect(updateItemMock.mock.calls[0][0]).toEqual({
      templateId: "t-1",
      itemId: "i-1",
      description: null,
    });
  });

  it("deletes a template", async () => {
    setup([template({ items: [item()] })]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteMock).toHaveBeenCalledWith("t-1", expect.anything());
  });

  it("deletes an item", async () => {
    setup([template({ items: [item({ id: "i-1", label: "Beds" })] })]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.click(screen.getByRole("button", { name: /delete item beds/i }));
    expect(deleteItemMock).toHaveBeenCalledTimes(1);
    expect(deleteItemMock.mock.calls[0][0]).toEqual({ templateId: "t-1", itemId: "i-1" });
  });

  it("surfaces an API error as a toast when adding an item fails", async () => {
    addItemMock.mockImplementation((_vars, opts: { onError: (e: unknown) => void }) => {
      opts.onError(new ApiError(400, "Item label is required"));
    });
    setup([template({ items: [item()] })]);
    render(<ChecklistTemplatesBlock />);

    await userEvent.type(screen.getByLabelText("New checklist item"), "Kitchen");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({
        type: "error",
        message: "Item label is required",
      }),
    );
  });

  it("exposes a drag handle for each item", () => {
    setup([
      template({
        items: [
          item({ id: "i-1", label: "Beds" }),
          item({ id: "i-2", label: "Bathroom", position: 1 }),
        ],
      }),
    ]);
    render(<ChecklistTemplatesBlock />);

    expect(screen.getByRole("button", { name: /reorder beds/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reorder bathroom/i })).toBeInTheDocument();
  });
});

describe("applyOrder (optimistic reorder)", () => {
  it("reorders items to match itemIds and reassigns position by index", () => {
    const items = [
      item({ id: "a", label: "A", position: 0 }),
      item({ id: "b", label: "B", position: 1 }),
      item({ id: "c", label: "C", position: 2 }),
    ];
    const result = applyOrder(items, ["c", "a", "b"]);
    expect(result.map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(result.map((i) => i.position)).toEqual([0, 1, 2]);
  });

  it("drops ids that are not present and keeps only matching items", () => {
    const items = [item({ id: "a" }), item({ id: "b" })];
    const result = applyOrder(items, ["b", "missing", "a"]);
    expect(result.map((i) => i.id)).toEqual(["b", "a"]);
  });
});

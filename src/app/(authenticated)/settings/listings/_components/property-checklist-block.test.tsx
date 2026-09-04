import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";
import { applyOrder } from "@/lib/api-hooks/property-checklist-api";
import type { PropertyChecklistItem } from "@/lib/schemas/property-checklist";

const {
  checklistMock,
  templatesMock,
  addItemMock,
  updateItemMock,
  deleteItemMock,
  reorderMock,
  applyTemplateMock,
  addToastMock,
} = vi.hoisted(() => ({
  checklistMock: vi.fn(),
  templatesMock: vi.fn(),
  addItemMock: vi.fn(),
  updateItemMock: vi.fn(),
  deleteItemMock: vi.fn(),
  reorderMock: vi.fn(),
  applyTemplateMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-default-checklist", () => ({
  useDefaultChecklist: () => checklistMock(),
  propertyChecklistKey: (id: string) => ["properties", id, "checklist"],
}));

vi.mock("@/hooks/use-checklist-templates", () => ({
  useChecklistTemplates: () => templatesMock(),
}));

vi.mock("@/lib/api-hooks/property-checklist-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-hooks/property-checklist-api")>();
  return {
    applyOrder: actual.applyOrder,
    useAddPropertyItem: () => ({ mutate: addItemMock, isPending: false }),
    useUpdatePropertyItem: () => ({ mutate: updateItemMock, isPending: false }),
    useDeletePropertyItem: () => ({ mutate: deleteItemMock, isPending: false }),
    useReorderPropertyItems: () => ({ mutate: reorderMock, isPending: false }),
    useApplyTemplate: () => ({ mutate: applyTemplateMock, isPending: false }),
  };
});

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { PropertyChecklistBlock } from "./property-checklist-block";

const PROPERTY_ID = "p-1";

function item(overrides: Partial<PropertyChecklistItem> = {}): PropertyChecklistItem {
  return {
    id: "i-1",
    label: "Beds",
    description: null,
    position: 0,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

function setup(
  items: PropertyChecklistItem[],
  templates: { id: string; name: string; items: { id: string }[] }[] = [],
  isLoading = false,
) {
  checklistMock.mockReturnValue({ data: { data: items }, isLoading });
  templatesMock.mockReturnValue({ data: { data: templates } });
}

describe("PropertyChecklistBlock", () => {
  beforeEach(() => {
    checklistMock.mockReset();
    templatesMock.mockReset();
    addItemMock.mockReset();
    updateItemMock.mockReset();
    deleteItemMock.mockReset();
    reorderMock.mockReset();
    applyTemplateMock.mockReset();
    addToastMock.mockReset();
  });

  it("renders the property's checklist items from the hook", () => {
    setup([
      item({ id: "i-1", label: "Beds" }),
      item({ id: "i-2", label: "Bathroom", position: 1 }),
    ]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    expect(screen.getByDisplayValue("Beds")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bathroom")).toBeInTheDocument();
  });

  it("shows the editor empty state when there are no items", () => {
    setup([]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
  });

  it("shows a loading state while the checklist loads", () => {
    setup([], [], true);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    expect(screen.getByText(/loading checklist/i)).toBeInTheDocument();
  });

  it("adds an item with the property id", async () => {
    setup([item()]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    await userEvent.type(screen.getByLabelText("New checklist item"), "Kitchen");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(addItemMock).toHaveBeenCalledTimes(1);
    expect(addItemMock.mock.calls[0][0]).toEqual({ propertyId: PROPERTY_ID, label: "Kitchen" });
  });

  it("renames an item on blur", async () => {
    setup([item({ id: "i-1", label: "Beds" })]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    const input = screen.getByLabelText("Checklist item Beds");
    await userEvent.clear(input);
    await userEvent.type(input, "Make beds");
    await userEvent.tab();
    expect(updateItemMock.mock.calls[0][0]).toEqual({
      propertyId: PROPERTY_ID,
      itemId: "i-1",
      label: "Make beds",
    });
  });

  it("sets a description on an item (clearing sends null)", async () => {
    setup([item({ id: "i-1", label: "Beds", description: "old" })]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    const desc = screen.getByLabelText("Description for Beds");
    await userEvent.clear(desc);
    await userEvent.tab();
    expect(updateItemMock.mock.calls[0][0]).toEqual({
      propertyId: PROPERTY_ID,
      itemId: "i-1",
      description: null,
    });
  });

  it("deletes an item with the property id", async () => {
    setup([item({ id: "i-1", label: "Beds" })]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    await userEvent.click(screen.getByRole("button", { name: /delete item beds/i }));
    expect(deleteItemMock.mock.calls[0][0]).toEqual({ propertyId: PROPERTY_ID, itemId: "i-1" });
  });

  it("applies a template and toasts the number of items added", async () => {
    applyTemplateMock.mockImplementation((_vars, opts: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
    );
    setup([], [{ id: "t-1", name: "Deep Clean", items: [{ id: "x" }, { id: "y" }] }]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);

    await userEvent.selectOptions(screen.getByLabelText("Set from a template"), "t-1");
    await userEvent.click(screen.getByRole("button", { name: /add to checklist/i }));

    expect(applyTemplateMock.mock.calls[0][0]).toEqual({
      propertyId: PROPERTY_ID,
      templateId: "t-1",
    });
    expect(addToastMock).toHaveBeenCalledWith({
      type: "success",
      message: 'Added 2 items from "Deep Clean"',
    });
  });

  it("hides the template picker when there are no templates", () => {
    setup([item()], []);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    expect(screen.queryByLabelText("Set from a template")).not.toBeInTheDocument();
  });

  it("surfaces an API error as a toast when adding fails", async () => {
    addItemMock.mockImplementation((_vars, opts: { onError: (e: unknown) => void }) => {
      opts.onError(new ApiError(400, "Item label is required"));
    });
    setup([item()]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
    await userEvent.type(screen.getByLabelText("New checklist item"), "Kitchen");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));
    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({
        type: "error",
        message: "Item label is required",
      }),
    );
  });

  it("exposes a drag handle per item", () => {
    setup([
      item({ id: "i-1", label: "Beds" }),
      item({ id: "i-2", label: "Bathroom", position: 1 }),
    ]);
    render(<PropertyChecklistBlock propertyId={PROPERTY_ID} />);
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

  it("drops ids that are not present", () => {
    const items = [item({ id: "a" }), item({ id: "b" })];
    const result = applyOrder(items, ["b", "missing", "a"]);
    expect(result.map((i) => i.id)).toEqual(["b", "a"]);
  });
});

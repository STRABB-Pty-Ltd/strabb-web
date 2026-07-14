"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useListings } from "@/hooks/use-listings";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { Listing } from "@/types/listing";

export function ListingFilterTree() {
  const selectedListings = useAppStore((s) => s.selectedListings);
  const setSelectedListings = useAppStore((s) => s.setSelectedListings);
  const toggleListing = useAppStore((s) => s.toggleListing);
  const expandedGroups = useAppStore((s) => s.expandedGroups);
  const toggleGroup = useAppStore((s) => s.toggleGroup);
  const customGroups = useAppStore((s) => s.customGroups);
  const createCustomGroup = useAppStore((s) => s.createCustomGroup);
  const deleteCustomGroup = useAppStore((s) => s.deleteCustomGroup);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const pendingDeleteGroup = pendingDeleteGroupId
    ? (customGroups.find((g) => g.id === pendingDeleteGroupId) ?? null)
    : null;

  const { data: listingsData } = useListings();
  const allListings = (listingsData?.data ?? []) as unknown as Listing[];

  const parents = allListings.filter((l) => l.relationship === "parent");
  const standalones = allListings.filter((l) => l.relationship === "standalone");
  const allIds = allListings.map((l) => l.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedListings.includes(id));

  const handleSelectAll = () => setSelectedListings(allIds);
  const handleClear = () => setSelectedListings([]);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createCustomGroup(newGroupName.trim(), selectedListings);
      setNewGroupName("");
      setShowCreateGroup(false);
    }
  };

  const renderListingRow = (listing: Listing, indent: boolean = false) => {
    const isChecked = selectedListings.includes(listing.id);
    return (
      <button
        key={listing.id}
        type="button"
        onClick={() => toggleListing(listing.id)}
        aria-pressed={isChecked}
        className={cn(
          "px-sm py-base flex cursor-pointer items-center rounded-lg text-left",
          isChecked ? "bg-highlight-10 text-surface-60" : "bg-neutral-30 text-highlight-10",
          indent && "ml-md",
        )}
      >
        <span className="text-body truncate font-medium">{listing.name}</span>
      </button>
    );
  };

  return (
    <div className="p-sm">
      <div className="mb-base flex items-center justify-between">
        <h3
          className="text-body font-semibold tracking-wide uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          Listings
        </h3>
        <div className="gap-xs flex">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSelectAll}
            className="py-xs h-auto border-0 font-normal"
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClear}
            className="py-xs h-auto border-0 font-normal"
            disabled={selectedListings.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="gap-xs flex flex-col">
        {/* Parent listings with children. Children are always visible (no
            collapse). Indentation differentiates them visually. */}
        {parents.map((parent) => {
          const children = allListings.filter((l) => l.parentId === parent.id);
          return (
            <div key={parent.id} className="gap-xs flex flex-col">
              {renderListingRow(parent)}
              {children.map((child) => renderListingRow(child, true))}
            </div>
          );
        })}

        {/* Standalone listings */}
        {standalones.map((listing) => renderListingRow(listing))}

        {/* Custom groups */}
        {customGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] ?? false;
          const groupListings = allListings.filter((l) => group.listingIds.includes(l.id));
          return (
            <div key={group.id} className="gap-xs flex flex-col">
              <div className="gap-xs px-sm py-base bg-neutral-30 text-highlight-10 flex items-center rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} group ${group.name}`}
                  aria-expanded={isExpanded}
                  className="p-xs shrink-0"
                  data-no-elevate
                >
                  {isExpanded ? (
                    <ChevronDown size={13} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={13} aria-hidden="true" />
                  )}
                </button>
                <span className="text-body flex-1 truncate font-medium">{group.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingDeleteGroupId(group.id)}
                  aria-label={`Delete group ${group.name}`}
                  className="p-xs"
                  style={{ color: "var(--status-issues)" }}
                  data-no-elevate
                >
                  <X size={13} />
                </button>
              </div>
              {isExpanded && groupListings.map((l) => renderListingRow(l, true))}
            </div>
          );
        })}
      </div>

      {/* Create Group */}
      {showCreateGroup ? (
        <div className="mt-base gap-xs flex flex-col">
          <label htmlFor="listing-filter-new-group-name" className="sr-only">
            New group name
          </label>
          <input
            id="listing-filter-new-group-name"
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
              if (e.key === "Escape") setShowCreateGroup(false);
            }}
            placeholder="Group name"
            className="px-sm py-base text-body bg-neutral-30 text-highlight-10 rounded-lg"
            autoFocus
          />
          <div className="gap-xs flex">
            <Button
              type="button"
              onClick={handleCreateGroup}
              className="px-sm py-base h-auto flex-1 border-0 font-normal"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateGroup(false)}
              className="px-sm py-base h-auto flex-1 border-0 font-normal"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowCreateGroup(true)}
          className="mt-base px-sm py-base h-auto border-0 font-normal"
        >
          <Plus size={13} aria-hidden="true" />
          Create Group
        </Button>
      )}

      <ConfirmDialog
        open={!!pendingDeleteGroup}
        onOpenChange={(o) => !o && setPendingDeleteGroupId(null)}
        title="Delete custom group"
        description={
          pendingDeleteGroup
            ? `"${pendingDeleteGroup.name}" will be removed. The listings inside it stay - only the grouping is deleted.`
            : undefined
        }
        confirmLabel="Delete group"
        destructive
        onConfirm={() => {
          if (pendingDeleteGroupId) deleteCustomGroup(pendingDeleteGroupId);
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import { useListings } from "@/hooks/use-listings";
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
        className="flex cursor-pointer items-center rounded-lg px-sm py-base text-left"
        style={{
          backgroundColor: isChecked ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
          color: isChecked ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          marginLeft: indent ? "var(--space-md)" : undefined,
        }}
      >
        <span className="truncate text-body font-medium">{listing.name}</span>
      </button>
    );
  };

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <div className="mb-base flex items-center justify-between">
        <h3
          className="text-body font-semibold tracking-wide uppercase"
          style={{ color: "var(--brand-10)", opacity: 0.7 }}
        >
          Listings
        </h3>
        <div className="flex gap-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-lg px-base py-xs text-body"
            style={{
              backgroundColor: "var(--btn-inactive-bg)",
              color: "var(--btn-inactive-text)",
              opacity: allSelected ? 0.5 : 1,
            }}
            disabled={allSelected}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-base py-xs text-body"
            style={{
              backgroundColor: "var(--btn-inactive-bg)",
              color: "var(--btn-inactive-text)",
              opacity: selectedListings.length === 0 ? 0.5 : 1,
            }}
            disabled={selectedListings.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        {/* Parent listings with children */}
        {parents.map((parent) => {
          const children = allListings.filter((l) => l.parentId === parent.id);
          const isExpanded = expandedGroups[parent.id] ?? true;
          const parentChecked = selectedListings.includes(parent.id);
          return (
            <div key={parent.id} className="flex flex-col gap-xs">
              <div
                className="flex items-center rounded-lg"
                style={{
                  backgroundColor: parentChecked
                    ? "var(--btn-active-bg)"
                    : "var(--btn-inactive-bg)",
                  color: parentChecked ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(parent.id)}
                  className="flex shrink-0 items-center justify-center py-base"
                  style={{ width: "var(--space-lg)" }}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleListing(parent.id)}
                  aria-pressed={parentChecked}
                  className="flex flex-1 cursor-pointer items-center pr-sm py-base text-left"
                >
                  <span className="truncate text-body font-medium">{parent.name}</span>
                </button>
              </div>
              {isExpanded && children.map((child) => renderListingRow(child, true))}
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
            <div key={group.id} className="flex flex-col gap-xs">
              <div
                className="flex items-center gap-xs rounded-lg px-sm py-base"
                style={{
                  backgroundColor: "var(--btn-inactive-bg)",
                  color: "var(--btn-inactive-text)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="shrink-0 p-xs"
                >
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <span className="flex-1 truncate text-body font-medium">{group.name}</span>
                <button
                  type="button"
                  onClick={() => deleteCustomGroup(group.id)}
                  className="p-xs"
                  style={{ color: "var(--status-issues)" }}
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
        <div className="mt-base flex flex-col gap-xs">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
              if (e.key === "Escape") setShowCreateGroup(false);
            }}
            placeholder="Group name"
            className="rounded-lg px-sm py-base text-body"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: "var(--brand-10)",
            }}
            autoFocus
          />
          <div className="flex gap-xs">
            <button
              type="button"
              onClick={handleCreateGroup}
              className="flex-1 rounded-lg px-sm py-base text-body"
              style={{
                backgroundColor: "var(--btn-active-bg)",
                color: "var(--btn-active-text)",
              }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCreateGroup(false)}
              className="flex-1 rounded-lg px-sm py-base text-body"
              style={{
                backgroundColor: "var(--btn-inactive-bg)",
                color: "var(--btn-inactive-text)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="mt-base flex items-center gap-xs rounded-lg px-sm py-base text-body"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
          }}
        >
          <Plus size={13} />
          Create Group
        </button>
      )}
    </div>
  );
}

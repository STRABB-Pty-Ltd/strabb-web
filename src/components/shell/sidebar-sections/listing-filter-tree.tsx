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
        className="px-sm py-base flex cursor-pointer items-center rounded-lg text-left"
        style={{
          backgroundColor: isChecked ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
          color: isChecked ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          marginLeft: indent ? "var(--space-md)" : undefined,
        }}
      >
        <span className="text-body truncate font-medium">{listing.name}</span>
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
        <div className="gap-xs flex">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-base py-xs text-body rounded-lg"
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
            className="px-base py-xs text-body rounded-lg"
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
              <div
                className="gap-xs px-sm py-base flex items-center rounded-lg"
                style={{
                  backgroundColor: "var(--btn-inactive-bg)",
                  color: "var(--btn-inactive-text)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} group ${group.name}`}
                  aria-expanded={isExpanded}
                  className="p-xs shrink-0"
                  data-no-elevate
                >
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <span className="text-body flex-1 truncate font-medium">{group.name}</span>
                <button
                  type="button"
                  onClick={() => deleteCustomGroup(group.id)}
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
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
              if (e.key === "Escape") setShowCreateGroup(false);
            }}
            placeholder="Group name"
            className="px-sm py-base text-body rounded-lg"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: "var(--brand-10)",
            }}
            autoFocus
          />
          <div className="gap-xs flex">
            <button
              type="button"
              onClick={handleCreateGroup}
              className="px-sm py-base text-body flex-1 rounded-lg"
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
              className="px-sm py-base text-body flex-1 rounded-lg"
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
          className="mt-base gap-xs px-sm py-base text-body flex items-center rounded-lg"
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

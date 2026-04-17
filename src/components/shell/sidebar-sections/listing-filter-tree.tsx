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
      <label
        key={listing.id}
        className="flex cursor-pointer items-center gap-base rounded-lg px-md py-sm"
        style={{
          backgroundColor: isChecked ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
          color: isChecked ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          marginLeft: indent ? "var(--space-md)" : undefined,
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleListing(listing.id)}
          className="h-4 w-4"
          style={{ accentColor: "var(--brand-10)" }}
        />
        <span className="truncate text-subheading font-medium">{listing.name}</span>
      </label>
    );
  };

  return (
    <div style={{ padding: "var(--space-md)" }}>
      <div className="mb-2 flex items-center justify-between">
        <h3
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: "var(--brand-10)", opacity: 0.7 }}
        >
          Listings
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-lg px-2 py-0.5 text-xs"
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
            className="rounded-lg px-2 py-0.5 text-xs"
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

      <div className="flex flex-col gap-1">
        {/* Parent listings with children */}
        {parents.map((parent) => {
          const children = allListings.filter((l) => l.parentId === parent.id);
          const isExpanded = expandedGroups[parent.id] ?? true;
          const parentChecked = selectedListings.includes(parent.id);
          return (
            <div key={parent.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(parent.id)}
                  className="shrink-0 p-0.5"
                  style={{ color: "var(--brand-10)" }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <label
                  className="flex flex-1 cursor-pointer items-center gap-base rounded-lg px-md py-sm"
                  style={{
                    backgroundColor: parentChecked
                      ? "var(--btn-active-bg)"
                      : "var(--btn-inactive-bg)",
                    color: parentChecked ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={parentChecked}
                    onChange={() => toggleListing(parent.id)}
                    className="h-4 w-4"
                    style={{ accentColor: "var(--brand-10)" }}
                  />
                  <span className="truncate text-subheading font-medium">{parent.name}</span>
                </label>
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
            <div key={group.id} className="flex flex-col gap-1">
              <div
                className="flex items-center gap-1 rounded-lg px-md py-sm"
                style={{
                  backgroundColor: "var(--btn-inactive-bg)",
                  color: "var(--btn-inactive-text)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="shrink-0 p-0.5"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span className="flex-1 truncate text-subheading font-medium">{group.name}</span>
                <button
                  type="button"
                  onClick={() => deleteCustomGroup(group.id)}
                  className="p-0.5"
                  style={{ color: "var(--status-issues)" }}
                >
                  <X size={12} />
                </button>
              </div>
              {isExpanded && groupListings.map((l) => renderListingRow(l, true))}
            </div>
          );
        })}
      </div>

      {/* Create Group */}
      {showCreateGroup ? (
        <div className="mt-2 flex gap-1">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            placeholder="Group name"
            className="flex-1 rounded-lg px-3 py-1 text-sm"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: "var(--brand-10)",
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateGroup}
            className="rounded-lg px-3 py-1 text-sm"
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
            className="rounded-lg px-3 py-1 text-sm"
            style={{
              backgroundColor: "var(--btn-inactive-bg)",
              color: "var(--btn-inactive-text)",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="mt-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
          }}
        >
          <Plus size={12} />
          Create Group
        </button>
      )}
    </div>
  );
}

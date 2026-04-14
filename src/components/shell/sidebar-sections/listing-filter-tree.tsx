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
        className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50"
        style={indent ? { paddingLeft: "var(--space-lg)" } : undefined}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleListing(listing.id)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: listing.color }}
        />
        <span className="truncate text-sm text-gray-700">{listing.name}</span>
      </label>
    );
  };

  return (
    <div
      className="flex-1 overflow-y-auto border-b"
      style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Listings</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs hover:underline"
            style={{ color: "var(--strabb-secondary)" }}
            disabled={allSelected}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-400 hover:underline"
            disabled={selectedListings.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {/* Parent listings with children */}
        {parents.map((parent) => {
          const children = allListings.filter((l) => l.parentId === parent.id);
          const isExpanded = expandedGroups[parent.id] ?? true;
          return (
            <div key={parent.id}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(parent.id)}
                  className="shrink-0 p-0.5 text-gray-400"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedListings.includes(parent.id)}
                    onChange={() => toggleListing(parent.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: parent.color }}
                  />
                  <span className="truncate text-sm font-medium text-gray-700">
                    {parent.name}
                  </span>
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
            <div key={group.id}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="shrink-0 p-0.5 text-gray-400"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="flex-1 truncate text-sm font-medium text-gray-600">
                  {group.name}
                </span>
                <button
                  type="button"
                  onClick={() => deleteCustomGroup(group.id)}
                  className="p-0.5 text-gray-400 hover:text-red-500"
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
            className="flex-1 rounded border px-2 py-1 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateGroup}
            className="rounded px-2 py-1 text-sm text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowCreateGroup(false)}
            className="rounded px-2 py-1 text-sm text-gray-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="mt-2 flex items-center gap-1 text-xs hover:underline"
          style={{ color: "var(--strabb-secondary)" }}
        >
          <Plus size={12} />
          Create Group
        </button>
      )}
    </div>
  );
}

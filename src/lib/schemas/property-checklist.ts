/**
 * A property's default cleaning checklist (Settings > Listings > General). A
 * property owns a flat, ordered list of items - an independent copy that can be
 * seeded from a checklist template and then edited separately. Types are
 * hand-written to match the strabb-api contract after keysToCamel.
 *
 * API (under the /be proxy, camelCase in/out):
 *   GET    /properties/{id}/checklist                 -> { data: item[] }
 *   POST   /properties/{id}/checklist/items           -> { data: item }
 *   PUT    /properties/{id}/checklist/items/{itemId}  -> { data: item }
 *   DELETE /properties/{id}/checklist/items/{itemId}  -> 204
 *   PUT    /properties/{id}/checklist/reorder         -> { data: item[] }
 *   POST   /properties/{id}/checklist/apply-template  -> { data: item[] }
 */

/** A property checklist item (after keysToCamel). Same shape as a template item;
 * satisfies the shared ChecklistItemsEditor's ChecklistEditorItem. */
export interface PropertyChecklistItem {
  id: string;
  label: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

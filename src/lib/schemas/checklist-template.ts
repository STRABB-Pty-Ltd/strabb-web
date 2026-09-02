import { z } from "zod";

/**
 * Cleaning checklist templates (Settings > Cleaning). A template is a named
 * record owning an ordered list of items. Types are hand-written to match the
 * strabb-api contract after keysToCamel; there is no codegen in this repo.
 *
 * API (all under the /be proxy, camelCase in/out):
 *   GET    /checklist-templates                     -> { data: [], meta }
 *   POST   /checklist-templates                     -> { data: template }
 *   PUT    /checklist-templates/{id}                -> { data: template }  (rename)
 *   DELETE /checklist-templates/{id}                -> 204
 *   POST   /checklist-templates/{id}/items          -> { data: item }
 *   PUT    /checklist-templates/{id}/items/{itemId} -> { data: item }
 *   DELETE /checklist-templates/{id}/items/{itemId} -> 204
 *   PUT    /checklist-templates/{id}/reorder        -> { data: template }
 */

/** A checklist item as returned by the API (after keysToCamel). */
export interface ChecklistItem {
  id: string;
  label: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** A checklist template with its ordered items (after keysToCamel). */
export interface ChecklistTemplate {
  id: string;
  name: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

/** Template name form (create + rename both validate a non-empty name). */
export const checklistTemplateNameSchema = z.object({
  name: z.string().trim().min(1, "Enter a template name").max(255),
});
export type ChecklistTemplateNameInput = z.infer<typeof checklistTemplateNameSchema>;

/** Item label form (add + rename an item). */
export const checklistItemLabelSchema = z.object({
  label: z.string().trim().min(1, "Enter a checklist item").max(255),
});
export type ChecklistItemLabelInput = z.infer<typeof checklistItemLabelSchema>;

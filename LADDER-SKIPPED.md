# Ladder sweep — skipped values

Items where snapping to ladder would touch a computed / third-party expression, or where intent was unclear.

## Computed expressions (skipped per ambiguity rule)

- `src/components/ui/button.tsx` — `rounded-[min(var(--radius-md),10px)]` and `rounded-[min(var(--radius-md),12px)]` on button size variants `xs`, `sm`, `icon-xs`, `icon-sm`. The `10px`/`12px` are caps inside `min()` that never bind (--radius-md = 5px), so replacing with 13px would be harmless but the expression shape is shadcn-internal. Left as-is.

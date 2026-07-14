import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Phase I guard: hand-rolled primitives drift the design system.
    // Warn-level on purpose - raw <button> IS still sanctioned where no
    // primitive fits (selected-state sidebar rows, segmented controls,
    // whole-card targets) and where buttonVariants/chipVariants are
    // composed onto the element (the documented interactive-chip
    // pattern). The warning is the reviewer prompt, not a CI gate.
    files: ["src/**/*.tsx"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            "Hand-rolled <button>: prefer ui/Button, or compose buttonVariants/chipVariants onto the element (see src/components/ui/chip.tsx). Raw is fine only where no primitive fits.",
        },
      ],
    },
  },
];

export default eslintConfig;

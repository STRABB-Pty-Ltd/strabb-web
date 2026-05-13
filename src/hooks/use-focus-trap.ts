import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
  trap?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

// Move focus into the container on open, restore to the previously focused
// element on close, and (when trap=true) wrap Tab/Shift+Tab inside the
// container. Pass trap=false for side drawers where the rails should stay
// reachable via keyboard.
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  { active, onEscape, trap = true, initialFocusRef }: UseFocusTrapOptions,
) {
  const onEscapeRef = useRef(onEscape);
  const initialFocusRefRef = useRef(initialFocusRef);

  useEffect(() => {
    onEscapeRef.current = onEscape;
    initialFocusRefRef.current = initialFocusRef;
  });

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement as HTMLElement | null;

    const getFocusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

    const initial = initialFocusRefRef.current?.current ?? getFocusables()[0] ?? container;
    initial.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscapeRef.current) {
        onEscapeRef.current();
        return;
      }
      if (!trap || e.key !== "Tab") return;
      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !container.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !container.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [active, containerRef, trap]);
}

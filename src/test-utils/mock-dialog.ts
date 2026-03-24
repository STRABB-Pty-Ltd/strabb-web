/**
 * Shared mock for @base-ui/react/dialog that renders inline in jsdom.
 * Content is only visible when the dialog is open.
 */
import React from "react";

const DialogOpenContext = React.createContext<{
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}>({ isOpen: false, setOpen: () => {} });

function MockRoot({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false);
  const isOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  return React.createElement(
    DialogOpenContext.Provider,
    { value: { isOpen, setOpen } },
    React.createElement("div", { "data-testid": "dialog-root" }, children),
  );
}

function MockTrigger({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  const { isOpen, setOpen } = React.useContext(DialogOpenContext);
  return React.createElement(
    "div",
    {
      ...props,
      onClick: () => setOpen(!isOpen),
    },
    children,
  );
}

function MockPortal({ children }: { children: React.ReactNode }) {
  const { isOpen } = React.useContext(DialogOpenContext);
  if (!isOpen) return null;
  return React.createElement(React.Fragment, null, children);
}

function MockBackdrop() {
  return null;
}

function MockPopup({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) {
  return React.createElement("div", props, children);
}

function MockClose({
  children,
  render,
  ...rest
}: {
  children?: React.ReactNode;
  render?: unknown;
  [key: string]: unknown;
}) {
  void render;
  return React.createElement("button", rest, children);
}

function MockTitle({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
  return React.createElement("h2", props, children);
}

function MockDescription({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return React.createElement("p", props, children);
}

export const mockDialogModule = {
  Dialog: {
    Root: MockRoot,
    Trigger: MockTrigger,
    Portal: MockPortal,
    Backdrop: MockBackdrop,
    Popup: MockPopup,
    Close: MockClose,
    Title: MockTitle,
    Description: MockDescription,
  },
};

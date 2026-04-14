"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

import { Canvas } from "./canvas";
import { ContextualSidebar } from "./contextual-sidebar";
import { SubmenuBar } from "./submenu-bar";
import { TopNav } from "./top-nav";

export function NewAppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <SubmenuBar />
      <div className="flex flex-1 overflow-hidden">
        <ContextualSidebar />
        <div
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
          style={{
            marginLeft: sidebarOpen ? 0 : `calc(-1 * var(--sidebar-width))`,
          }}
        >
          {/* Desktop sidebar toggle */}
          <div className="hidden shrink-0 border-b px-2 py-1 lg:block">
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          </div>
          <Canvas>{children}</Canvas>
        </div>
      </div>
    </div>
  );
}

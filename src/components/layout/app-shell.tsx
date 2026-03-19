"use client";

import { useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r lg:flex">
        <div className="flex h-14 items-center px-4 font-bold">STRABB</div>
        <Separator />
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <div className="flex h-14 items-center px-4 font-bold">STRABB</div>
          <Separator />
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

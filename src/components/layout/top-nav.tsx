"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountMenu } from "./account-menu";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <AccountMenu />
    </header>
  );
}

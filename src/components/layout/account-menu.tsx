"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu() {
  const { data: session } = useSession();

  const initials = session?.user?.email ? session.user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="hover:bg-accent relative flex h-8 w-8 items-center justify-center rounded-full"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Account</p>
              <p className="text-muted-foreground text-xs" data-testid="user-email">
                {session?.user?.email ?? "Unknown"}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

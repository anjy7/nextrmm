"use client";

import Link from "next/link";
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserAvatar } from "~/components/user-avatar";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/react";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email" | "id">;
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  const sessions = api.session.getByUser.useQuery({
    userId: user.id,
  });
  console.log("}}}}}}}}]", sessions.data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          user={{ name: user.name || null, image: user.image || null }}
          className="h-8 w-8"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Dialog>
            <DialogTrigger className="ml-2 text-sm">
              Manage Account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Security</DialogTitle>
                <DialogDescription>
                  Manage your security preferences.
                </DialogDescription>
                {sessions?.data?.map((x) => <div key={x.id}>{x.browser}</div>)}
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            signOut({
              callbackUrl: `${window.location.origin}/login`,
            });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

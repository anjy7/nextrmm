"use client";

import { User } from "next-auth";
import { ActiveUserSessions } from "~/components/active-user-sessions";
import { api } from "~/trpc/react";

interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  createdAt: Date;
  lastActivity: Date;
  ip: string;
  country: string;
  deviceType: string;
  city: string;
  os: string;
  browser: string;
}

interface ActiveUserSessionsProps {
  session: Session;
}

export function ActiveDevices({ session }: ActiveUserSessionsProps) {
  const allSessions = api.session.getByUser.useQuery({
    userId: session.userId,
  });

  const deleteUserMutation = api.session.deleteBySessionToken.useMutation();
  const handleSignOut = async (sessionToken: string) => {
    try {
      await deleteUserMutation.mutateAsync({
        sessionToken,
      });
      allSessions.refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const sessionList = allSessions?.data || [];

  return (
    <>
      {sessionList.map((x) => (
        <div key={x.id}>
          <ActiveUserSessions
            session={x}
            currentSession={session}
            handleSignOut={handleSignOut}
          />
        </div>
      ))}
    </>
  );
}

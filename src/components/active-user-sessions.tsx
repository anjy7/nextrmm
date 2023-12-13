"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";

interface Session {
  id: string;
  userId: string;
  deviceId: string;
  sessionId: string;
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
  currentSession: Session;
  handleSignOut: (sessionId: string) => Promise<void>;
}

export function ActiveUserSessions({
  session,
  currentSession,
  handleSignOut,
}: ActiveUserSessionsProps) {
  return (
    <div className="mt-2  flex items-center justify-between gap-16 rounded-lg border border-primary p-2">
      <div className="mt-2  flex items-center gap-16 p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="569.4 86.3 83.6 48.2"
          className="h-20 w-20"
        >
          <path
            fill="var(--cl-chassis-back, black)"
            d="M577 89.8c0-1.4.2-2 .6-2.6.5-.5 1.2-.9 2.8-.9h61.7c1.4 0 2 .3 2.5.8s.7 1.2.7 2.7v41c0 1.4-.2 2-.5 2.4a2.7 2.7 0 0 1-2.2 1.1h-63c-.8 0-1.6-.3-2-1-.4-.4-.6-1-.6-2.5v-41Z"
          ></path>
          <path
            fill="var(--cl-chassis-screen, #323232)"
            d="M578.4 132.9h65.5c.3 0 .6-.2.8-.4.2-.2.2-.5.2-1.4V89.8c0-1.2-.1-2-.6-2.4-.5-.5-1-.7-2.2-.7h-61.7c-1.3 0-2 .3-2.5.8-.4.4-.5 1-.5 2.3v41.3c0 .9 0 1.2.2 1.4.2.2.5.4.8.4Z"
          ></path>
          <path
            fill-rule="evenodd"
            stroke="var(--cl-chassis-back1, 'gold')"
            stroke-width="0.3"
            d="M611.2 88.5a.3.3 0 1 0 0-.5.3.3 0 1 0 0 .5Z"
            clip-rule="evenodd"
          ></path>
          <path
            fill="var(--cl-chassis-bottom, #191919)"
            fill-rule="evenodd"
            d="M569.4 133.3v-.5H653v.5s-1.9.6-4 .8c-1.4.1-3.7.4-8.9.4h-57.4c-4.5 0-8.3-.3-10-.5-1.7-.2-3.3-.7-3.3-.7Z"
            clip-rule="evenodd"
          ></path>
          <path
            fill="var(--cl-screen, #111111)"
            fill-rule="evenodd"
            d="M579.7 89.5h63v39.4h-63V89.5Z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <div>
          <div className="font-medium">{session.os}</div>
          <div className="text-slate-500">{session.browser}</div>
          <div className="text-slate-500">IP</div>
          <div className="text-slate-500">
            {session.city},{session.country}
          </div>
          <div className="text-slate-500">Last activity: </div>
        </div>
      </div>
      {currentSession.deviceId == session.deviceId ? (
        <div className="mr-6 rounded-md bg-primary p-2 font-medium text-white">
          Current Session
        </div>
      ) : (
        <Button
          variant="destructive"
          className="mr-6"
          onClick={() => handleSignOut(session.sessionId)}
        >
          Sign out
        </Button>
      )}
    </div>
  );
}

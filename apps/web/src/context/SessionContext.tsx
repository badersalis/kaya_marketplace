"use client";

import { createContext, useContext } from "react";
import { SessionUser } from "@/lib/types";

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return user;
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../hooks/use-user";
import { setMonitoringUser, setMonitoringWorkspace } from "../lib/monitoring";

/**
 * Keeps the error-monitoring context in sync with the signed-in user and the
 * workspace they're currently viewing, so every captured error is tagged with
 * who hit it and where. Renders nothing.
 */
export function MonitoringIdentity() {
  const { user } = useUser();
  const [location] = useLocation();

  const { data: workspaces } = useQuery<Array<{ slug: string }>>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });

  useEffect(() => {
    setMonitoringUser(user ? { id: user.id } : null);
  }, [user]);

  useEffect(() => {
    if (!user || !workspaces?.length) {
      setMonitoringWorkspace(null);
      return;
    }
    const currentSlug = location.split("/")[1] || workspaces[0]?.slug;
    const valid = workspaces.find((w) => w.slug === currentSlug);
    setMonitoringWorkspace(valid?.slug ?? workspaces[0]?.slug ?? null);
  }, [user, workspaces, location]);

  return null;
}

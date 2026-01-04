import { Link, useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { useWorkspacePermissions } from "../hooks/use-permissions";
import { Home, Users, List, Briefcase, User } from "lucide-react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useUser();

  const { data: workspaces } = useQuery<Array<{ slug: string }>>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });

  const currentWorkspaceSlug = location.split('/')[1] || workspaces?.[0]?.slug || "";
  const validWorkspace = workspaces?.find((w) => w.slug === currentWorkspaceSlug);
  const workspaceSlug = validWorkspace?.slug || workspaces?.[0]?.slug || "";

  const permissions = useWorkspacePermissions(workspaceSlug);

  if (!user || !workspaceSlug) return null;

  const navItems = [
    {
      label: "Home",
      icon: Home,
      path: `/${workspaceSlug}/home`,
      show: true,
    },
    {
      label: "Directory",
      icon: Users,
      path: `/${workspaceSlug}/directory`,
      show: true,
    },
    {
      label: "Lists",
      icon: List,
      path: `/${workspaceSlug}/lists`,
      show: permissions.canViewLists,
    },
    {
      label: "Hiring",
      icon: Briefcase,
      path: `/${workspaceSlug}/hiring`,
      show: permissions.canAccessHiring,
    },
    {
      label: "Profile",
      icon: User,
      path: "/profile",
      show: true,
    },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around min-h-[64px]">
        {visibleItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/profile" && location.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[64px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-xs mt-1 ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

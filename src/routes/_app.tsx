import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import  Sidebar  from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    return;
  },
  component: AppLayout,
});

function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


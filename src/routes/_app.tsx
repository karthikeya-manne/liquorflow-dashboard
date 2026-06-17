import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import  Sidebar  from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    if (!isFirebaseConfigured() || typeof window === "undefined") return;
    if (context.queryClient.getQueryData(["auth", "isLoading"])) return;
    if (!context.queryClient.getQueryData(["auth", "isAuthenticated"])) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { isLoading } = useAuth();

  if (isFirebaseConfigured() && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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

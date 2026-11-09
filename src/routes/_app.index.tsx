import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import PageLoader from "@/components/PageLoader";

export const Route = createFileRoute("/_app/")({
  component: HomeRedirect,
});

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      void navigate({ to: "/login" });
      return;
    }

    const shopId = localStorage.getItem("selectedShopId");
    void navigate({
      to: shopId ? "/dashboard" : "/select-shop",
      replace: true,
    });
  }, [user, isLoading, navigate]);

  return <PageLoader />;
}

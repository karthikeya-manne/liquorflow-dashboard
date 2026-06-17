import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Package2, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-products";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { products } = useProducts();
  const low = products.filter((p) => p.stock <= p.threshold);
  const critical = low.filter((p) => p.stock <= p.threshold / 2);

  return (
    <>
      <AppHeader title="Low Stock Alerts" subtitle="Products that need reordering soon." />
      <div className="p-4 md:p-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-xs text-destructive font-medium">Critical</p>
            <p className="mt-1 text-2xl font-semibold">{critical.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Below half threshold</p>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <p className="text-xs text-warning font-medium">Low Stock</p>
            <p className="mt-1 text-2xl font-semibold">{low.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Below reorder point</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium">Auto-reorder</p>
            <p className="mt-1 text-2xl font-semibold">Off</p>
            <p className="text-xs text-muted-foreground mt-1">Configure in settings</p>
          </div>
        </div>

        <div className="space-y-3">
          {low.map((p) => {
            const isCritical = p.stock <= p.threshold / 2;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                    isCritical ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                  }`}
                >
                  {isCritical ? <AlertTriangle className="h-5 w-5" /> : <Package2 className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{p.name}</p>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wide">{p.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU {p.sku} · Supplier: {p.supplier}
                  </p>
                </div>
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">In Stock</p>
                    <p className={`text-lg font-semibold ${isCritical ? "text-destructive" : "text-warning"}`}>
                      {p.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Threshold</p>
                    <p className="text-lg font-semibold text-muted-foreground">{p.threshold}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Reorder
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { products, salesData, recentOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

const stats = [
  { label: "Revenue (7d)", value: "$48,820", delta: "+12.4%", icon: DollarSign, positive: true },
  { label: "Orders (7d)", value: "414", delta: "+8.1%", icon: ShoppingCart, positive: true },
  { label: "SKUs Tracked", value: "1,284", delta: "+24", icon: Package, positive: true },
  { label: "Avg. Margin", value: "42.6%", delta: "-1.2%", icon: TrendingUp, positive: false },
];

function DashboardPage() {
  const lowStock = products.filter((p) => p.stock <= p.threshold);

  return (
    <>
      <AppHeader title="Overview" subtitle="Welcome back — here's how your bar is moving." />
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4 md:p-5 relative overflow-hidden"
              style={{ background: "var(--gradient-card)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <span className={s.positive ? "text-success" : "text-destructive"}>{s.delta}</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + alerts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Sales Performance</h3>
                <p className="text-xs text-muted-foreground">Daily revenue, last 7 days</p>
              </div>
              <Link
                to="/analytics"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                View analytics <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 70)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 70)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 60)" vertical={false} />
                  <XAxis dataKey="day" stroke="oklch(0.68 0.02 70)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 70)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.018 60)",
                      border: "1px solid oklch(0.28 0.02 60)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="oklch(0.78 0.16 70)" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Low Stock
              </h3>
              <Link to="/alerts" className="text-xs text-primary hover:underline">All</Link>
            </div>
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.sku}</p>
                  </div>
                  <span className="rounded-md bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive whitespace-nowrap">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold">Recent Orders</h3>
              <p className="text-xs text-muted-foreground">Latest activity from your POS</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Order</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Items</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-5 py-3 font-mono text-xs">{o.id}</td>
                    <td className="px-5 py-3">{o.customer}</td>
                    <td className="px-5 py-3 text-muted-foreground">{o.items}</td>
                    <td className="px-5 py-3 font-medium">${o.total.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          o.status === "Paid"
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

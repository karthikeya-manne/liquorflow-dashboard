import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold leading-tight tracking-tight md:text-lg">{title}</h1>
        {subtitle && <p className="hidden text-xs text-muted-foreground md:block">{subtitle}</p>}
      </div>
      <div className="relative hidden md:block w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search inventory..." className="pl-9 bg-card border-border h-9" />
      </div>
      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      </button>
    </header>
  );
}

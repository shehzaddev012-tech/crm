"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { CommandMenu } from "@/components/layout/command-menu";
import { Logo, MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { Kbd, Spinner } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function AlertBell() {
  const { can } = useAuth();
  const { data } = useQuery({
    queryKey: ["alerts", "summary"],
    queryFn: () => api.get<{ open: number; critical: number }>("/alerts/summary"),
    enabled: can("tasks"),
    refetchInterval: 60_000,
    retry: false,
  });
  const count = data?.open ?? 0;
  return (
    <Link href="/tasks?tab=alerts" className="relative rounded-md p-1.5 text-ink-2 hover:bg-muted hover:text-ink" aria-label="Alerts">
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-white tabular">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(window.localStorage.getItem("sidebar:collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        window.localStorage.setItem("sidebar:collapsed", c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });

  if (!mounted || loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <MobileSidebar open={navOpen} onOpenChange={setNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur sm:gap-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              onClick={() => setNavOpen(true)}
              className="-ml-1 shrink-0 rounded-md p-2 text-ink-2 hover:bg-muted hover:text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/" className="shrink-0 lg:hidden" aria-label="EquitiFy home">
              <Logo compact />
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-full max-w-md items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-sm text-ink-3 shadow-card transition-colors hover:border-line-strong"
            >
              <Search className="size-4 shrink-0" />
              <span className="flex-1 truncate text-left">Search records…</span>
              <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <AlertBell />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-[1480px]">{children}</div>
        </main>
      </div>
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

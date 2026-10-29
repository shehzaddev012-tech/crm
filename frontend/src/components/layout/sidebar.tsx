"use client";

import * as D from "@radix-ui/react-dialog";
import { ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Avatar, Tooltip } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-md bg-ink text-[11px] font-bold tracking-tight text-white">EQ</span>
      {!compact && <span className="text-[15px] font-semibold tracking-tight text-ink">EquitiFy</span>}
    </div>
  );
}

/** Navigation + account menu, shared by the desktop sidebar and the mobile drawer. */
function SidebarBody({
  collapsed,
  onToggle,
  onClose,
}: {
  collapsed: boolean;
  /** Desktop only: collapse/expand the rail. */
  onToggle?: () => void;
  /** Mobile only: close the drawer. */
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, can, signOut } = useAuth();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className={cn("flex h-12 shrink-0 items-center border-b border-line", collapsed ? "justify-center px-0" : "justify-between px-3")}>
        <Link href="/" onClick={onClose}>
          <Logo compact={collapsed} />
        </Link>
        {onToggle && !collapsed && (
          <button onClick={onToggle} className="rounded p-1 text-ink-3 hover:bg-muted hover:text-ink" aria-label="Collapse sidebar">
            <PanelLeftClose className="size-4" />
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="-mr-1 rounded p-2 text-ink-3 hover:bg-muted hover:text-ink" aria-label="Close menu">
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 scrollbar-thin">
        {onToggle && collapsed && (
          <button onClick={onToggle} className="mb-2 flex h-8 w-full items-center justify-center rounded-md text-ink-3 hover:bg-muted hover:text-ink" aria-label="Expand sidebar">
            <PanelLeftOpen className="size-4" />
          </button>
        )}
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.module || can(i.module));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              {!collapsed && <p className="mb-1 px-2 text-2xs font-medium uppercase tracking-wider text-ink-3">{group.label}</p>}
              <ul className="space-y-px">
                {items.map((item) => {
                  const active = isActive(item.href);
                  const link = (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        // Taller tap targets in the touch drawer, compact on desktop.
                        "flex items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
                        onClose ? "h-10" : "h-8",
                        collapsed && "justify-center px-0",
                        active ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-2 hover:bg-muted hover:text-ink",
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", active ? "text-ink" : "text-ink-3")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                  return <li key={item.href}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>;
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Menu>
          <MenuTrigger asChild>
            <button className={cn("flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-muted", collapsed && "justify-center")}>
              <Avatar name={user?.full_name} size={26} />
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{user?.full_name}</p>
                    <p className="truncate text-2xs text-ink-3">{user?.role.name}</p>
                  </div>
                  <ChevronsUpDown className="size-3.5 text-ink-3" />
                </>
              )}
            </button>
          </MenuTrigger>
          <MenuContent align="start" width={220}>
            <MenuLabel>{user?.email}</MenuLabel>
            <MenuItem icon={<UserRound />} disabled>
              {user?.job_title ?? user?.role.name}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<LogOut />} onSelect={() => void signOut()}>
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </>
  );
}

/** Persistent sidebar, desktop (lg and up) only. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-subtle/70 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[56px]" : "w-[232px]",
      )}
    >
      <SidebarBody collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}

/** Off-canvas navigation for phones and tablets (below lg). Closes on navigation, Esc and backdrop tap. */
export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();

  useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/30 animate-fade-in lg:hidden" />
        <D.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-line bg-canvas shadow-sheet focus:outline-none lg:hidden"
        >
          <D.Title className="sr-only">Navigation</D.Title>
          <SidebarBody collapsed={false} onClose={() => onOpenChange(false)} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

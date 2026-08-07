"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";
import {
  LayoutDashboard, Users, Clock, Key, History, Webhook, Terminal, Settings, LogOut, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const menus: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Data User", href: "/user", icon: Users },
  { label: "Absensi", href: "/absensi", icon: Clock },
  { label: "Data PIN", href: "/pin", icon: Key },
  { label: "Riwayat API", href: "/api-logs", icon: History },
  { label: "Riwayat Webhook", href: "/webhook-logs", icon: Webhook },
  { label: "Riwayat Command", href: "/command-logs", icon: Terminal },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

function subscribeSidebar(callback: () => void) {
  window.addEventListener("sidebar-toggle", callback);
  return () => window.removeEventListener("sidebar-toggle", callback);
}

function getSidebarSnapshot() {
  return localStorage.getItem("sidebar-collapsed") === "true";
}

function getServerSnapshot() {
  return false;
}

export default function Sidebar({ cloudId }: { cloudId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getServerSnapshot);

  const toggleCollapse = () => {
    const next = !collapsed;
    localStorage.setItem("sidebar-collapsed", String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <aside
      className={cn(
        "h-screen fixed left-0 top-0 border-r border-white/[0.06] bg-[rgba(22,22,30,0.88)] backdrop-blur-xl flex flex-col py-6 z-[60] transition-all duration-300",
        collapsed ? "w-[68px] px-2 items-center" : "w-[200px] px-3"
      )}
    >
      <div className={cn("mb-8", collapsed ? "px-0 text-center" : "px-2")}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-[#1976D2]/15 flex items-center justify-center text-sm font-bold text-[#1976D2] mx-auto">
            R
          </div>
        ) : (
          <>
            <h1 className="text-sm font-bold text-white tracking-tight">Run API Quick</h1>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">Manage API</p>
          </>
        )}
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto w-full", collapsed && "flex flex-col items-center")}>
        {menus.map((menu) => {
          const isActive = menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href);
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}
              title={collapsed ? menu.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-[13px] transition-all duration-200 relative group",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                isActive ? "text-[#1976D2] font-medium bg-[#1976D2]/[0.08]"
                         : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{menu.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[70]">
                  {menu.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {cloudId && !collapsed && (
        <div className="mb-4 mx-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] w-full">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-gray-500 truncate">{cloudId}</span>
          </div>
        </div>
      )}

      <button
        onClick={toggleCollapse}
        className={cn(
          "flex items-center rounded-lg text-[13px] text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 transition-all duration-200 mb-2",
          collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 w-full"
        )}
        title={collapsed ? "Perlebar sidebar" : "Perkecil sidebar"}
      >
        {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        {!collapsed && <span>Perkecil</span>}
      </button>

      <button
        onClick={handleLogout}
        className={cn(
          "flex items-center rounded-lg text-[13px] text-gray-500 hover:bg-red-500/[0.06] hover:text-red-400 transition-all duration-200 border-t border-white/[0.04] pt-4 mt-2",
          collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 w-full"
        )}
        title={collapsed ? "Logout" : undefined}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Clock, Key, History, Webhook, Terminal, Settings, LogOut,
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

export default function Sidebar({ cloudId }: { cloudId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <aside className="w-[200px] h-screen fixed left-0 top-0 border-r border-white/[0.06] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl flex flex-col py-6 px-3 z-[60]">
      <div className="mb-8 px-2">
          <h1 className="text-sm font-bold text-white tracking-tight">Run API Quick</h1>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">Manage API</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {menus.map((menu) => {
          const isActive = menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href);
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
                isActive ? "text-[#1976D2] font-medium bg-[#1976D2]/[0.08]"
                         : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
              )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </nav>
      {cloudId && (
        <div className="mb-4 mx-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-gray-500 truncate">{cloudId}</span>
          </div>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-red-500/[0.06] hover:text-red-400 transition-all duration-200 border-t border-white/[0.04] pt-4 mt-2"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Logout</span>
      </button>
    </aside>
  );
}

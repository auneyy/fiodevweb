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
    <aside className="w-[200px] h-screen fixed left-0 top-0 border-r border-white/10 bg-[rgba(10,10,15,0.9)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col py-6 px-3 z-[60]">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1976D2] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
            <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
            <path d="M6.62 21.61c.12-.6.43-2.3.5-3.02" />
            <path d="M10.94 16.3c.36-.62.63-1.64.72-2.32" />
            <path d="M17.68 14.18c.52-.94.75-2.06.75-3.18 0-2.12-1.34-3.75-3-3.75s-3 1.63-3 3.75c0 .75.15 1.45.42 2.07" />
            <path d="M12 22a8 8 0 0 0 8-8" />
            <path d="M12 22a8 8 0 0 1-8-8" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white tracking-tight truncate">Run API Quick</h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">Manage API</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {menus.map((menu) => {
          const isActive = menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href);
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 border-r-2 border-transparent",
                isActive ? "text-[#1976D2] font-semibold border-r-[#1976D2] bg-[rgba(25,118,210,0.1)]"
                         : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}>
              <Icon className="w-5 h-5 shrink-0" />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </nav>
      {cloudId && (
        <div className="mb-4 mx-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400 truncate">{cloudId}</span>
          </div>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 border-t border-white/5 pt-4 mt-2"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span>Logout</span>
      </button>
    </aside>
  );
}

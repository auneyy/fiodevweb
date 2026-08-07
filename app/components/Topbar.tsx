"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const pathname = usePathname();
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="h-[64px] fixed top-0 left-[68px] right-0 z-40 border-b border-white/[0.06] bg-[rgba(22,22,30,0.88)] backdrop-blur-xl flex justify-between items-center px-6 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="h-3.5 w-[1px] bg-white/10" />
        <p className="text-xs text-gray-500">{dateStr}</p>
      </div>
      <div className="flex items-center gap-4 pointer-events-auto">
        <button className="text-gray-500 hover:text-gray-400 transition-colors duration-300">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-gray-400">
          A
        </div>
      </div>
    </header>
  );
}

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
    <header className="h-[64px] fixed top-0 right-0 left-[200px] z-50 border-b border-white/[0.06] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl flex justify-between items-center px-6 w-full">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="h-3.5 w-[1px] bg-white/10" />
        <p className="text-xs text-gray-500">{dateStr}</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-[#1976D2] transition-colors duration-300">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-[#1976D2]/15 flex items-center justify-center text-[11px] font-semibold text-[#1976D2]">
          A
        </div>
      </div>
    </header>
  );
}

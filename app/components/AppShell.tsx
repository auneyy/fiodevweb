"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login" || pathname === "/register";
  const sidebarCollapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getServerSnapshot);

  if (isAuth) {
    return <>{children}</>;
  }

  const sidebarWidth = sidebarCollapsed ? 68 : 200;

  return (
    <>
      <Sidebar />
      <Topbar title="Run API Quick" sidebarCollapsed={sidebarCollapsed} />
      <main
        className="pt-[64px] min-h-screen overflow-y-auto scroll-smooth transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">{children}</div>
      </main>
    </>
  );
}

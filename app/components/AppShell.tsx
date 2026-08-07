"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";

  if (isAuth || isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Topbar title="Run API Quick" />
      <main className="ml-[68px] pt-[64px] min-h-screen overflow-y-auto scroll-smooth">
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">{children}</div>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAQ - Run API Quick",
  description: "FingerSpot Attendance Manager Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0A0A0F] text-gray-200 font-[family-name:var(--font-inter)]">
        <Sidebar />
        <Topbar title="Run API Quick" />
        <main className="ml-[200px] pt-[64px] min-h-screen">
          <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}

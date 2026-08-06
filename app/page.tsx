"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "./components/GlassCard";
import { formatDate, formatVerifyType, formatStatusScan } from "@/lib/utils";
import {
  Users, Clock, Fingerprint, Wifi, ArrowRight, Loader2,
} from "lucide-react";
import Link from "next/link";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface RecentAttendance {
  id: number;
  pin: string;
  name: string;
  scan_time: string;
  verify: number;
  status_scan: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Total User", value: "-", icon: Users, color: "text-[#1976D2]" },
    { label: "Absensi Hari Ini", value: "-", icon: Clock, color: "text-emerald-500" },
    { label: "Total PIN", value: "-", icon: Fingerprint, color: "text-purple-500" },
    { label: "Status Mesin", value: "-", icon: Wifi, color: "text-blue-400" },
  ]);
  const [recent, setRecent] = useState<RecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["cloud_id"]);

        const cloudId = settings?.find((s) => s.key === "cloud_id")?.value || "";

        const [usersCount, attCount, pinsCount] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }).eq("cloud_id", cloudId),
          supabase.from("attendance_logs").select("id", { count: "exact", head: true })
            .eq("cloud_id", cloudId)
            .gte("scan_time", new Date().toISOString().split("T")[0]),
          supabase.from("device_pins").select("id", { count: "exact", head: true }).eq("cloud_id", cloudId),
        ]);

        setStats([
          { label: "Total User", value: String(usersCount.count ?? 0), icon: Users, color: "text-[#1976D2]" },
          { label: "Absensi Hari Ini", value: String(attCount.count ?? 0), icon: Clock, color: "text-emerald-500" },
          { label: "Total PIN", value: String(pinsCount.count ?? 0), icon: Fingerprint, color: "text-purple-500" },
          { label: "Status Mesin", value: cloudId || "Belum Diatur", icon: Wifi, color: "text-blue-400" },
        ]);

        const { data: recentData } = await supabase
          .from("attendance_logs")
          .select("id, pin, scan_time, verify, status_scan")
          .eq("cloud_id", cloudId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentData && recentData.length > 0) {
          const pins = recentData.map((r) => r.pin);
          const { data: usersData } = await supabase
            .from("users")
            .select("pin, name")
            .eq("cloud_id", cloudId)
            .in("pin", pins);

          const userMap = new Map(usersData?.map((u) => [u.pin, u.name]) || []);
          setRecent(
            recentData.map((r) => ({
              ...r,
              name: userMap.get(r.pin) || "-",
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-8 w-8 bg-white/10 rounded-lg" />
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            </GlassCard>
          ))}
        </div>
        <GlassCard className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-white/10 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded" />
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.label} className="p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {card.label === "Status Mesin" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-400 uppercase">Online</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{card.value}</h3>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/user" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-[#1976D2]/5 group transition-all duration-300">
          <div className="w-16 h-16 rounded-2xl bg-[#1976D2]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Users className="w-8 h-8 text-[#1976D2]" />
          </div>
          <span className="text-lg font-semibold text-white">Data User</span>
        </Link>
        <Link href="/absensi" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-emerald-500/5 group transition-all duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-8 h-8 text-emerald-500" />
          </div>
          <span className="text-lg font-semibold text-white">Data Absensi</span>
        </Link>
        <Link href="/pengaturan" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-red-500/5 group transition-all duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Wifi className="w-8 h-8 text-red-500" />
          </div>
          <span className="text-lg font-semibold text-white">Pengaturan</span>
        </Link>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#1976D2]" />
            <h3 className="text-xl font-semibold text-white">Absensi Terbaru</h3>
          </div>
          <Link className="text-[#1976D2] hover:underline text-sm font-medium flex items-center gap-1" href="/absensi">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">No</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">PIN</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">Nama</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">Waktu Scan</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">Metode</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data absensi
                  </td>
                </tr>
              ) : (
                recent.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-200">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white font-mono">{row.pin}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{formatDate(row.scan_time)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {formatVerifyType(row.verify)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status_scan === 0 ? "bg-green-500/15 text-green-400 border border-green-500/30" : row.status_scan === 1 ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-gray-500/15 text-gray-400 border border-gray-500/30"}`}>
                        {formatStatusScan(row.status_scan)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

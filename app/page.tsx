"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "./components/GlassCard";
import { formatDate, formatVerifyType, formatStatusScan } from "@/lib/utils";
import {
  Users, Clock, Fingerprint, Wifi, ArrowRight,
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

interface DayData {
  label: string;
  count: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Total User", value: "-", icon: Users, color: "text-gray-400" },
    { label: "Absensi Hari Ini", value: "-", icon: Clock, color: "text-gray-400" },
    { label: "Total PIN", value: "-", icon: Fingerprint, color: "text-gray-400" },
    { label: "Status Mesin", value: "-", icon: Wifi, color: "text-gray-400" },
  ]);
  const [recent, setRecent] = useState<RecentAttendance[]>([]);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      try {
        const cloudId = await getClientCloudId();
        setHasConfig(!!cloudId);

        if (!cloudId) {
          setStats([
            { label: "Total User", value: "0", icon: Users, color: "text-gray-400" },
            { label: "Absensi Hari Ini", value: "0", icon: Clock, color: "text-gray-400" },
            { label: "Total PIN", value: "0", icon: Fingerprint, color: "text-purple-500" },
            { label: "Status Mesin", value: "Belum Diatur", icon: Wifi, color: "text-gray-500" },
          ]);
          setChartData([]);
          setRecent([]);
          return;
        }

        const [usersCount, attCount, pinsCount] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }).eq("cloud_id", cloudId),
          supabase.from("attendance_logs").select("id", { count: "exact", head: true })
            .eq("cloud_id", cloudId)
            .gte("scan_time", new Date().toISOString().split("T")[0]),
          supabase.from("device_pins").select("id", { count: "exact", head: true }).eq("cloud_id", cloudId),
        ]);

        setStats([
          { label: "Total User", value: String(usersCount.count ?? 0), icon: Users, color: "text-gray-400" },
          { label: "Absensi Hari Ini", value: String(attCount.count ?? 0), icon: Clock, color: "text-gray-400" },
          { label: "Total PIN", value: String(pinsCount.count ?? 0), icon: Fingerprint, color: "text-purple-500" },
          { label: "Status Mesin", value: cloudId, icon: Wifi, color: "text-blue-400" },
        ]);

        const days: DayData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const nextDate = new Date(d);
          nextDate.setDate(nextDate.getDate() + 1);
          const nextDateStr = nextDate.toISOString().split("T")[0];

          const { count } = await supabase
            .from("attendance_logs")
            .select("id", { count: "exact", head: true })
            .eq("cloud_id", cloudId)
            .gte("scan_time", dateStr)
            .lt("scan_time", nextDateStr);

          const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
          days.push({ label: dayLabel, count: count ?? 0 });
        }
        setChartData(days);

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
            <div className="h-48 bg-white/5 rounded" />
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-white/10 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded" />
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

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
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${hasConfig ? "bg-white/10" : "bg-gray-500/10"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasConfig ? "bg-white animate-pulse" : "bg-gray-500"}`} />
                    <span className={`text-[10px] font-medium uppercase ${hasConfig ? "text-white" : "text-gray-500"}`}>
                      {hasConfig ? "Online" : "Offline"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{card.value}</h3>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-300">Absensi 7 Hari Terakhir</h3>
          <span className="text-[11px] text-gray-500">{chartData.reduce((a, b) => a + b.count, 0)} total scan</span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {chartData.map((day, i) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            const isToday = i === chartData.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[11px] text-gray-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.count}
                </span>
                <div className="w-full relative" style={{ height: "100px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ease-out ${
                      isToday ? "bg-white/10" : "bg-white/10/30"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
                <span className={`text-[11px] ${isToday ? "text-gray-400 font-medium" : "text-gray-500"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/user" className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/10/[0.04] group transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-white/10/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Data User</span>
        </Link>
        <Link href="/absensi" className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/10/[0.04] group transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-white/10/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-7 h-7 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Data Absensi</span>
        </Link>
        <Link href="/pengaturan" className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.04] group transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Wifi className="w-7 h-7 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-300">Pengaturan</span>
        </Link>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-300">Absensi Terbaru</h3>
          </div>
          <Link className="text-white hover:text-gray-300 text-[13px] font-medium flex items-center gap-1 transition-colors" href="/absensi">
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">No</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">PIN</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Nama</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Waktu Scan</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Metode</th>
                <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                    Belum ada data absensi
                  </td>
                </tr>
              ) : (
                recent.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-white/[0.03] border-b border-white/[0.04] transition-colors duration-200">
                    <td className="px-5 py-4 text-[15px] text-gray-500">{idx + 1}</td>
                    <td className="px-5 py-4 text-[15px] font-semibold text-white font-mono">{row.pin}</td>
                    <td className="px-5 py-4 text-[15px] text-gray-300">{row.name}</td>
                    <td className="px-5 py-4 text-[15px] text-gray-400">{formatDate(row.scan_time)}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[13px] font-medium bg-white/10 text-white">
                        {formatVerifyType(row.verify)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[13px] font-medium ${row.status_scan === 0 ? "bg-white/10 text-white" : row.status_scan === 1 ? "bg-white/5 text-gray-400" : "bg-white/5 text-gray-500"}`}>
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

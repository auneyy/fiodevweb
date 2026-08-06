"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "../components/GlassCard";
import { formatDate, formatVerifyType, formatStatusScan } from "@/lib/utils";
import { Clock, Search, Download, Loader2 } from "lucide-react";

interface AttendanceLog {
  id: number;
  pin: string;
  name: string;
  scan_time: string;
  verify: number;
  status_scan: number;
  photo_url: string | null;
}

export default function AbsensiPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterPin, setFilterPin] = useState("");
  const [cloudId, setCloudId] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["cloud_id"]);
    const cid = settings?.find((s) => s.key === "cloud_id")?.value || "";
    setCloudId(cid);

    const { data } = await supabase
      .from("attendance_logs")
      .select("id, pin, scan_time, verify, status_scan, photo_url")
      .eq("cloud_id", cid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const pins = [...new Set(data.map((r) => r.pin))];
      const { data: usersData } = await supabase
        .from("users")
        .select("pin, name")
        .eq("cloud_id", cid)
        .in("pin", pins);
      const userMap = new Map(usersData?.map((u) => [u.pin, u.name]) || []);
      setLogs(data.map((r) => ({ ...r, name: userMap.get(r.pin) || "-" })));
    } else {
      setLogs([]);
    }
    setLoading(false);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      showToast("Pilih tanggal awal dan akhir", "error");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 2) {
      showToast("Maksimal rentang tanggal adalah 2 hari", "error");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/mesin/get-attlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Perintah terkirim. Menunggu respons mesin sekitar 10 detik...", "success");
        setTimeout(async () => {
          await loadLogs();
          showToast("Data absensi diperbarui", "success");
          setFetching(false);
        }, 12000);
      } else {
        showToast(result.message || result.error || "Gagal mengambil data", "error");
        setFetching(false);
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
      setFetching(false);
    }
  };

  const handleExportCSV = () => {
    const filtered = getFilteredLogs();
    const header = "No,PIN,Nama,Waktu Scan,Metode,Status,Foto\n";
    const rows = filtered.map((r, i) =>
      `${i + 1},${r.pin},"${r.name}","${formatDate(r.scan_time)}","${formatVerifyType(r.verify)}","${formatStatusScan(r.status_scan)}","${r.photo_url || ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredLogs = () => {
    return logs.filter((r) => {
      if (filterPin && !r.pin.includes(filterPin)) return false;
      if (startDate && r.scan_time < startDate) return false;
      if (endDate && r.scan_time > endDate + "T23:59:59") return false;
      return true;
    });
  };

  const filtered = getFilteredLogs();

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-xl border ${
          toast.type === "success"
            ? "bg-green-500/15 text-green-400 border-green-500/30"
            : "bg-red-500/15 text-red-400 border-red-500/30"
        }`}>
          {toast.message}
        </div>
      )}

      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#1976D2]" />
            <h2 className="text-xl font-bold text-white">Data Absensi</h2>
            <span className="text-sm text-gray-400">({logs.length} record)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1976D2]/50"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1976D2]/50"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter PIN..."
                value={filterPin}
                onChange={(e) => setFilterPin(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#1976D2]/50 w-32"
              />
            </div>
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {fetching ? "Mengirim..." : "Ambil Data"}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
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
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">Foto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data absensi
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-200">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white font-mono">{row.pin}</td>
                      <td className="px-4 py-3 text-sm text-gray-200">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-200">{formatDate(row.scan_time)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.verify >= 0 && row.verify <= 9 ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : row.verify === 15 ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : row.verify === 2 ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                          : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                        }`}>
                          {formatVerifyType(row.verify)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status_scan === 0 ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : row.status_scan === 1 ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                        }`}>
                          {formatStatusScan(row.status_scan)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {row.photo_url ? (
                          <a href={row.photo_url} target="_blank" rel="noopener noreferrer" className="text-[#1976D2] hover:underline">
                            Lihat
                          </a>
                        ) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

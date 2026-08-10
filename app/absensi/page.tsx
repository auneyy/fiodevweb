"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "../components/GlassCard";
import Pagination from "../components/Pagination";
import Toast from "../components/Toast";
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

const ROWS_PER_PAGE = 10;

export default function AbsensiPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterPin, setFilterPin] = useState("");
  const [cloudId, setCloudId] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const cid = await getClientCloudId();
    setCloudId(cid || "");
    if (!cid) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();

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

  const filtered = logs.filter((r) => {
    if (filterPin && !(r.pin != null && r.pin.includes(filterPin))) return false;
    if (startDate && r.scan_time < startDate) return false;
    if (endDate && r.scan_time > endDate + "T23:59:59") return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleFilterPin = (v: string) => { setFilterPin(v); setPage(1); };
  const handleStartDate = (v: string) => { setStartDate(v); setPage(1); };
  const handleEndDate = (v: string) => { setEndDate(v); setPage(1); };

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Data Absensi</h2>
            <span className="text-sm text-gray-400">({filtered.length} record)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDate(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDate(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter PIN..."
                value={filterPin}
                onChange={(e) => handleFilterPin(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 w-32"
              />
            </div>
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
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
              <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">No</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">PIN</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Nama</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Waktu Scan</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Metode</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold text-center">Status</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                        Tidak ada data absensi
                      </td>
                    </tr>
                  ) : (
                    paged.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                        <td className="px-5 py-4 text-[15px] text-gray-200">{(safePage - 1) * ROWS_PER_PAGE + idx + 1}</td>
                        <td className="px-5 py-4 text-[15px] font-bold text-white font-mono">{row.pin}</td>
                        <td className="px-5 py-4 text-[15px] text-gray-200">{row.name}</td>
                        <td className="px-5 py-4 text-[15px] text-gray-200">{formatDate(row.scan_time)}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[13px] font-medium ${
                            row.verify >= 0 && row.verify <= 9 ? "bg-white/10 text-white border border-white/20"
                            : row.verify === 15 ? "bg-white/10 text-white border border-white/20"
                            : row.verify === 2 ? "bg-white/5 text-gray-400 border border-white/10"
                            : "bg-white/5 text-gray-500 border border-white/10"
                          }`}>
                            {formatVerifyType(row.verify)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[13px] font-medium ${
                            row.status_scan === 0 ? "bg-white/10 text-white border border-white/20"
                            : row.status_scan === 1 ? "bg-white/5 text-gray-400 border border-white/10"
                            : "bg-white/5 text-gray-500 border border-white/10"
                          }`}>
                            {formatStatusScan(row.status_scan)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[15px] text-gray-200">
                          {row.photo_url ? (
                            <a href={row.photo_url} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
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
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>
    </div>
  );
}

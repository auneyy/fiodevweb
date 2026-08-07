"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "../components/GlassCard";
import { formatDate } from "@/lib/utils";
import Toast from "../components/Toast";
import { Key, Search, Loader2, Fingerprint, RefreshCw } from "lucide-react";

interface DevicePin {
  id: number;
  pin: string;
  fetched_at: string;
}

export default function PinPage() {
  const [pins, setPins] = useState<DevicePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [cloudId, setCloudId] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    setLoading(true);
    const cid = await getClientCloudId();
    setCloudId(cid || "");
    if (!cid) {
      setPins([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from("device_pins")
      .select("id, pin, fetched_at")
      .eq("cloud_id", cid)
      .order("pin");

    if (error) {
      console.error("[pin-page] Load error:", error);
    }
    console.log("[pin-page] Loaded pins:", data?.length || 0);
    setPins(data || []);
    setLoading(false);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleFetchPins = async () => {
    setFetching(true);
    try {
      console.log("[pin-page] Sending get-all-pin request...");
      const res = await fetch("/mesin/get-all-pin", { method: "POST" });
      const result = await res.json();
      console.log("[pin-page] API response:", result);

      if (result.success) {
        showToast("Perintah terkirim ke mesin. Menunggu data PIN dari webhook...", "success");

        // Poll for new pins every 3 seconds for 30 seconds
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = setInterval(async () => {
          attempts++;
          console.log(`[pin-page] Polling attempt ${attempts}/${maxAttempts}...`);
          await loadPins();

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setFetching(false);
            const { count } = await createClient()
              .from("device_pins")
              .select("id", { count: "exact", head: true })
              .eq("cloud_id", await getClientCloudId());
            if (!count || count === 0) {
              showToast("Webhook tidak diterima. Pastikan URL webhook sudah dikonfigurasi di panel Fingerspot.", "error");
            } else {
              showToast(`Berhasil! ${count} PIN ditemukan.`, "success");
            }
          }
        }, 3000);
      } else {
        showToast(result.message || "Gagal mengambil PIN dari mesin", "error");
        setFetching(false);
      }
    } catch (err) {
      console.error("[pin-page] Error:", err);
      showToast("Terjadi kesalahan: " + (err as Error).message, "error");
      setFetching(false);
    }
  };

  const filtered = pins.filter((p) => p.pin.includes(search));

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <GlassCard className="p-5 border-l-4 border-l-white/20">
        <div className="flex items-start gap-3">
          <Fingerprint className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-200 font-medium">Halaman ini hanya menampilkan PIN saja</p>
            <p className="text-xs text-gray-400 mt-1">
              Data user lengkap (nama, privilege, dll) ada di halaman <a href="/user" className="underline">Data User</a>.
              Gunakan tombol &quot;Sinkronisasi&quot; di halaman User untuk mengambil data lengkap.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Data PIN</h2>
            <span className="text-sm text-gray-400">({pins.length} PIN)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari PIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button
              onClick={handleFetchPins}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {fetching ? "Mengirim..." : "Ambil Semua PIN"}
            </button>
          </div>
        </div>
      </GlassCard>

      {pins.length === 0 && !loading && (
        <GlassCard className="p-6 border-l-4 border-l-white/20">
          <div className="flex items-start gap-3">
            <div className="text-gray-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-200 font-medium">Tidak ada data PIN di database</p>
              <p className="text-xs text-gray-400 mt-1">
                Klik &quot;Ambil Semua PIN&quot; untuk mengirim perintah ke mesin. Data PIN akan muncul setelah mesin merespons via webhook.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                <strong>Pastikan webhook URL sudah dikonfigurasi</strong> di panel Fingerspot ke:
                <code className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
                  {typeof window !== "undefined" ? window.location.origin : "..."}/api/webhook
                </code>
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">No</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">PIN</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Tanggal Fetch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                      {pins.length === 0 ? "Belum ada data PIN" : "PIN tidak ditemukan"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] border-b border-white/[0.04] transition-colors duration-200">
                      <td className="px-5 py-4 text-[15px] text-gray-500">{idx + 1}</td>
                      <td className="px-5 py-4 text-[15px] font-semibold text-white font-mono">{p.pin}</td>
                      <td className="px-5 py-4 text-[15px] text-gray-400">{formatDate(p.fetched_at)}</td>
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

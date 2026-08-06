"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "../components/GlassCard";
import {
  Settings, Save, Loader2, Copy, Check, RefreshCw, AlertTriangle, Clock,
} from "lucide-react";

interface Setting {
  key: string;
  value: string;
}

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloudId, setCloudId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [timezone, setTimezone] = useState("7");
  const [restarting, setRestarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("settings")
      .select("key, value");
    setSettings(data || []);

    const cid = data?.find((s) => s.key === "cloud_id")?.value || "";
    const ak = data?.find((s) => s.key === "api_key")?.value || "";
    setCloudId(cid);
    setApiKey(ak);
    setLoading(false);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("settings").upsert(
        [
          { key: "cloud_id", value: cloudId },
          { key: "api_key", value: apiKey },
        ],
        { onConflict: "key" }
      );
      showToast("Konfigurasi berhasil disimpan", "success");
    } catch {
      showToast("Gagal menyimpan konfigurasi", "error");
    }
    setSaving(false);
  };

  const handleSetTime = async () => {
    try {
      const res = await fetch("/mesin/set-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Perintah terkirim. Menunggu respons mesin sekitar 10 detik...", "success");
      } else {
        showToast(result.message || "Gagal mengatur waktu", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    setShowRestartDialog(false);
    try {
      const res = await fetch("/mesin/restart", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        showToast("Perintah restart terkirim. Mesin akan restart dalam beberapa detik.", "success");
      } else {
        showToast(result.message || "Gagal restart mesin", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setRestarting(false);
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhook`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigComplete = cloudId && apiKey;

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

      {!isConfigComplete && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-200">Konfigurasi belum lengkap</p>
            <p className="text-xs text-yellow-200/60 mt-1">
              Cloud ID dan API Token harus diisi agar dapat berkomunikasi dengan mesin Fingerspot.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <Settings className="w-5 h-5 text-[#1976D2]" />
              <h3 className="text-lg font-bold text-white">Konfigurasi Perangkat</h3>
            </div>
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 bg-white/5 rounded animate-pulse" />
                <div className="h-10 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cloud ID</label>
                  <input
                    type="text"
                    value={cloudId}
                    onChange={(e) => setCloudId(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#1976D2]/50"
                    placeholder="Masukkan Cloud ID"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Token</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2 pr-16 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#1976D2]/50"
                      placeholder="Masukkan API Token"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                    >
                      {showApiKey ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Konfigurasi
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <Clock className="w-5 h-5 text-[#1976D2]" />
              <h3 className="text-lg font-bold text-white">Kontrol Mesin</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1976D2]/50"
                >
                  <option value="7">GMT+7 (WIB)</option>
                  <option value="8">GMT+8 (WITA)</option>
                  <option value="9">GMT+9 (WIT)</option>
                </select>
              </div>
              <button
                onClick={handleSetTime}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Clock className="w-4 h-4" />
                Set Waktu dan Sinkronisasi
              </button>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">Restart Mesin</p>
                <button
                  onClick={() => setShowRestartDialog(true)}
                  disabled={restarting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 disabled:opacity-50 rounded-xl text-sm font-medium text-red-400 transition-colors"
                >
                  {restarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {restarting ? "Restarting..." : "Restart Mesin"}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">Webhook URL</h3>
            <p className="text-xs text-gray-400 mb-3">Gunakan URL ini untuk konfigurasi webhook di panel Fingerspot</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 font-mono break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "/api/webhook"}
              </code>
              <button
                onClick={copyWebhookUrl}
                className="shrink-0 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">Status Koneksi</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cloud ID</span>
                <span className="text-sm text-white font-mono">{cloudId || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isConfigComplete ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                  <span className="text-sm text-white">{isConfigComplete ? "Terhubung" : "Belum Dikonfigurasi"}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {showRestartDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Restart Mesin</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Apakah Anda yakin ingin me-restart mesin? Mesin akan mati beberapa saat dan menyala kembali secara otomatis.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestartDialog(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

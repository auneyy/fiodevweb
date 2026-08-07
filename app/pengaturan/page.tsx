"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "../components/GlassCard";
import Toast from "../components/Toast";
import {
  Settings, Save, Loader2, Copy, Check, RefreshCw, AlertTriangle, Clock, Shield,
} from "lucide-react";

function useLiveClock(timezone: string) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleString("id-ID", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleString("id-ID", {
          timeZone: timezone,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return time;
}

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloudId, setCloudId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [restarting, setRestarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const liveClock = useLiveClock(timezone);

  const tzOptions = [
    { value: "Asia/Jakarta", label: "GMT+7 (WIB)", sub: "Asia/Jakarta" },
    { value: "Asia/Makassar", label: "GMT+8 (WITA)", sub: "Asia/Makassar" },
    { value: "Asia/Jayapura", label: "GMT+9 (WIT)", sub: "Asia/Jayapura" },
  ];

  const loadSettings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check 2FA status
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = factors?.totp?.some((f) => f.status === "verified");
    setTwoFaEnabled(!!hasVerifiedTotp);

    const { data } = await supabase
      .from("user_settings")
      .select("cloud_id, api_key")
      .eq("user_id", user.id)
      .single();
    setCloudId(data?.cloud_id || "");
    setApiKey(data?.api_key || "");
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSettings();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("Tidak terautentikasi", "error");
        setSaving(false);
        return;
      }
      await supabase.from("user_settings").upsert(
        { user_id: user.id, cloud_id: cloudId, api_key: apiKey },
        { onConflict: "user_id" }
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
      {toast && <Toast message={toast.message} type={toast.type} />}

      {!isConfigComplete && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-200">Konfigurasi belum lengkap</p>
            <p className="text-xs text-gray-400 mt-1">
              Cloud ID dan API Token harus diisi agar dapat berkomunikasi dengan mesin Fingerspot.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <Settings className="w-5 h-5 text-gray-400" />
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
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
                      className="w-full px-4 py-2 pr-16 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
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
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Konfigurasi
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-bold text-white">Kontrol Mesin</h3>
            </div>
            <div className="space-y-4">
              {isConfigComplete && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Waktu Mesin Saat Ini</p>
                  <p className="text-2xl font-mono font-bold text-white tabular-nums">{liveClock}</p>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                <div className="grid grid-cols-3 gap-2">
                  {tzOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimezone(opt.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        timezone === opt.value
                          ? "bg-white/10 text-white shadow-lg shadow-white/5"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-[13px]">{opt.label}</div>
                        <div className={`text-[11px] mt-0.5 ${timezone === opt.value ? "text-white/70" : "text-gray-500"}`}>{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSetTime}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Clock className="w-4 h-4" />
                Set Waktu dan Sinkronisasi
              </button>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">Restart Mesin</p>
                <button
                  onClick={() => setShowRestartDialog(true)}
                  disabled={restarting}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 rounded-xl text-sm font-medium text-gray-300 transition-colors"
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
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
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
                  <div className={`w-2 h-2 rounded-full ${isConfigComplete ? "bg-white animate-pulse" : "bg-gray-500"}`} />
                  <span className="text-sm text-white">{isConfigComplete ? "Terhubung" : "Belum Dikonfigurasi"}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold text-white">2FA</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${twoFaEnabled ? "bg-white/10 text-white" : "bg-white/5 text-gray-500"}`}>
                {twoFaEnabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {twoFaEnabled
                ? "Autentikasi dua faktor sudah aktif. Anda akan diminta memasukkan kode setiap login."
                : "Aktifkan 2FA untuk keamanan tambahan. Memerlukan aplikasi authenticator."}
            </p>
            <button
              onClick={() => window.location.href = twoFaEnabled ? "/2fa/verify" : "/2fa/setup"}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                twoFaEnabled
                  ? "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              {twoFaEnabled ? "Kelola 2FA" : "Aktifkan 2FA"}
            </button>
          </GlassCard>
        </div>
      </div>

      {showRestartDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-gray-400" />
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
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
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

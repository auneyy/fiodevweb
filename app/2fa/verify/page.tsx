"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Shield, Loader2, LogOut } from "lucide-react";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [noFactors, setNoFactors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // List TOTP factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (!totpFactor) {
        setNoFactors(true);
        setLoading(false);
        return;
      }

      setFactorId(totpFactor.id);

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      setChallengeId(challenge.id);
      setLoading(false);
      inputRef.current?.focus();
    };

    init();
  }, [router]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Kode harus 6 digit");
      return;
    }
    setVerifying(true);
    setError("");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (verifyError) {
      setError("Kode tidak valid. Coba lagi.");
      setVerifying(false);
      // Create new challenge
      const { data: newChallenge } = await supabase.auth.mfa.challenge({ factorId });
      if (newChallenge) setChallengeId(newChallenge.id);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141418] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1976D2] animate-spin" />
      </div>
    );
  }

  if (noFactors) {
    return (
      <div className="min-h-screen bg-[#141418] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">2FA Belum Dikonfigurasi</h1>
            <p className="text-sm text-gray-400 mb-6">
              Aktifkan autentikasi dua faktor terlebih dahulu di halaman setup.
            </p>
            <button
              onClick={() => router.push("/2fa/setup")}
              className="w-full px-4 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] rounded-xl text-sm font-medium text-white transition-colors mb-3"
            >
              Setup 2FA
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141418] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#1976D2]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1976D2]/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-[#1976D2]" />
            </div>
            <h1 className="text-xl font-bold text-white">Verifikasi 2FA</h1>
            <p className="text-sm text-gray-400 text-center mt-1">
              Masukkan kode dari aplikasi authenticator Anda
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Kode verifikasi</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white text-center font-mono text-2xl tracking-[0.5em] placeholder:text-gray-500 focus:outline-none focus:border-[#1976D2]/50",
                  error ? "border-red-500/50" : "border-white/10"
                )}
                placeholder="000000"
              />
              {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verifikasi
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

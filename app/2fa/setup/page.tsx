"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Shield, Copy, Check, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if 2FA is already enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor?.status === "verified") {
        setAlreadyEnabled(true);
        setLoading(false);
        return;
      }

      // Enroll new TOTP factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (enrollError) {
        setError(enrollError.message);
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setTotpUri(data.totp.uri);
      setSecret(data.totp.secret);

      // Create challenge for enrollment verification
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      setChallengeId(challenge.id);

      // Generate QR code
      try {
        const url = await QRCode.toDataURL(data.totp.uri.toUpperCase(), {
          width: 200,
          margin: 2,
          color: { dark: "#ffffff", light: "#00000000" },
        });
        setQrDataUrl(url);
      } catch {
        // QR generation failed, user can manually enter secret
      }

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

    router.push("/2fa/verify");
    router.refresh();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141418] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (alreadyEnabled) {
    return (
      <div className="min-h-screen bg-[#141418] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">2FA Sudah Aktif</h1>
            <p className="text-sm text-gray-400 mb-6">
              Autentikasi dua faktor sudah diaktifkan di akun Anda.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Masuk ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141418] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Aktifkan 2FA</h1>
            <p className="text-sm text-gray-400 text-center mt-1">
              Pindai QR code dengan aplikasi authenticator (Google Authenticator, Authy, dll)
            </p>
          </div>

          <div className="space-y-5">
            {/* QR Code */}
            <div className="flex justify-center">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl">
                  <Image src={qrDataUrl} alt="2FA QR Code" width={200} height={200} />
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-xs text-gray-400 mb-2">QR code tidak tersedia. Masukkan manual:</p>
                  <p className="text-xs text-white font-mono break-all">{totpUri}</p>
                </div>
              )}
            </div>

            {/* Manual entry */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Atau masukkan manual</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 font-mono break-all">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="shrink-0 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Code input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Masukkan kode 6 digit</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border rounded-xl text-sm text-white text-center font-mono text-2xl tracking-[0.5em] placeholder:text-gray-500 focus:outline-none focus:border-white/20",
                  error ? "border-red-500/50" : "border-white/10"
                )}
                placeholder="000000"
              />
              {error && (
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Aktifkan 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  KeyRound, User, ClipboardList, UserPlus, UserMinus,
  Clock, RotateCcw, Wifi, ChevronDown, ExternalLink,
} from "lucide-react";

const apiCommands = [
  {
    icon: KeyRound,
    title: "Get All PIN",
    description: "Ambil semua nomor PIN terdaftar dari perangkat Fingerspot secara real-time.",
    method: "POST",
    endpoint: "/api/get_all_pin",
  },
  {
    icon: User,
    title: "Get User Info",
    description: "Dapatkan detail pengguna berdasarkan PIN, termasuk template dan hak akses.",
    method: "POST",
    endpoint: "/api/get_userinfo",
  },
  {
    icon: ClipboardList,
    title: "Get Attendance Log",
    description: "Ambil data log absensi untuk rentang tanggal tertentu dari mesin.",
    method: "POST",
    endpoint: "/api/get_attlog",
  },
  {
    icon: UserPlus,
    title: "Set User Info",
    description: "Buat atau perbarui data pengguna langsung pada perangkat Fingerspot.",
    method: "POST",
    endpoint: "/api/set_userinfo",
  },
  {
    icon: UserMinus,
    title: "Delete User Info",
    description: "Hapus pengguna dari perangkat berdasarkan nomor PIN.",
    method: "POST",
    endpoint: "/api/delete_userinfo",
  },
  {
    icon: Clock,
    title: "Set Time",
    description: "Sinkronisasi jam mesin dengan timezone Indonesia (WIB, WITA, WIT).",
    method: "POST",
    endpoint: "/api/set_time",
  },
  {
    icon: RotateCcw,
    title: "Restart Device",
    description: "Reboot perangkat Fingerspot dari jarak jauh secara aman.",
    method: "POST",
    endpoint: "/api/restart_device",
  },
  {
    icon: Wifi,
    title: "Register Online",
    description: "Daftarkan pengguna untuk verifikasi online pada perangkat.",
    method: "POST",
    endpoint: "/api/reg_online",
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -380, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 380, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#141418] text-white overflow-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">RAQ</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors duration-200"
              >
                Register
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Fingerspot Cloud API Integration
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6">
              <span className="text-white">Run API</span>{" "}
              <span className="text-gray-500">Quick</span>
            </h1>
          </RevealSection>

          <RevealSection delay={200}>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Console manajemen absensi Fingerspot. Kontrol perangkat, kelola data pengguna,
              dan pantau log absensi — semuanya dari satu tempat.
            </p>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <a
                href="https://developer.fingerspot.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-all duration-200"
              >
                <Wifi className="w-4 h-4" />
                Hubungkan Mesin
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="https://fingerspot.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
              >
                Lihat Perangkat
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
              >
                Register
              </Link>
            </div>
          </RevealSection>

          {/* Stats row */}
          <RevealSection delay={400}>
            <div className="flex items-center justify-center gap-8 sm:gap-16 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">8</div>
                <div className="text-xs text-gray-500 mt-1">API Endpoints</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">Real</div>
                <div className="text-xs text-gray-500 mt-1">Time Sync</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">24/7</div>
                <div className="text-xs text-gray-500 mt-1">Cloud Access</div>
              </div>
            </div>
          </RevealSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-bounce">
          <span className="text-[11px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ===== API COMMANDS ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">API Commands</h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                8 endpoint kuat untuk mengontrol perangkat Fingerspot secara penuh dari cloud.
              </p>
            </div>
          </RevealSection>

          {/* Horizontal scroll cards */}
          <div className="relative">
            {/* Scroll buttons */}
            <button
              onClick={scrollLeft}
              className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={scrollRight}
              className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            >
              {apiCommands.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <RevealSection key={cmd.title} delay={i * 60}>
                    <div className="group flex-shrink-0 w-[320px] sm:w-[360px] snap-start bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 cursor-default">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300">
                          <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-mono text-gray-500">
                          {cmd.method}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2">{cmd.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{cmd.description}</p>
                      <div className="px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                        <code className="text-xs text-gray-500 font-mono">{cmd.endpoint}</code>
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <RevealSection>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 sm:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Mulai Sekarang
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-10">
                Hubungkan perangkat Fingerspot Anda, lalu kelola absensi seluruh tim dari dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                <a
                  href="https://developer.fingerspot.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-all duration-200"
                >
                  <Wifi className="w-4 h-4" />
                  Hubungkan Mesin
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://fingerspot.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
                >
                  Lihat Perangkat
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
                >
                  Login ke Dashboard
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200"
                >
                  Buat Akun Baru
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <KeyRound className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-500">Run API Quick</span>
          </div>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Fingerspot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

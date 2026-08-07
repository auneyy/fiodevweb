"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Webhook, ChevronRight } from "lucide-react";
import Link from "next/link";

interface WebhookLog {
  id: number;
  cloud_id: string;
  trans_id: string;
  webhook_type: string;
  status: string;
  created_at: string;
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [cloudId, setCloudId] = useState("");

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
      .from("webhook_logs")
      .select("id, cloud_id, trans_id, webhook_type, status, created_at")
      .eq("cloud_id", cid)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    if (filterType && l.webhook_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Webhook className="w-6 h-6 text-[#1976D2]" />
            <h2 className="text-xl font-bold text-white">Riwayat Webhook</h2>
            <span className="text-sm text-gray-400">({logs.length} log)</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1976D2]/50"
          >
            <option value="">Semua Tipe</option>
            <option value="attlog">attlog</option>
            <option value="realtime_attlog">realtime_attlog</option>
            <option value="get_attlog">get_attlog</option>
            <option value="get_userinfo">get_userinfo</option>
            <option value="set_userinfo">set_userinfo</option>
            <option value="delete_userinfo">delete_userinfo</option>
            <option value="get_all_pin">get_all_pin</option>
            <option value="set_time">set_time</option>
            <option value="register_online">register_online</option>
            <option value="restart_device">restart_device</option>
          </select>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Waktu</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Tipe</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Cloud ID</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Trans ID</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                      Tidak ada data webhook log
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                      <td className="px-5 py-4 text-[15px] text-gray-200">{formatDate(log.created_at)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={log.webhook_type} type="webhook_type" />
                      </td>
                      <td className="px-5 py-4 text-[15px] font-mono text-gray-300">{log.cloud_id}</td>
                      <td className="px-5 py-4 text-[15px] font-mono text-gray-300">{log.trans_id}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={log.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/webhook-logs/${log.id}`}
                          className="inline-flex items-center gap-1 text-[15px] text-[#1976D2] hover:text-[#1565C0]"
                        >
                          Lihat <ChevronRight className="w-4 h-4" />
                        </Link>
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

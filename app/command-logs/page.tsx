"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "../components/GlassCard";
import JsonViewer from "../components/JsonViewer";
import Pagination from "../components/Pagination";
import { formatDate } from "@/lib/utils";
import { Terminal, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandLog {
  id: number;
  cloud_id: string;
  trans_id: string;
  command_type: string;
  request_body: unknown;
  response_body: unknown;
  status: string;
  created_at: string;
}

const ROWS_PER_PAGE = 10;

export default function CommandLogsPage() {
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cloudId, setCloudId] = useState("");
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
      .from("command_logs")
      .select("id, cloud_id, trans_id, command_type, request_body, response_body, status, created_at")
      .eq("cloud_id", cid)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    if (filterType && l.command_type !== filterType) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleFilterType = (v: string) => { setFilterType(v); setPage(1); setExpandedId(null); };
  const handleFilterStatus = (v: string) => { setFilterStatus(v); setPage(1); setExpandedId(null); };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Riwayat Command</h2>
            <span className="text-sm text-gray-400">({filtered.length} log)</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => handleFilterType(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
            >
              <option value="">Semua Tipe</option>
              <option value="set_time">set_time</option>
              <option value="register_online">register_online</option>
              <option value="delete_userinfo">delete_userinfo</option>
              <option value="restart_device">restart_device</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
            >
              <option value="">Semua Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
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
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold w-8"></th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Waktu</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Tipe Command</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Trans ID</th>
                    <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                        Tidak ada data command log
                      </td>
                    </tr>
                  ) : (
                    paged.map((log) => (
                      <>
                        <tr
                          key={log.id}
                          className="hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          <td className="px-5 py-4">
                            {expandedId === log.id ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-5 py-4 text-[15px] text-gray-200">{formatDate(log.created_at)}</td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[13px] font-medium bg-white/10 text-white border border-white/20">
                              {log.command_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[15px] font-mono text-gray-300">{log.trans_id}</td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[13px] font-medium",
                              log.status === "success" ? "bg-white/10 text-white border border-white/20"
                              : log.status === "failed" ? "bg-white/5 text-gray-400 border border-white/10"
                              : "bg-white/5 text-gray-500 border border-white/10"
                            )}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr key={`${log.id}-expanded`}>
                            <td colSpan={5} className="px-8 py-4 bg-white/[0.02]">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Request Body</h4>
                                  <JsonViewer data={log.request_body || {}} maxHeight="200px" />
                                </div>
                                <div>
                                  <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Response Body</h4>
                                  <JsonViewer data={log.response_body || {}} maxHeight="200px" />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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

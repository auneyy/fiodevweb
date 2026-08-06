"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "../../components/GlassCard";
import JsonViewer from "../../components/JsonViewer";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ApiLogDetail {
  id: number;
  cloud_id: string;
  trans_id: string;
  api_type: string;
  request_body: unknown;
  response_body: unknown;
  status_code: number;
  status: string;
  created_at: string;
}

export default function ApiLogDetailPage() {
  const params = useParams();
  const [log, setLog] = useState<ApiLogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLog = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("api_logs")
        .select("*")
        .eq("id", params.id)
        .single();
      setLog(data);
      setLoading(false);
    };
    loadLog();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <GlassCard className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-white/10 rounded" />
            <div className="h-40 bg-white/5 rounded" />
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-12 text-gray-500">
        Log tidak ditemukan
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/api-logs" className="inline-flex items-center gap-2 text-sm text-[#1976D2] hover:text-[#1565C0]">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Riwayat API
      </Link>

      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-[#1976D2]" />
          <h2 className="text-xl font-bold text-white">Detail API Log</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Tipe API</p>
            <p className="text-sm text-white font-mono">{log.api_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Trans ID</p>
            <p className="text-sm text-white font-mono">{log.trans_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className="text-sm text-white">{log.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status Code</p>
            <p className="text-sm text-white">{log.status_code || "-"}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Request Body</h3>
          <JsonViewer data={log.request_body || {}} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Response Body</h3>
          <JsonViewer data={log.response_body || {}} />
        </div>
      </div>
    </div>
  );
}

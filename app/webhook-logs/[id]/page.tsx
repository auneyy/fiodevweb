"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "../../components/GlassCard";
import JsonViewer from "../../components/JsonViewer";
import { Webhook, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WebhookLogDetail {
  id: number;
  cloud_id: string;
  trans_id: string;
  webhook_type: string;
  raw_payload: unknown;
  status: string;
  created_at: string;
}

export default function WebhookLogDetailPage() {
  const params = useParams();
  const [log, setLog] = useState<WebhookLogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLog = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("webhook_logs")
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
        Webhook log tidak ditemukan
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/webhook-logs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Riwayat Webhook
      </Link>

      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <Webhook className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-bold text-white">Detail Webhook Log</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Tipe Webhook</p>
            <p className="text-sm text-white font-mono">{log.webhook_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cloud ID</p>
            <p className="text-sm text-white font-mono">{log.cloud_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Trans ID</p>
            <p className="text-sm text-white font-mono">{log.trans_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className="text-sm text-white">{log.status}</p>
          </div>
        </div>
      </GlassCard>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Raw Payload</h3>
        <JsonViewer data={log.raw_payload || {}} />
      </div>
    </div>
  );
}

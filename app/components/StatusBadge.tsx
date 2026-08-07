import { cn } from "@/lib/utils";

type BadgeType = "status" | "api_type" | "webhook_type" | "verify";

interface StatusBadgeProps {
  value: string;
  type?: BadgeType;
}

const statusColors: Record<string, string> = {
  success: "bg-green-500/15 text-green-400 border border-green-500/30",
  failed: "bg-red-500/15 text-red-400 border border-red-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  received: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

const apiTypeColors: Record<string, string> = {
  get_attlog: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  get_userinfo: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  set_userinfo: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  delete_userinfo: "bg-red-500/15 text-red-400 border border-red-500/30",
  get_all_pin: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  set_time: "bg-green-500/15 text-green-400 border border-green-500/30",
  reg_online: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
  register_online: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
  restart_device: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const webhookTypeColors: Record<string, string> = {
  attlog: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  realtime_attlog: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  get_attlog: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  get_userinfo: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  set_userinfo: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  delete_userinfo: "bg-red-500/15 text-red-400 border border-red-500/30",
  get_all_pin: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  set_time: "bg-green-500/15 text-green-400 border border-green-500/30",
  register_online: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
  restart_device: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const verifyColors: Record<string, string> = {
  jari: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  wajah: "bg-green-500/15 text-green-400 border border-green-500/30",
  kartu: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
};

const scanStatusColors: Record<string, string> = {
  masuk: "bg-green-500/15 text-green-400 border border-green-500/30",
  keluar: "bg-red-500/15 text-red-400 border border-red-500/30",
};

function getColors(value: string, type: BadgeType): string {
  const lower = value.toLowerCase();
  if (type === "verify") return verifyColors[lower] || "bg-gray-500/15 text-gray-400 border border-gray-500/30";
  if (type === "api_type") return apiTypeColors[value] || "bg-gray-500/15 text-gray-400 border border-gray-500/30";
  if (type === "webhook_type") return webhookTypeColors[value] || "bg-gray-500/15 text-gray-400 border border-gray-500/30";
  return scanStatusColors[lower] || statusColors[lower] || "bg-gray-500/15 text-gray-400 border border-gray-500/30";
}

export default function StatusBadge({ value, type = "status" }: StatusBadgeProps) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[13px] font-medium capitalize inline-block",
      getColors(value, type)
    )}>
      {value}
    </span>
  );
}

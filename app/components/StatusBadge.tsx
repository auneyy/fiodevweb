import { cn } from "@/lib/utils";

type BadgeType = "status" | "api_type" | "webhook_type" | "verify";

interface StatusBadgeProps {
  value: string;
  type?: BadgeType;
}

const monoColors: Record<string, string> = {
  success: "bg-white/10 text-white border border-white/20",
  failed: "bg-white/5 text-gray-400 border border-white/10",
  pending: "bg-white/5 text-gray-500 border border-white/10",
  received: "bg-white/10 text-gray-300 border border-white/20",
};

const typeColors: Record<string, string> = {
  get_attlog: "bg-white/10 text-gray-300 border border-white/20",
  get_userinfo: "bg-white/10 text-gray-300 border border-white/20",
  set_userinfo: "bg-white/10 text-gray-300 border border-white/20",
  delete_userinfo: "bg-white/5 text-gray-400 border border-white/10",
  get_all_pin: "bg-white/10 text-gray-300 border border-white/20",
  set_time: "bg-white/10 text-gray-300 border border-white/20",
  reg_online: "bg-white/10 text-gray-300 border border-white/20",
  register_online: "bg-white/10 text-gray-300 border border-white/20",
  restart_device: "bg-white/5 text-gray-400 border border-white/10",
  attlog: "bg-white/10 text-gray-300 border border-white/20",
  realtime_attlog: "bg-white/10 text-gray-300 border border-white/20",
};

const fallback = "bg-white/5 text-gray-500 border border-white/10";

function getColors(value: string, type: BadgeType): string {
  const lower = value.toLowerCase();
  if (type === "status") return monoColors[lower] || fallback;
  return typeColors[value] || typeColors[lower] || fallback;
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

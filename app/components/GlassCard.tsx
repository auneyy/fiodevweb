import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl transition-all duration-300",
        glow && "hover:border-[#1976D2]/20 hover:shadow-[0_0_24px_rgba(25,118,210,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

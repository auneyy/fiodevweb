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
        glow && "hover:border-white/10 hover:shadow-[0_0_24px_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {children}
    </div>
  );
}

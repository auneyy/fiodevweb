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
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl transition-all duration-300",
        glow && "hover:border-[#1976D2]/30 hover:shadow-[0_0_20px_rgba(25,118,210,0.15)]",
        className
      )}
    >
      {children}
    </div>
  );
}

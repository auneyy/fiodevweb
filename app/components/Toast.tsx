import { Check, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl text-sm font-medium text-white max-w-sm">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        type === "success" ? "bg-white/10" : "bg-white/5"
      }`}>
        {type === "success"
          ? <Check className="w-3.5 h-3.5 text-white" />
          : <X className="w-3.5 h-3.5 text-gray-400" />
        }
      </div>
      <span className="text-gray-200">{message}</span>
    </div>
  );
}

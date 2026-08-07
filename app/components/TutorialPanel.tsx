"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, ChevronDown } from "lucide-react";

interface TutorialPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function TutorialPanel({ title, children }: TutorialPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

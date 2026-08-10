"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) pages.push("...");

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) pages.push("...");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-white/[0.02]">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentPage === 1 ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentPage === 1 ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, i) =>
          page === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-gray-500 text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-white/15 text-white border border-white/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentPage === totalPages ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentPage === totalPages ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
}

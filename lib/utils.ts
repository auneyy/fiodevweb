import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatVerifyType(code: number): string {
  if (code === 0) return "PIN";
  if (code === 1) return "Jari";
  if (code === 2) return "Kartu";
  if (code === 3 || code === 4 || code === 15) return "Wajah";
  if (code === 10 || code === 11) return "Vena";
  return `Tidak Diketahui (${code})`;
}

export function formatStatusScan(code: number): string {
  if (code === 0) return "Masuk";
  if (code === 1) return "Keluar";
  return "Tidak Diketahui";
}

export function formatVerifyBadgeClass(code: number): string {
  if (code === 0) return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  if (code === 1) return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  if (code === 2) return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  if (code === 3 || code === 4 || code === 15) return "bg-green-500/15 text-green-400 border border-green-500/30";
  if (code === 10 || code === 11) return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  return "bg-gray-500/15 text-gray-400 border border-gray-500/30";
}

export function formatStatusBadgeClass(code: number): string {
  if (code === 0) return "bg-green-500/15 text-green-400 border border-green-500/30";
  if (code === 1) return "bg-red-500/15 text-red-400 border border-red-500/30";
  return "bg-gray-500/15 text-gray-400 border border-gray-500/30";
}

export async function encodePhotoToTemplate(file: File): Promise<string> {
  const MAX_SIZE = 100 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran foto maksimal 100KB");
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Foto = Buffer.from(arrayBuffer).toString("base64");
  const jsonStr = JSON.stringify({ face: base64Foto });
  const stringFinal = Buffer.from(jsonStr, "utf-8").toString("base64");
  return stringFinal;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  COMPLIANCE_STATUS_LABELS,
  COMPLIANCE_STATUS_COLORS,
  COMPONENT_CATEGORY_LABELS,
  REGULATION_REGION_LABELS,
} from "@/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusLabel(status: string): string {
  return COMPLIANCE_STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return COMPLIANCE_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
}

export function categoryLabel(category: string): string {
  return COMPONENT_CATEGORY_LABELS[category] ?? category;
}

export function regionLabel(region: string): string {
  return REGULATION_REGION_LABELS[region] ?? region;
}

export function isExpiringSoon(date: Date | null | undefined, days = 30): boolean {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
}


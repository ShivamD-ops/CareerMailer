import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "sent":
    case "delivered":
      return "bg-blue-100 text-blue-800";
    case "opened":
      return "bg-green-100 text-green-800";
    case "replied":
      return "bg-green-100 text-green-800";
    case "bounced":
      return "bg-red-100 text-red-800";
    case "scheduled":
      return "bg-yellow-100 text-yellow-800";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getResponseBadgeColor(status: string): string {
  switch (status) {
    case "replied":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "none":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function calculateDaysAgo(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function extractDomainFromEmail(email: string): string {
  return email.split("@")[1] || "";
}

export function generateEmailSubject(position: string, company: string): string {
  return `Application for ${position} Position - ${company}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9.\-_]/gi, "_");
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

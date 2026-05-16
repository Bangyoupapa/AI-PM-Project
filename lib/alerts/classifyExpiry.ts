export type ExpiryUrgency = "warning" | "danger";

export function classifyExpiryUrgency(
  expiresAt: Date | null,
  today: Date
): ExpiryUrgency | null {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 30) return "danger";
  if (daysLeft <= 90) return "warning";
  return null;
}

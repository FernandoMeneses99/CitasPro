export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).href;
  } catch {
    return "http://localhost:3000";
  }
}
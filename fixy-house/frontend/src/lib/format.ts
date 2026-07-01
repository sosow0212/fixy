const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const relativeFmt = new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" });

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateOnlyFmt.format(d);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "—";
  const diffSec = Math.round((d - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return relativeFmt.format(diffSec, "second");
  if (abs < 3600) return relativeFmt.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400)
    return relativeFmt.format(Math.round(diffSec / 3600), "hour");
  return relativeFmt.format(Math.round(diffSec / 86_400), "day");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function truncate(value: string | null | undefined, max = 80): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

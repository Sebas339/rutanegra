/** Convert "HH:mm" (24h) to "hh:mm AM/PM" */
export const formatTime12 = (time: string | null | undefined): string => {
  if (!time) return "Por definir";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Add minutes to "HH:mm" and return 12h format */
export const formatTimeOffset = (time: string | null | undefined, offsetMin: number): string => {
  if (!time) return "Por definir";
  const [h, m] = time.split(":").map(Number);
  const d = new Date(0, 0, 0, h, m + offsetMin);
  const suffix = d.getHours() >= 12 ? "PM" : "AM";
  const h12 = d.getHours() % 12 || 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${suffix}`;
};

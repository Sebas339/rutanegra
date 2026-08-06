/**
 * An event is considered "past" the day AFTER its scheduled date.
 * Example: event on 2025-01-16 → still active on the 16th, becomes past on the 17th.
 */
export const isEventPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  // dateStr expected as "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  const eventDay = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Past only when today is strictly AFTER the event day (next day or later)
  return today.getTime() > eventDay.getTime();
};

import type { ProviderApiHour, ProviderCity, ProviderHoursStatus, ProviderSchedule, ProviderScheduleSlot } from "./provider.types";

export const providerDayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function getProviderCityName(city: ProviderCity) {
  return typeof city === "string" ? city : city?.name ?? "";
}

export function hasDisplayableProviderHours(hours: ProviderHoursStatus | null | undefined) {
  if (!hours || hours.remark?.trim().toLowerCase() === "hours unavailable") return false;

  const schedule = hours.schedule;
  return !schedule || Object.values(schedule).some((slots) => slots.length > 0);
}

export function normalizeProviderHours(hour: ProviderApiHour | null | undefined): (ProviderHoursStatus & { schedule: ProviderSchedule }) | null {
  if (!hour) return null;

  return {
    status: hour.current_opening_status,
    next_closing_time: hour.next_closing_time,
    remark: hour.opening_remark,
    schedule: Object.fromEntries(
      providerDayNames.map((day, index) => [
        day,
        hour.schedule.find((entry) => entry.day === index)?.slots ?? [],
      ]),
    ),
  };
}

export function formatProviderTime(value: string) {
  const match = value.match(/(?:T)?(\d{2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  const minutes = match[2];
  return `${hour % 12 || 12}${minutes === "00" ? "" : `:${minutes}`} ${hour >= 12 ? "PM" : "AM"}`;
}

export function formatProviderSlots(slots: ProviderScheduleSlot[] | undefined) {
  if (!slots?.length) return "Closed";
  return slots.map(({ opens_at, closes_at }) => `${formatProviderTime(opens_at)} - ${formatProviderTime(closes_at)}`).join(", ");
}

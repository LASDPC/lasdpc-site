import { areIntervalsOverlapping } from "date-fns";

export const START_HOUR = 8;
export const END_HOUR = 22;
export const PX_PER_HOUR = 60; // 1px per minute; easy mental model + stable for tests

export function clampToDayWindow(date: Date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(START_HOUR, 0, 0, 0);
  const end = new Date(d);
  end.setHours(END_HOUR, 0, 0, 0);
  return { start, end };
}

export function minutesFromWindowStart(windowStart: Date, t: Date) {
  return Math.round((t.getTime() - windowStart.getTime()) / (1000 * 60));
}

export function eventOverlapsDayWindow(windowStart: Date, windowEnd: Date, evStart: Date, evEnd: Date) {
  return areIntervalsOverlapping(
    { start: evStart, end: evEnd },
    { start: windowStart, end: windowEnd },
    { inclusive: false }
  );
}


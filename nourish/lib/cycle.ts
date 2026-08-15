/**
 * Cycle Engine
 * Simple, transparent cycle-day math. Everything here is an ESTIMATE,
 * never presented as medically exact, and always based on the user's
 * own recorded average cycle length (never a hardcoded 28-day assumption).
 */

export interface CycleInfo {
  lastPeriodStart: Date;
  averageCycleLength: number;
  periodDuration: number;
}

export function getCycleDay(cycle: CycleInfo, onDate: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(cycle.lastPeriodStart);
  start.setHours(0, 0, 0, 0);
  const target = new Date(onDate);
  target.setHours(0, 0, 0, 0);

  let diffDays = Math.floor((target.getTime() - start.getTime()) / msPerDay) + 1;

  // Wrap into the current cycle if the last recorded period is more than
  // one cycle length in the past (keeps the day sensible without requiring
  // the user to log every single period).
  if (diffDays > cycle.averageCycleLength) {
    diffDays = ((diffDays - 1) % cycle.averageCycleLength) + 1;
  }
  if (diffDays < 1) diffDays = 1;

  return diffDays;
}

export function isOnPeriod(cycle: CycleInfo, onDate: Date = new Date()): boolean {
  const day = getCycleDay(cycle, onDate);
  return day <= cycle.periodDuration;
}

export function getEstimatedNextPeriod(cycle: CycleInfo, fromDate: Date = new Date()): Date {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(cycle.lastPeriodStart);
  start.setHours(0, 0, 0, 0);

  let next = new Date(start.getTime() + cycle.averageCycleLength * msPerDay);
  while (next.getTime() <= fromDate.getTime()) {
    next = new Date(next.getTime() + cycle.averageCycleLength * msPerDay);
  }
  return next;
}

/** Rough, non-diagnostic phase label — used only to add light context to AI prompts, never shown as medical fact. */
export function getCyclePhaseLabel(cycle: CycleInfo, onDate: Date = new Date()): string {
  const day = getCycleDay(cycle, onDate);
  const len = cycle.averageCycleLength;

  if (day <= cycle.periodDuration) return "menstrual";
  if (day <= Math.round(len * 0.45)) return "follicular";
  if (day <= Math.round(len * 0.55)) return "ovulatory";
  return "luteal";
}

export function getCalendarMonth(cycle: CycleInfo, year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      cycleDay: getCycleDay(cycle, date),
      isPeriod: isOnPeriod(cycle, date),
      phase: getCyclePhaseLabel(cycle, date),
    });
  }
  return days;
}

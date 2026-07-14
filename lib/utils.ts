import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Today's (or any Date's) calendar day in the runtime local timezone as YYYY-MM-DD.
 * Use this for "hari ini" defaults — never use toISOString().split('T')[0].
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD (or ISO datetime) as a pure calendar date at UTC midnight.
 * Avoids the bug where `new Date("YYYY-MM-DD")` is UTC but local constructors
 * depend on the server timezone.
 */
export function parseDateOnly(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      throw new Error('Invalid date');
    }
    return new Date(
      Date.UTC(
        dateInput.getUTCFullYear(),
        dateInput.getUTCMonth(),
        dateInput.getUTCDate()
      )
    );
  }

  const match = String(dateInput).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const d = Number(match[3]);
    return new Date(Date.UTC(y, m, d));
  }

  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`);
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Inclusive end of a calendar day (UTC) for range filters. */
export function endOfDateOnly(dateInput: string | Date): Date {
  const start = parseDateOnly(dateInput);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Extract YYYY-MM-DD from a stored date-only value.
 * Uses UTC so values stored via parseDateOnly keep the intended calendar day.
 */
export function toDateOnlyString(date: Date | string): string {
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a date-only field for display (calendar day, no timezone shift). */
export function formatDate(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateMedium(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateDayMonth(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateLong(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatDateYear(date: Date | string): string {
  const d = parseDateOnly(date);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

/** Shift codes used in absensi */
export type ShiftKey = 'D' | 'N' | 'D7' | 'N7';

export function isNightShift(shift: string | null | undefined): boolean {
  return !!shift && shift.startsWith('N');
}

/** Default jam masuk/pulang by shift (12 jam kerja). */
export function defaultHoursForShift(shift: string | null | undefined): {
  jamMasuk: string;
  jamPulang: string;
} {
  if (isNightShift(shift)) {
    return { jamMasuk: '19:00', jamPulang: '07:00' };
  }
  return { jamMasuk: '07:00', jamPulang: '19:00' };
}

/** Old app defaults that should no longer be shown. */
const LEGACY_DEFAULT_HOURS = [
  { jamMasuk: '08:00', jamPulang: '17:00' },
  { jamMasuk: '08:00', jamPulang: '17:00:00' },
];

/**
 * Resolve jam for popup: missing/legacy 08–17 → current shift defaults.
 * Custom times are kept.
 */
export function resolveHoursForPopup(
  jamMasuk: string | null | undefined,
  jamPulang: string | null | undefined,
  shift: string | null | undefined
): { jamMasuk: string; jamPulang: string } {
  const defaults = defaultHoursForShift(shift);
  const masuk = (jamMasuk || '').slice(0, 5);
  const pulang = (jamPulang || '').slice(0, 5);

  if (!masuk || !pulang) return defaults;

  const isLegacy = LEGACY_DEFAULT_HOURS.some(
    (d) => d.jamMasuk.slice(0, 5) === masuk && d.jamPulang.slice(0, 5) === pulang
  );
  if (isLegacy) return defaults;

  return { jamMasuk: masuk, jamPulang: pulang };
}

/**
 * Format HH:mm → "07.00 pagi" / "19.00 malam" (24 jam, tanpa AM/PM).
 */
export function formatJamId(time: string | null | undefined): string {
  if (!time) return '–';
  const [hStr, mStr = '00'] = time.split(':');
  const h = Number(hStr);
  const m = String(mStr).padStart(2, '0');
  if (Number.isNaN(h)) return time;

  let period: string;
  if (h === 0) period = 'tengah malam';
  else if (h < 11) period = 'pagi';
  else if (h < 15) period = 'siang';
  else if (h < 18) period = 'sore';
  else period = 'malam';

  return `${String(h).padStart(2, '0')}.${m} ${period}`;
}

/** Options for 24h time select (every hour). */
export function jamOptions24(stepMinutes = 60): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

/**
 * Validate jam masuk/pulang. Night shifts may cross midnight (pulang < masuk).
 */
export function isValidWorkHours(
  jamMasuk: string,
  jamPulang: string,
  shift?: string | null
): boolean {
  if (!jamMasuk || !jamPulang) return false;
  if (isNightShift(shift)) return jamMasuk !== jamPulang;
  return jamPulang > jamMasuk;
}

/**
 * Work period: 19th of month → 18th of next month.
 * Used by timesheet, report, and absensi so all pages share one definition.
 *
 * - Anchor by "today": which period is currently active
 * - Anchor by end month: period that ends on the 18th of that month
 */
export function getActiveWorkPeriod(date: Date = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  if (d >= 19) {
    // 19 this month → 18 next month
    return {
      startDate: new Date(y, m, 19),
      endDate: new Date(y, m + 1, 18),
    };
  }
  // 19 prev month → 18 this month
  return {
    startDate: new Date(y, m - 1, 19),
    endDate: new Date(y, m, 18),
  };
}

/** Period ending on the 18th of `endYear`/`endMonth` (0-indexed month). */
export function getWorkPeriodByEndMonth(
  endYear: number,
  endMonth: number
): { startDate: Date; endDate: Date } {
  return {
    startDate: new Date(endYear, endMonth - 1, 19),
    endDate: new Date(endYear, endMonth, 18),
  };
}

export function formatWorkPeriodLabel(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  const end = endDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${start} – ${end}`;
}

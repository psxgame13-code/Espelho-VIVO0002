/** Distância em km entre dois pontos (Haversine) */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Filtra saltos irreais de GPS */
export function isPlausibleMovement(
  distanceKm: number,
  timeDeltaMs: number,
  maxSpeedKmh = 200
): boolean {
  if (timeDeltaMs <= 0) return false;
  const hours = timeDeltaMs / 3_600_000;
  return distanceKm / hours <= maxSpeedKmh;
}

// ========== Armazenamento local dos km por dia ==========

const STORAGE_KEY = 'espelho-vivo:distance-by-day';

function loadAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDistanceKm(km: number, date = new Date()) {
  if (!km || km <= 0) return;
  const key = dayKey(date);
  const all = loadAll();
  all[key] = (all[key] || 0) + km;
  saveAll(all);
}

function getDistanceBetween(start: Date, end: Date): number {
  const all = loadAll();
  let total = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    total += all[dayKey(cursor)] || 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

export function getTodayKm(): number {
  return loadAll()[dayKey(new Date())] || 0;
}

export function getWeekKm(): number {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return getDistanceBetween(monday, now);
}

export function getMonthKm(): number {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return getDistanceBetween(first, now);
}

export function getYearKm(): number {
  const now = new Date();
  const first = new Date(now.getFullYear(), 0, 1);
  return getDistanceBetween(first, now);
}
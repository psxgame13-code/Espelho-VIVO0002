/* =========================================================
   SENSOR 001 — v2.2 — HISTÓRICO LOCAL (§55 — privacidade)
   Armazena apenas características derivadas por dia,
   nunca o fluxo bruto dos sensores. Tudo fica no aparelho.
   ========================================================= */

   import type { ActivityState } from './types';

   const STORAGE_KEY = 'espelho_vivo:sensor001:history';
   
   export interface DayRecord {
     stillMs: number;
     walkingMs: number;
     vehicleMs: number;
     km: number;
     kmWalking: number;
     kmVehicle: number;
     steps: number;
   }
   
   export type HistoryMap = Record<string, DayRecord>;
   
   const emptyDay = (): DayRecord => ({
     stillMs: 0,
     walkingMs: 0,
     vehicleMs: 0,
     km: 0,
     kmWalking: 0,
     kmVehicle: 0,
     steps: 0,
   });
   
   export function dayKey(date = new Date()): string {
     const y = date.getFullYear();
     const m = String(date.getMonth() + 1).padStart(2, '0');
     const d = String(date.getDate()).padStart(2, '0');
     return `${y}-${m}-${d}`;
   }
   
   export function loadHistory(): HistoryMap {
     try {
       const raw = localStorage.getItem(STORAGE_KEY);
       return raw ? (JSON.parse(raw) as HistoryMap) : {};
     } catch {
       return {};
     }
   }
   
   function saveHistory(data: HistoryMap) {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
     } catch (e) {
       console.error('Sensor001: falha ao salvar histórico', e);
     }
   }
   
   /** Soma tempo ao estado atual e distância/passos do evento. */
   export function recordSample(
     state: ActivityState,
     deltaMs: number,
     distanceMeters: number,
     steps: number,
     date = new Date()
   ): HistoryMap {
     const all = loadHistory();
     const key = dayKey(date);
     const day = { ...emptyDay(), ...(all[key] ?? {}) };
   
     if (deltaMs > 0 && deltaMs < 5 * 60_000) {
       if (state === 'STILL') day.stillMs += deltaMs;
       if (state === 'WALKING') day.walkingMs += deltaMs;
       if (state === 'VEHICLE') day.vehicleMs += deltaMs;
     }
   
     if (distanceMeters > 0) {
       const km = distanceMeters / 1000;
       day.km += km;
       if (state === 'WALKING') day.kmWalking += km;
       if (state === 'VEHICLE') day.kmVehicle += km;
     }
   
     if (steps > 0) day.steps += steps;
   
     all[key] = day;
     saveHistory(all);
     return all;
   }
   
   function sumRange(all: HistoryMap, start: Date, end: Date): DayRecord {
     const total = emptyDay();
     const cursor = new Date(start);
     cursor.setHours(0, 0, 0, 0);
     const last = new Date(end);
     last.setHours(0, 0, 0, 0);
   
     while (cursor <= last) {
       const day = all[dayKey(cursor)];
       if (day) {
         total.stillMs += day.stillMs || 0;
         total.walkingMs += day.walkingMs || 0;
         total.vehicleMs += day.vehicleMs || 0;
         total.km += day.km || 0;
         total.kmWalking += day.kmWalking || 0;
         total.kmVehicle += day.kmVehicle || 0;
         total.steps += day.steps || 0;
       }
       cursor.setDate(cursor.getDate() + 1);
     }
     return total;
   }
   
   export function getToday(all = loadHistory()): DayRecord {
     return { ...emptyDay(), ...(all[dayKey()] ?? {}) };
   }
   
   export function getWeek(all = loadHistory()): DayRecord {
     const now = new Date();
     const weekday = now.getDay();
     const diffToMonday = weekday === 0 ? 6 : weekday - 1;
     const monday = new Date(now);
     monday.setDate(now.getDate() - diffToMonday);
     return sumRange(all, monday, now);
   }
   
   export function getMonth(all = loadHistory()): DayRecord {
     const now = new Date();
     return sumRange(all, new Date(now.getFullYear(), now.getMonth(), 1), now);
   }
   
   export function getYear(all = loadHistory()): DayRecord {
     const now = new Date();
     return sumRange(all, new Date(now.getFullYear(), 0, 1), now);
   }
   
   /** Exportação dos dados do usuário (§55) — tudo que está guardado. */
   export function exportHistory(): string {
     return JSON.stringify(loadHistory(), null, 2);
   }
   
   export function clearHistory() {
     localStorage.removeItem(STORAGE_KEY);
   }
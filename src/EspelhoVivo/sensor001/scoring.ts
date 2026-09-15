/* =========================================================
   SENSOR 001 — v2.2 — SCORES, MARGEM E CONFIANÇA
   §25 a §30
   Dado ausente NÃO pontua e NÃO é tratado como zero (§40).
   ========================================================= */

   import { PARAMS } from './params';
   import type { ActivityState, ConfidenceLevel, FeatureVector, Scores } from './types';
   
   /* ---------------- §25 — PARADO ---------------- */
   export function scoreStill(f: FeatureVector): number {
     let s = 0;
   
     if (f.speedKmh !== null && f.speedKmh < PARAMS.SPEED_STILL_MAX) s += 30;
     if (f.stepFrequency < PARAMS.FSTEPS_STILL_MAX) s += 25;
     if (f.vibrationEnergy !== null && f.vibrationEnergy < PARAMS.VIB_STILL_MAX) s += 20;
     if (f.angularVariance !== null && f.angularVariance < PARAMS.ANG_VAR_STILL_MAX) s += 15;
     if (
       f.gpsQuality !== null &&
       f.gpsQuality >= 0.8 &&
       f.speedKmh !== null &&
       f.speedKmh < PARAMS.SPEED_STILL_MAX
     ) {
       s += 10;
     }
   
     return s;
   }
   
   /* ---------------- §26 — CAMINHANDO ---------------- */
   export function scoreWalking(f: FeatureVector): number {
     let s = 0;
   
     if (
       f.speedKmh !== null &&
       f.speedKmh >= PARAMS.SPEED_WALK_MIN &&
       f.speedKmh <= PARAMS.SPEED_WALK_MAX
     ) {
       s += 25;
     }
     if (
       f.stepFrequency >= PARAMS.FSTEPS_WALK_MIN &&
       f.stepFrequency <= PARAMS.FSTEPS_WALK_MAX
     ) {
       s += 35;
     }
     if (f.stepRegularity !== null && f.stepRegularity > PARAMS.STEP_REGULARITY_TR) s += 15;
     if (
       f.vibrationEnergy !== null &&
       f.vibrationEnergy >= PARAMS.VIB_WALK_MIN &&
       f.vibrationEnergy <= PARAMS.VIB_WALK_MAX
     ) {
       s += 10;
     }
     if (f.angularVariance !== null && f.angularVariance > PARAMS.ANG_VAR_WALK_MIN) s += 15;
   
     return s;
   }
   
   /* ---------------- §27 — VEÍCULO ---------------- */
   export function scoreVehicle(f: FeatureVector, previousState: ActivityState | null): number {
     let s = 0;
   
     if (f.speedKmh !== null && f.speedKmh > PARAMS.SPEED_VEHICLE_MIN) s += 40;
     if (f.stepFrequency < PARAMS.FSTEPS_VEHICLE_MAX) s += 25;
     if (f.vibrationEnergy !== null && f.vibrationEnergy > PARAMS.VIB_VEHICLE_MIN) s += 20;
     if (f.angularVariance !== null && f.angularVariance < PARAMS.ANG_VAR_VEHICLE_MAX) s += 10;
     if (previousState === 'VEHICLE') s += 5; // persistência (§27)
   
     return s;
   }
   
   export function computeScores(
     f: FeatureVector,
     previousState: ActivityState | null
   ): Scores {
     return {
       STILL: scoreStill(f),
       WALKING: scoreWalking(f),
       VEHICLE: scoreVehicle(f, previousState),
     };
   }
   
   /** §29 — maior score, segundo maior e margem. */
   export function compareScores(scores: Scores) {
     const entries = (Object.entries(scores) as [ActivityState, number][]).sort(
       (a, b) => b[1] - a[1]
     );
   
     const [best, second] = entries;
   
     return {
       candidate: best[0],
       sMax: best[1],
       s2: second[1],
       margin: best[1] - second[1],
     };
   }
   
   /** §30 — nível de confiança (condição interna, nunca um 4º estado). */
   export function confidenceLevel(sMax: number, margin: number): ConfidenceLevel {
     if (margin >= PARAMS.MARGIN_HIGH && sMax >= PARAMS.SCORE_HIGH) return 'HIGH';
     if (margin < PARAMS.MARGIN_LOW || sMax < PARAMS.SCORE_LOW) return 'INSUFFICIENT';
     return 'LOW';
   }
   
   /**
    * Confiança numérica 0..1 para exibição/registro.
    * Combinação simples de força do score, margem e qualidade do GPS —
    * é a base da confiança composta prevista em §41.
    */
   export function confidenceValue(
     sMax: number,
     margin: number,
     gpsQuality: number | null
   ): number {
     const cScore = Math.min(1, sMax / 100);
     const cMargin = Math.min(1, margin / 40);
     const cGps = gpsQuality ?? 0.5;
   
     const value = 0.5 * cScore + 0.3 * cMargin + 0.2 * cGps;
     return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
   }
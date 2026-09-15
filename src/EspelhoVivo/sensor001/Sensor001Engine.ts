/* =========================================================
   SENSOR 001 — v2.2 — MOTOR DE CLASSIFICAÇÃO
   Características → Scores → Margem → Confiança → Persistência → Estado
   Este arquivo NÃO conhece APIs de sensores (§38).
   ========================================================= */

   import { FeatureExtractor } from './features';
   import { gpsQuality, localDistanceMeters, msToKmh } from './geo';
   import { PARAMS } from './params';
   import { compareScores, computeScores, confidenceLevel, confidenceValue } from './scoring';
   import type {
     AccelSample,
     AcquisitionMode,
     ActivityState,
     FeatureVector,
     GpsSample,
     GyroSample,
     SensorEvent,
   } from './types';
   
   export class Sensor001Engine {
     private features = new FeatureExtractor();
   
     private lastGps: GpsSample | null = null;
     private currentGps: GpsSample | null = null;
     private speedKmh: number | null = null;
     private speedSource: 'GNSS' | 'FALLBACK' | null = null;
     private pendingDistanceM = 0;
   
     private confirmedState: ActivityState | null = null;
     private candidate: ActivityState | null = null;
     private candidateCount = 0;
   
     private startedAt = Date.now();
     private stillSince: number | null = null;
     private acquisitionMode: AcquisitionMode = 'NORMAL';
   
     /* ------------------ ENTRADAS ------------------ */
   
     pushAccel(sample: AccelSample) {
       this.features.pushAccel(sample);
     }
   
     pushGyro(sample: GyroSample) {
       this.features.pushGyro(sample);
     }
   
     /** Entrada de GPS: velocidade (§7/§8) + distância com proteção de drift (§11). */
     pushGps(sample: GpsSample) {
       const quality = gpsQuality(sample.accuracy);
   
       if (sample.speed !== null && sample.speed >= 0) {
         this.speedKmh = msToKmh(sample.speed); // prioridade GNSS (§7)
         this.speedSource = 'GNSS';
       } else if (this.lastGps) {
         const dtS = (sample.t - this.lastGps.t) / 1000;
         if (dtS > 0) {
           const d = localDistanceMeters(
             this.lastGps.lat,
             this.lastGps.lng,
             sample.lat,
             sample.lng
           );
           const kmh = (d / dtS) * 3.6;
           if (kmh <= PARAMS.MAX_PLAUSIBLE_SPEED_KMH) {
             this.speedKmh = kmh; // fallback, menor prioridade (§8)
             this.speedSource = 'FALLBACK';
           }
         }
       }
   
       /* Acumulação de distância somente com qualidade suficiente (§11) */
       if (this.lastGps && quality !== null && quality >= PARAMS.C_GPS_MIN) {
         const d = localDistanceMeters(
           this.lastGps.lat,
           this.lastGps.lng,
           sample.lat,
           sample.lng
         );
         const dtS = Math.max((sample.t - this.lastGps.t) / 1000, 0.001);
         const kmh = (d / dtS) * 3.6;
   
         const minMove = Math.max(
           PARAMS.DRIFT_MIN_MOVE_M,
           sample.accuracy * PARAMS.DRIFT_ACCURACY_FACTOR
         );
   
         if (d >= minMove && kmh <= PARAMS.MAX_PLAUSIBLE_SPEED_KMH) {
           this.pendingDistanceM += d;
         }
       }
   
       this.lastGps = sample;
       this.currentGps = sample;
     }
   
     /** Sinaliza que o GPS ficou indisponível: velocidade vira AUSENTE, não zero (§40). */
     markGpsUnavailable() {
       this.speedKmh = null;
       this.speedSource = null;
     }
   
     /* ------------------ AVALIAÇÃO ------------------ */
   
     /** Retorna null enquanto não houver dados suficientes para a 1ª janela (§33). */
     evaluate(now = Date.now()): SensorEvent | null {
       const partial = this.features.compute(now, PARAMS.WINDOW_MS);
   
       const hasAnyEvidence =
         this.features.hasAccel() || this.speedKmh !== null || this.currentGps !== null;
   
       const elapsed = now - this.startedAt;
       if (!hasAnyEvidence || elapsed < PARAMS.WINDOW_MS / 2) return null;
   
       const gpsFresh =
         this.currentGps !== null && now - this.currentGps.t <= PARAMS.WINDOW_MS * 3;
   
       const f: FeatureVector = {
         windowMs: PARAMS.WINDOW_MS,
         speedKmh: gpsFresh ? this.speedKmh : null,
         speedSource: gpsFresh ? this.speedSource : null,
         gpsQuality: this.currentGps ? gpsQuality(this.currentGps.accuracy) : null,
         steps: partial.steps ?? 0,
         stepFrequency: partial.stepFrequency ?? 0,
         stepRegularity: partial.stepRegularity ?? null,
         vibrationEnergy: partial.vibrationEnergy ?? null,
         angularVelocity: partial.angularVelocity ?? null,
         angularVariance: partial.angularVariance ?? null,
         lat: this.currentGps?.lat ?? null,
         lng: this.currentGps?.lng ?? null,
       };
   
       const scores = computeScores(f, this.confirmedState);
       const { candidate, sMax, margin } = compareScores(scores);
       const level = confidenceLevel(sMax, margin);
   
       /* ---------- PERSISTÊNCIA (§31) ---------- */
       if (this.confirmedState === null) {
         // Inicialização (§33): primeira decisão suficientemente confiável
         if (level !== 'INSUFFICIENT') {
           this.confirmedState = candidate;
           this.candidate = candidate;
           this.candidateCount = 0;
         }
       } else if (candidate === this.confirmedState) {
         this.candidate = candidate;
         this.candidateCount = 0;
       } else if (level === 'HIGH') {
         if (this.candidate === candidate) {
           this.candidateCount += 1;
         } else {
           this.candidate = candidate;
           this.candidateCount = 1;
         }
         if (this.candidateCount >= PARAMS.PERSISTENCE_COUNT) {
           this.confirmedState = candidate; // estado confirmado
           this.candidateCount = 0;
         }
       } else {
         // Baixa confiança: mantém o estado atual (§32)
         this.candidateCount = 0;
         this.candidate = null;
       }
   
       if (this.confirmedState === null) return null;
   
       /* ---------- MODO DE AQUISIÇÃO (§34–§37) ---------- */
       this.updateAcquisitionMode(now, f);
   
       const distance = this.pendingDistanceM;
       this.pendingDistanceM = 0;
   
       return {
         timestamp: now,
         activity: this.confirmedState,
         confidence: confidenceValue(sMax, margin, f.gpsQuality),
         confidenceLevel: level,
         speed: f.speedKmh === null ? null : Math.round(f.speedKmh * 10) / 10,
         distance: Math.round(distance * 10) / 10,
         steps: f.steps,
         step_frequency: Math.round(f.stepFrequency * 100) / 100,
         step_regularity: f.stepRegularity,
         vibration_energy:
           f.vibrationEnergy === null ? null : Math.round(f.vibrationEnergy * 1000) / 1000,
         angular_velocity:
           f.angularVelocity === null ? null : Math.round(f.angularVelocity * 1000) / 1000,
         angular_variance:
           f.angularVariance === null ? null : Math.round(f.angularVariance * 10000) / 10000,
         latitude: f.lat,
         longitude: f.lng,
         gps_accuracy: this.currentGps?.accuracy ?? null,
         acquisition_mode: this.acquisitionMode,
         scores,
         margin,
       };
     }
   
     /** Entrada/saída do modo econômico (§35 e §37). */
     private updateAcquisitionMode(now: number, f: FeatureVector) {
       const lowVib =
         f.vibrationEnergy !== null && f.vibrationEnergy < PARAMS.ECONOMY_VIB_MAX;
       const lowAng =
         f.angularVariance === null || f.angularVariance < PARAMS.ECONOMY_ANG_VAR_MAX;
       const noSteps = f.stepFrequency < PARAMS.FSTEPS_STILL_MAX;
       const lowSpeed = f.speedKmh === null || f.speedKmh < PARAMS.SPEED_STILL_MAX;
   
       const restCondition =
         this.confirmedState === 'STILL' && lowVib && lowAng && noSteps && lowSpeed;
   
       if (restCondition) {
         if (this.stillSince === null) this.stillSince = now;
         if (
           now - this.stillSince >= PARAMS.ECONOMY_AFTER_MS &&
           this.acquisitionMode !== 'ECONOMICO'
         ) {
           this.acquisitionMode = 'ECONOMICO';
         }
         return;
       }
   
       this.stillSince = null;
   
       if (this.acquisitionMode === 'ECONOMICO') {
         this.acquisitionMode = 'TRANSICAO'; // reativação da aquisição (§37)
       } else if (this.acquisitionMode === 'TRANSICAO') {
         this.acquisitionMode = 'NORMAL';
       }
     }
   
     getAcquisitionMode(): AcquisitionMode {
       return this.acquisitionMode;
     }
   
     getState(): ActivityState | null {
       return this.confirmedState;
     }
   
     reset() {
       this.features.reset();
       this.lastGps = null;
       this.currentGps = null;
       this.speedKmh = null;
       this.speedSource = null;
       this.pendingDistanceM = 0;
       this.confirmedState = null;
       this.candidate = null;
       this.candidateCount = 0;
       this.startedAt = Date.now();
       this.stillSince = null;
       this.acquisitionMode = 'NORMAL';
     }
   }
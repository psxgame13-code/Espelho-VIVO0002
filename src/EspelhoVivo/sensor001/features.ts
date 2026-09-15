/* =========================================================
   SENSOR 001 — v2.2 — EXTRAÇÃO DE CARACTERÍSTICAS
   §12 a §23 — acelerômetro, passos, vibração, giroscópio
   ========================================================= */

   import { PARAMS } from './params';
   import type { AccelSample, FeatureVector, GyroSample } from './types';
   
   interface DynSample {
     t: number;
     mag: number; // A_dyn
   }
   
   interface OmegaSample {
     t: number;
     omega: number; // Ω (rad/s)
   }
   
   export class FeatureExtractor {
     /* estado do filtro passa-baixas adaptativo (§13/§15) */
     private gravity: { x: number; y: number; z: number } | null = null;
     private lastAccelT: number | null = null;
   
     private dyn: DynSample[] = [];
     private omega: OmegaSample[] = [];
     private stepTimes: number[] = [];
   
     /* máquina de estados da detecção de passo (§17) */
     private rising = false;
     private peakValue = 0;
     private peakTime = 0;
     private lastStepTime: number | null = null;
   
     /** Entrada do acelerômetro (aceleração COM gravidade). */
     pushAccel(sample: AccelSample): void {
       const { t, x, y, z } = sample;
   
       if (this.gravity === null || this.lastAccelT === null) {
         this.gravity = { x, y, z };
         this.lastAccelT = t;
         return;
       }
   
       const dt = Math.max((t - this.lastAccelT) / 1000, 0.001); // segundos
       this.lastAccelT = t;
   
       // α = τ / (τ + Δt)  — recalculado a cada amostra (§13/§14)
       const alpha = PARAMS.TAU_S / (PARAMS.TAU_S + dt);
   
       this.gravity = {
         x: alpha * this.gravity.x + (1 - alpha) * x,
         y: alpha * this.gravity.y + (1 - alpha) * y,
         z: alpha * this.gravity.z + (1 - alpha) * z,
       };
   
       // Aceleração dinâmica (§16)
       const dx = x - this.gravity.x;
       const dy = y - this.gravity.y;
       const dz = z - this.gravity.z;
       const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
   
       this.dyn.push({ t, mag });
       this.detectStep(t, mag);
     }
   
     /** Detecção de passo: limite → pico → queda → intervalo válido (§17/§18). */
     private detectStep(t: number, mag: number): void {
       if (mag > PARAMS.STEP_THRESHOLD) {
         if (!this.rising || mag > this.peakValue) {
           this.peakValue = mag;
           this.peakTime = t;
         }
         this.rising = true;
         return;
       }
   
       if (!this.rising) return;
   
       // queda após o pico
       this.rising = false;
   
       const intervalS =
         this.lastStepTime === null ? null : (this.peakTime - this.lastStepTime) / 1000;
   
       if (intervalS === null || intervalS >= PARAMS.STEP_MIN_INTERVAL_S) {
         this.stepTimes.push(this.peakTime);
         this.lastStepTime = this.peakTime;
       }
   
       this.peakValue = 0;
     }
   
     /** Entrada do giroscópio (rad/s) — §22. */
     pushGyro(sample: GyroSample): void {
       const omega = Math.sqrt(
         sample.x * sample.x + sample.y * sample.y + sample.z * sample.z
       );
       this.omega.push({ t: sample.t, omega });
     }
   
     /** Remove amostras fora da janela deslizante (§5). */
     prune(now: number, windowMs = PARAMS.WINDOW_MS): void {
       const limit = now - windowMs;
       this.dyn = this.dyn.filter((s) => s.t >= limit);
       this.omega = this.omega.filter((s) => s.t >= limit);
       this.stepTimes = this.stepTimes.filter((t) => t >= limit);
     }
   
     hasAccel(): boolean {
       return this.dyn.length > 0;
     }
   
     hasGyro(): boolean {
       return this.omega.length > 0;
     }
   
     /** Características da janela atual (parcial — o GPS é somado pelo motor). */
     compute(now: number, windowMs = PARAMS.WINDOW_MS) {
       this.prune(now, windowMs);
       const windowS = windowMs / 1000;
   
       /* --- passos (§19) --- */
       const steps = this.stepTimes.length;
       const stepFrequency = steps / windowS;
   
       /* --- regularidade (§20) --- */
       let stepRegularity: number | null = null;
       if (steps >= 3) {
         const intervals: number[] = [];
         for (let i = 1; i < this.stepTimes.length; i++) {
           const dt = (this.stepTimes[i] - this.stepTimes[i - 1]) / 1000;
           if (dt <= PARAMS.STEP_MAX_INTERVAL_S * 2) intervals.push(dt);
         }
         if (intervals.length >= 2) {
           const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
           if (mean > 0) {
             const variance =
               intervals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / intervals.length;
             const sd = Math.sqrt(variance);
             stepRegularity = Math.max(0, Math.min(1, 1 - sd / mean));
           }
         }
       }
   
       /* --- energia de vibração (§21) --- */
       let vibrationEnergy: number | null = null;
       if (this.dyn.length > 0) {
         vibrationEnergy =
           this.dyn.reduce((acc, s) => acc + s.mag * s.mag, 0) / this.dyn.length;
       }
   
       /* --- giroscópio (§22) --- */
       let angularVelocity: number | null = null;
       let angularVariance: number | null = null;
       if (this.omega.length > 1) {
         const mean = this.omega.reduce((a, s) => a + s.omega, 0) / this.omega.length;
         angularVelocity = mean;
         angularVariance =
           this.omega.reduce((acc, s) => acc + (s.omega - mean) ** 2, 0) / this.omega.length;
       } else if (this.omega.length === 1) {
         angularVelocity = this.omega[0].omega;
       }
   
       return {
         steps,
         stepFrequency,
         stepRegularity,
         vibrationEnergy,
         angularVelocity,
         angularVariance,
       } satisfies Partial<FeatureVector>;
     }
   
     reset(): void {
       this.gravity = null;
       this.lastAccelT = null;
       this.dyn = [];
       this.omega = [];
       this.stepTimes = [];
       this.rising = false;
       this.peakValue = 0;
       this.lastStepTime = null;
     }
   }
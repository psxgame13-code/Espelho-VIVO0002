/* =========================================================
   SENSOR 001 — v2.2 — TIPOS
   Projeto LIFE OS / Espelho Vivo
   ========================================================= */

/** Estados públicos. Não existe INDEFINIDO (§2). */
export type ActivityState = 'STILL' | 'WALKING' | 'VEHICLE';

/** Modo de aquisição — NÃO é atividade do usuário (§3). */
export type AcquisitionMode = 'NORMAL' | 'ECONOMICO' | 'TRANSICAO';

/** Condição interna de confiança (§30). Nunca vira um 4º estado. */
export type ConfidenceLevel = 'HIGH' | 'LOW' | 'INSUFFICIENT';

export interface AccelSample {
  t: number; // ms
  x: number;
  y: number;
  z: number; // m/s² (inclui gravidade)
}

export interface GyroSample {
  t: number; // ms
  x: number;
  y: number;
  z: number; // rad/s
}

export interface GpsSample {
  t: number; // ms
  lat: number;
  lng: number;
  accuracy: number; // metros (precisão horizontal)
  speed: number | null; // m/s vindo do GNSS (prioritário, §7)
}

/**
 * Vetor de características da janela (§23).
 * null = DADO AUSENTE. Nunca converter ausência em zero (§40).
 */
export interface FeatureVector {
  windowMs: number;
  speedKmh: number | null;
  speedSource: 'GNSS' | 'FALLBACK' | null;
  gpsQuality: number | null; // C_GPS
  steps: number;
  stepFrequency: number; // f_steps (Hz)
  stepRegularity: number | null; // R_steps
  vibrationEnergy: number | null; // E_vib (m²/s⁴)
  angularVelocity: number | null; // Ω média (rad/s)
  angularVariance: number | null; // σ²ω (rad²/s²)
  lat: number | null;
  lng: number | null;
}

export interface Scores {
  STILL: number;
  WALKING: number;
  VEHICLE: number;
}

/** Evento sensorial (§39). */
export interface SensorEvent {
  timestamp: number;
  activity: ActivityState;
  confidence: number; // 0..1
  confidenceLevel: ConfidenceLevel;
  speed: number | null; // km/h
  distance: number; // metros acumulados desde o último evento
  steps: number;
  step_frequency: number;
  step_regularity: number | null;
  vibration_energy: number | null;
  angular_velocity: number | null;
  angular_variance: number | null;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  acquisition_mode: AcquisitionMode;
  scores: Scores;
  margin: number;
}

export type GpsStatus = 'loading' | 'active' | 'error' | 'economy';
export type MotionPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';
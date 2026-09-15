/* =========================================================
   SENSOR 001 — v2.2 — PARÂMETROS INICIAIS (§24)
   TODOS os valores aqui são parâmetros de calibração (§49).
   Alterar somente neste arquivo.
   ========================================================= */

   export const PARAMS = {
    /* Janela temporal (§5) */
    WINDOW_MS: 10_000, // W = 10 s
    EVAL_INTERVAL_MS: 2_000, // avaliação a cada 2 s (independente de W)
  
    /* Filtro passa-baixas adaptativo (§13) — α = τ / (τ + Δt) */
    TAU_S: 0.3,
  
    /* Detecção de passos (§17, §18) */
    STEP_THRESHOLD: 1.5, // L_limite (m/s²)
    STEP_MIN_INTERVAL_S: 0.33, // T_min
    STEP_MAX_INTERVAL_S: 1.0, // T_max
  
    /* Qualidade do GPS (§9) */
    C_GPS_MIN: 0.3, // C_min
  
    /* Regularidade (§20) */
    STEP_REGULARITY_TR: 0.65,
  
    /* Vibração (§21) */
    VIB_STILL_MAX: 0.3, // m²/s⁴
    VIB_VEHICLE_MIN: 0.8,
    VIB_WALK_MIN: 0.5,
    VIB_WALK_MAX: 3.5,
  
    /* Movimento angular (§22) */
    ANG_VAR_STILL_MAX: 0.015, // rad²/s²
    ANG_VAR_WALK_MIN: 0.03,
    ANG_VAR_VEHICLE_MAX: 0.02,
  
    /* Velocidade (km/h) — §25, §26, §27 */
    SPEED_STILL_MAX: 2,
    SPEED_WALK_MIN: 2,
    SPEED_WALK_MAX: 7,
    SPEED_VEHICLE_MIN: 15,
  
    /* Frequência de passos (Hz) */
    FSTEPS_STILL_MAX: 0.2,
    FSTEPS_WALK_MIN: 1,
    FSTEPS_WALK_MAX: 3,
    FSTEPS_VEHICLE_MAX: 0.3,
  
    /* Margem e confiança (§29, §30) */
    MARGIN_HIGH: 15,
    MARGIN_LOW: 8,
    SCORE_HIGH: 50,
    SCORE_LOW: 40,
  
    /* Persistência (§31) */
    PERSISTENCE_COUNT: 2, // avaliações consecutivas dominantes
  
    /* Modo econômico (§35) */
    ECONOMY_AFTER_MS: 30_000,
    ECONOMY_VIB_MAX: 0.2,
    ECONOMY_ANG_VAR_MAX: 0.01,
    ECONOMY_GPS_INTERVAL_MS: 120_000, // aquisição reduzida, NÃO desligada (§36)
  
    /* Proteção contra drift de GPS (§11) */
    DRIFT_MIN_MOVE_M: 5, // deslocamento mínimo para acumular
    DRIFT_ACCURACY_FACTOR: 0.5, // e também > accuracy * fator
    MAX_PLAUSIBLE_SPEED_KMH: 200,
  } as const;
  
  export type SensorParams = typeof PARAMS;
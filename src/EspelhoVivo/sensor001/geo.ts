/* =========================================================
   SENSOR 001 — v2.2 — GEO (§9, §10, §11)
   ========================================================= */

   const R = 6_371_000; // metros
   const toRad = (deg: number) => (deg * Math.PI) / 180;
   
   /**
    * Distância local aproximada em METROS (§10).
    * Aproximação esférica/local — não é cálculo geodésico WGS-84 exato.
    */
   export function localDistanceMeters(
     lat1: number,
     lon1: number,
     lat2: number,
     lon2: number
   ): number {
     const dPhi = toRad(lat2 - lat1);
     const dLambda = toRad(lon2 - lon1);
     const phiM = toRad((lat1 + lat2) / 2);
   
     return R * Math.sqrt(dPhi * dPhi + Math.pow(Math.cos(phiM) * dLambda, 2));
   }
   
   /** Qualidade da localização C_GPS a partir da precisão horizontal (§9). */
   export function gpsQuality(accuracyMeters: number | null | undefined): number | null {
     if (accuracyMeters === null || accuracyMeters === undefined || Number.isNaN(accuracyMeters)) {
       return null; // dado ausente ≠ zero (§40)
     }
     if (accuracyMeters <= 5) return 1.0;
     if (accuracyMeters <= 10) return 0.8;
     if (accuracyMeters <= 20) return 0.6;
     if (accuracyMeters <= 50) return 0.3;
     return 0;
   }
   
   /** Conversão de velocidade GNSS (m/s) para km/h (§7). */
   export function msToKmh(speedMs: number): number {
     return speedMs * 3.6;
   }
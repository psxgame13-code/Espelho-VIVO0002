/* =========================================================
   SENSOR 001 — v2.2 — MOTOR DE AQUISIÇÃO (§34 a §38)
   Separado do motor de classificação: trocar a estratégia de
   coleta aqui não altera a matemática do Sensor001Engine.
   ========================================================= */

   import { PARAMS } from './params';
   import type {
     AccelSample,
     AcquisitionMode,
     GpsSample,
     GpsStatus,
     GyroSample,
     MotionPermission,
   } from './types';
   
   interface AcquisitionCallbacks {
     onAccel: (s: AccelSample) => void;
     onGyro: (s: GyroSample) => void;
     onGps: (s: GpsSample) => void;
     onGpsUnavailable: () => void;
     onGpsStatus: (status: GpsStatus) => void;
     onMotionPermission: (p: MotionPermission) => void;
   }
   
   const DEG_TO_RAD = Math.PI / 180;
   
   type DeviceMotionEventIOS = typeof DeviceMotionEvent & {
     requestPermission?: () => Promise<'granted' | 'denied'>;
   };
   
   export class AcquisitionEngine {
     private cb: AcquisitionCallbacks;
     private mode: AcquisitionMode = 'NORMAL';
   
     private watchId: number | null = null;
     private economyTimer: ReturnType<typeof setInterval> | null = null;
     private motionAttached = false;
   
     constructor(cb: AcquisitionCallbacks) {
       this.cb = cb;
     }
   
     /* ---------------- PERMISSÃO DE MOVIMENTO (iOS 13+) ---------------- */
   
     static needsMotionPermission(): boolean {
       return (
         typeof DeviceMotionEvent !== 'undefined' &&
         typeof (DeviceMotionEvent as DeviceMotionEventIOS).requestPermission === 'function'
       );
     }
   
     async requestMotionPermission(): Promise<MotionPermission> {
       if (typeof DeviceMotionEvent === 'undefined') {
         this.cb.onMotionPermission('unsupported');
         return 'unsupported';
       }
   
       const request = (DeviceMotionEvent as DeviceMotionEventIOS).requestPermission;
   
       if (typeof request !== 'function') {
         this.attachMotion();
         this.cb.onMotionPermission('granted');
         return 'granted';
       }
   
       try {
         const result = await request();
         if (result === 'granted') {
           this.attachMotion();
           this.cb.onMotionPermission('granted');
           return 'granted';
         }
         this.cb.onMotionPermission('denied');
         return 'denied';
       } catch {
         this.cb.onMotionPermission('denied');
         return 'denied';
       }
     }
   
     /* ---------------- CICLO DE VIDA ---------------- */
   
     start() {
       if (!AcquisitionEngine.needsMotionPermission()) {
         this.attachMotion();
         this.cb.onMotionPermission(
           typeof DeviceMotionEvent === 'undefined' ? 'unsupported' : 'granted'
         );
       }
       this.startGpsNormal();
     }
   
     stop() {
       this.detachMotion();
       this.stopGps();
     }
   
     /** Aplica o modo decidido pelo motor de classificação. */
     setMode(mode: AcquisitionMode) {
       if (mode === this.mode) return;
   
       const wasEconomy = this.mode === 'ECONOMICO';
       const isEconomy = mode === 'ECONOMICO';
       this.mode = mode;
   
       // Só reinicia a coleta quando a estratégia realmente muda
       if (isEconomy === wasEconomy) return;
   
       if (isEconomy) {
         this.startGpsEconomy();
       } else {
         this.startGpsNormal();
       }
     }
   
     /* ---------------- ACELERÔMETRO / GIROSCÓPIO ---------------- */
   
     private handleMotion = (event: DeviceMotionEvent) => {
       const t = Date.now();
   
       const acc = event.accelerationIncludingGravity ?? event.acceleration;
       if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
         this.cb.onAccel({ t, x: acc.x, y: acc.y, z: acc.z });
       }
   
       const rot = event.rotationRate;
       if (rot && (rot.alpha !== null || rot.beta !== null || rot.gamma !== null)) {
         // rotationRate vem em graus/s — convertido para rad/s (§22)
         this.cb.onGyro({
           t,
           x: (rot.beta ?? 0) * DEG_TO_RAD,
           y: (rot.gamma ?? 0) * DEG_TO_RAD,
           z: (rot.alpha ?? 0) * DEG_TO_RAD,
         });
       }
     };
   
     private attachMotion() {
       if (this.motionAttached || typeof window === 'undefined') return;
       window.addEventListener('devicemotion', this.handleMotion);
       this.motionAttached = true;
     }
   
     private detachMotion() {
       if (!this.motionAttached) return;
       window.removeEventListener('devicemotion', this.handleMotion);
       this.motionAttached = false;
     }
   
     /* ---------------- GPS ADAPTATIVO ---------------- */
   
     private handlePosition = (position: GeolocationPosition) => {
       const { latitude, longitude, accuracy, speed } = position.coords;
       this.cb.onGps({
         t: position.timestamp || Date.now(),
         lat: latitude,
         lng: longitude,
         accuracy: accuracy ?? 9999,
         speed: typeof speed === 'number' && !Number.isNaN(speed) ? speed : null,
       });
       this.cb.onGpsStatus(this.mode === 'ECONOMICO' ? 'economy' : 'active');
     };
   
     private handlePositionError = () => {
       this.cb.onGpsUnavailable();
       this.cb.onGpsStatus('error');
     };
   
     private stopGps() {
       if (this.watchId !== null) {
         navigator.geolocation.clearWatch(this.watchId);
         this.watchId = null;
       }
       if (this.economyTimer !== null) {
         clearInterval(this.economyTimer);
         this.economyTimer = null;
       }
     }
   
     private startGpsNormal() {
       if (!('geolocation' in navigator)) {
         this.cb.onGpsStatus('error');
         this.cb.onGpsUnavailable();
         return;
       }
   
       this.stopGps();
       this.cb.onGpsStatus('loading');
   
       this.watchId = navigator.geolocation.watchPosition(
         this.handlePosition,
         this.handlePositionError,
         { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 }
       );
     }
   
     /** Modo econômico NÃO desliga o GPS: reduz a frequência (§36). */
     private startGpsEconomy() {
       if (!('geolocation' in navigator)) return;
   
       this.stopGps();
       this.cb.onGpsStatus('economy');
   
       const poll = () => {
         navigator.geolocation.getCurrentPosition(
           this.handlePosition,
           this.handlePositionError,
           {
             enableHighAccuracy: false,
             timeout: 30_000,
             maximumAge: PARAMS.ECONOMY_GPS_INTERVAL_MS,
           }
         );
       };
   
       poll();
       this.economyTimer = setInterval(poll, PARAMS.ECONOMY_GPS_INTERVAL_MS);
     }
   }
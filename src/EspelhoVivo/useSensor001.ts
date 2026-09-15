/* =========================================================
   SENSOR 001 — v2.2 — HOOK REACT
   Liga: aquisição → motor de classificação → histórico local
   ========================================================= */

   import { useCallback, useEffect, useRef, useState } from 'react';
   import { AcquisitionEngine } from './sensor001/acquisition';
   import {
     getMonth,
     getToday,
     getWeek,
     getYear,
     recordSample,
     type DayRecord,
   } from './sensor001/history';
   import { PARAMS } from './sensor001/params';
   import { Sensor001Engine } from './sensor001/Sensor001Engine';
   import type {
     AcquisitionMode,
     ActivityState,
     GpsStatus,
     MotionPermission,
     SensorEvent,
   } from './sensor001/types';
   
   export interface Sensor001Totals {
     today: DayRecord;
     week: DayRecord;
     month: DayRecord;
     year: DayRecord;
   }
   
   const readTotals = (): Sensor001Totals => ({
     today: getToday(),
     week: getWeek(),
     month: getMonth(),
     year: getYear(),
   });
   
   export const ACTIVITY_LABEL: Record<ActivityState, string> = {
     STILL: 'PARADO',
     WALKING: 'CAMINHANDO',
     VEHICLE: 'VEÍCULO',
   };
   
   export const ACTIVITY_ICON: Record<ActivityState, string> = {
     STILL: '🟢',
     WALKING: '🚶',
     VEHICLE: '🚗',
   };
   
   export function useSensor001() {
     const engineRef = useRef<Sensor001Engine | null>(null);
     const acquisitionRef = useRef<AcquisitionEngine | null>(null);
     const lastTickRef = useRef<number>(Date.now());
   
     const [event, setEvent] = useState<SensorEvent | null>(null);
     const [state, setState] = useState<ActivityState | null>(null);
     const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>('NORMAL');
     const [gpsStatus, setGpsStatus] = useState<GpsStatus>('loading');
     const [motionPermission, setMotionPermission] = useState<MotionPermission>('unknown');
     const [needsMotionPermission] = useState(() => AcquisitionEngine.needsMotionPermission());
     const [totals, setTotals] = useState<Sensor001Totals>(() => readTotals());
   
     useEffect(() => {
       const engine = new Sensor001Engine();
       engineRef.current = engine;
   
       const acquisition = new AcquisitionEngine({
         onAccel: (s) => engine.pushAccel(s),
         onGyro: (s) => engine.pushGyro(s),
         onGps: (s) => engine.pushGps(s),
         onGpsUnavailable: () => engine.markGpsUnavailable(),
         onGpsStatus: setGpsStatus,
         onMotionPermission: setMotionPermission,
       });
       acquisitionRef.current = acquisition;
       acquisition.start();
   
       lastTickRef.current = Date.now();
   
       const interval = setInterval(() => {
         const now = Date.now();
         const evt = engine.evaluate(now);
   
         const delta = now - lastTickRef.current;
         lastTickRef.current = now;
   
         if (evt) {
           setEvent(evt);
           setState(evt.activity);
           setAcquisitionMode(evt.acquisition_mode);
           acquisition.setMode(evt.acquisition_mode);
   
           // passos: usa frequência × Δt para não contar a janela inteira a cada tick
           const stepsDelta =
             evt.step_frequency > 0
               ? Math.max(0, Math.round(evt.step_frequency * (delta / 1000)))
               : 0;
           recordSample(evt.activity, delta, evt.distance, stepsDelta);
           setTotals(readTotals());
         }
       }, PARAMS.EVAL_INTERVAL_MS);
   
       return () => {
         clearInterval(interval);
         acquisition.stop();
         engineRef.current = null;
         acquisitionRef.current = null;
       };
     }, []);
   
     const requestMotionPermission = useCallback(async () => {
       const result = await acquisitionRef.current?.requestMotionPermission();
       if (result) setMotionPermission(result);
       return result;
     }, []);
   
     return {
       /* estado comportamental */
       state,
       stateLabel: state ? ACTIVITY_LABEL[state] : 'Calibrando...',
       stateIcon: state ? ACTIVITY_ICON[state] : '◈',
       event,
   
       /* aquisição */
       acquisitionMode,
       gpsStatus,
       motionPermission,
       needsMotionPermission,
       requestMotionPermission,
   
       /* histórico */
       totals,
     };
   }
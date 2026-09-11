import { useEffect, useRef, useState, useCallback } from 'react';
import {
  haversineKm,
  isPlausibleMovement,
  addDistanceKm,
  getTodayKm,
  getWeekKm,
  getMonthKm,
  getYearKm,
} from './distanceUtils';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface Totals {
  today: number;
  week: number;
  month: number;
  year: number;
}

export function useDistanceTracking() {
  const [tracking, setTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<Position | null>(null);
  const [totals, setTotals] = useState<Totals>({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const previousRef = useRef<Position | null>(null);

  const refreshTotals = useCallback(() => {
    setTotals({
      today: getTodayKm(),
      week: getWeekKm(),
      month: getMonthKm(),
      year: getYearKm(),
    });
  }, []);

  useEffect(() => {
    refreshTotals();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [refreshTotals]);

  async function start() {
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('Geolocalização não disponível neste dispositivo');
      return;
    }

    // Pede permissão
    const granted = await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (err) => resolve(err.code !== 1),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    if (!granted) {
      setError('Permissão de localização negada');
      return;
    }

    previousRef.current = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const reading: Position = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
        };

        const prev = previousRef.current;
        if (prev) {
          const dist = haversineKm(
            prev.latitude,
            prev.longitude,
            reading.latitude,
            reading.longitude
          );
          const dt = reading.timestamp - prev.timestamp;

          if (dist > 0.005 && isPlausibleMovement(dist, dt)) {
            addDistanceKm(dist);
            refreshTotals();
          }
        }

        previousRef.current = reading;
        setLastPosition(reading);
      },
      (err) => {
        console.warn('GPS erro:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    setTracking(true);
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    previousRef.current = null;
  }

  return { tracking, lastPosition, totals, error, start, stop };
}
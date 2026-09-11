import { useEffect, useState } from 'react';

export interface DistancesState {
  day: number;
  week: number;
  month: number;
  year: number;
  lastUpdateDate: string;
}

export const useDistanceTracking = () => {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [distances, setDistances] = useState<DistancesState>(() => {
    const saved = localStorage.getItem('espelho_vivo_distances');
    const todayStr = new Date().toISOString().split('T')[0];

    if (saved) {
      try {
        const parsed: DistancesState = JSON.parse(saved);
        const savedDate = new Date(parsed.lastUpdateDate);
        const currentDate = new Date();

        const isSameDay = savedDate.toDateString() === currentDate.toDateString();

        const getWeekNumber = (d: Date) => {
          const oneJan = new Date(d.getFullYear(), 0, 1);
          return Math.ceil((((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
        };

        const isSameWeek = isSameDay || (getWeekNumber(savedDate) === getWeekNumber(currentDate) && savedDate.getFullYear() === currentDate.getFullYear());
        const isSameMonth = isSameDay || (savedDate.getMonth() === currentDate.getMonth() && savedDate.getFullYear() === currentDate.getFullYear());
        const isSameYear = isSameDay || (savedDate.getFullYear() === currentDate.getFullYear());

        return {
          day: isSameDay ? parsed.day : 0,
          week: isSameWeek ? parsed.week : 0,
          month: isSameMonth ? parsed.month : 0,
          year: isSameYear ? parsed.year : 0,
          lastUpdateDate: todayStr,
        };
      } catch (e) {
        console.error('Erro ao ler métricas salvas:', e);
      }
    }

    return { day: 0, week: 0, month: 0, year: 0, lastUpdateDate: todayStr };
  });

  useEffect(() => {
    localStorage.setItem('espelho_vivo_distances', JSON.stringify(distances));
  }, [distances]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalização não é suportada por este navegador.');
      setGpsStatus('error');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      if (lastCoords) {
        const deltaKm = calculateDistance(
          lastCoords.lat,
          lastCoords.lng,
          latitude,
          longitude
        );

        if (deltaKm > 0.01) {
          setDistances((prev) => ({
            ...prev,
            day: prev.day + deltaKm,
            week: prev.week + deltaKm,
            month: prev.month + deltaKm,
            year: prev.year + deltaKm,
            lastUpdateDate: new Date().toISOString().split('T')[0],
          }));
        }
      }

      setLastCoords({ lat: latitude, lng: longitude });
      setGpsStatus('active');
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      setGpsStatus('error');
      setError(err.message);
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [lastCoords]);

  return { distances, gpsStatus, error };
};
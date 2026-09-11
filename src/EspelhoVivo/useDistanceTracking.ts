import { useEffect, useState } from 'react';

export interface DistancesState {
  day: number;
  week: number;
  month: number;
  year: number;
  lastUpdateDate: string; // Guarda a data no formato YYYY-MM-DD
}

export const useDistanceTracking = () => {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Função auxiliar para pegar a data atual local no formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [distances, setDistances] = useState<DistancesState>(() => {
    const saved = localStorage.getItem('espelho_vivo_distances');
    const todayStr = getTodayString();

    if (saved) {
      try {
        const parsed: DistancesState = JSON.parse(saved);
        const [savedYear, savedMonth] = parsed.lastUpdateDate ? parsed.lastUpdateDate.split('-') : [];
        const [currentYear, currentMonth] = todayStr.split('-');

        // Comparação direta de texto para o dia exato
        const isSameDay = parsed.lastUpdateDate === todayStr;
        const isSameMonth = savedYear === currentYear && savedMonth === currentMonth;
        const isSameYear = savedYear === currentYear;

        return {
          day: isSameDay ? parsed.day : 0,
          week: isSameMonth ? parsed.week : 0, // Mantém acumulado se estiver no mês
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

  // Salva no localStorage sempre que o valor de distances mudar
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
            lastUpdateDate: getTodayString(),
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
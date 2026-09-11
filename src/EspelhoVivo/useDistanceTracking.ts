import { useEffect, useState } from 'react';

interface LocationState {
  lat: number;
  lng: number;
}

export const useDistanceTracking = () => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalização não é suportada por este navegador.');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true, // Força uso do GPS do dispositivo
      timeout: 20000,           // Aguarda até 20s para pegar o sinal
      maximumAge: 0,            // Garante dados em tempo real (sem cache)
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      let mensagem = 'Erro desconhecido ao obter GPS.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          mensagem = 'Permissão do GPS foi negada pelo usuário.';
          break;
        case err.POSITION_UNAVAILABLE:
          mensagem = 'Sinal do GPS indisponível no momento.';
          break;
        case err.TIMEOUT:
          mensagem = 'Tempo limite esgotado ao buscar localização.';
          break;
      }
      console.warn(`[GPS Error]: ${mensagem}`);
      setError(mensagem);
    };

    // Inicia o monitoramento
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error };
};
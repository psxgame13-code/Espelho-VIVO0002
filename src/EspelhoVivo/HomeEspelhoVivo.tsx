import { useState, useEffect } from 'react';
import './HomeEspelhoVivo.css';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface HomeEspelhoVivoProps {
  email: string;
  onLogout: () => void;
}

export default function HomeEspelhoVivo({
  email,
  onLogout,
}: HomeEspelhoVivoProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [distance, setDistance] = useState(0);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    // Solicitar permissão de geolocalização
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    // Obter posição atual uma vez
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        setLocation(newLocation);
        setLastLocation(newLocation);
        setGpsStatus('active');
      },
      (error) => {
        console.error('Erro ao acessar GPS:', error);
        setGpsStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Monitorar posição continuamente
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Calcular distância com base na última posição
        if (lastLocation) {
          const d = calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            newLocation.latitude,
            newLocation.longitude
          );
          setDistance((prev) => prev + d);
        }

        setLocation(newLocation);
        setLastLocation(newLocation);
      },
      (error) => {
        console.error('Erro ao monitorar GPS:', error);
        setGpsStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [lastLocation]);

  // Fórmula de Haversine para calcular distância entre dois pontos
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
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

  return (
    <div className="espelho-home">
      <header className="home-header">
        <div>
          <span className="system-label">ESPELHO VIVO</span>
          <h1>Olá, {email.split('@')[0]}</h1>
          <p>Seu sistema está observando o seu dia.</p>
        </div>

        <button className="logout-button" onClick={onLogout}>
          Sair
        </button>
      </header>

      <main className="home-content">
        <section className="status-card">
          <div>
            <span className="card-label">ESTADO ATUAL</span>
            <h2>
              {gpsStatus === 'active' ? 'GPS Ativo' : gpsStatus === 'loading' ? 'Aguardando GPS...' : 'GPS Indisponível'}
            </h2>
            <p>
              {gpsStatus === 'active'
                ? location
                  ? `Latitude: ${location.latitude.toFixed(5)} | Longitude: ${location.longitude.toFixed(5)}`
                  : 'Obtendo localização...'
                : gpsStatus === 'loading'
                  ? 'Solicitando acesso ao GPS...'
                  : 'Verifique as permissões de localização do seu navegador.'}
            </p>
          </div>

          <div className="status-indicator">
            <span className={gpsStatus === 'active' ? 'active' : ''}></span>
            {gpsStatus === 'active' ? 'Ativo' : gpsStatus === 'loading' ? 'Conectando' : 'Inativo'}
          </div>
        </section>

        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-icon">🚶</span>
            <span className="card-label">MOVIMENTO</span>
            <strong>{distance > 0.01 ? Math.floor(distance * 10) / 10 : '0'} km</strong>
            <small>Distância detectada</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📍</span>
            <span className="card-label">PRECISÃO</span>
            <strong>{location ? Math.round(location.accuracy) : '—'} m</strong>
            <small>Margem de erro</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🌍</span>
            <span className="card-label">LATITUDE</span>
            <strong>{location ? location.latitude.toFixed(4) : '—'}</strong>
            <small>Coordenada N/S</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🧭</span>
            <span className="card-label">LONGITUDE</span>
            <strong>{location ? location.longitude.toFixed(4) : '—'}</strong>
            <small>Coordenada L/O</small>
          </div>
        </section>

        <section className="insight-card">
          <span className="card-label">ÚLTIMA PERCEPÇÃO</span>

          <div className="insight-content">
            <div className="insight-symbol">◈</div>

            <div>
              <h3>Seu dia está começando a ganhar forma.</h3>
              <p>
                Conforme novos sinais forem captados, o Espelho Vivo
                poderá identificar padrões do seu comportamento ao longo
                dos dias.
              </p>
            </div>
          </div>
        </section>

        <section className="next-step-card">
          <div>
            <span className="card-label">PRÓXIMO PASSO</span>
            <h3>Ainda estamos conhecendo você.</h3>
            <p>
              Neste momento, o sistema não vai presumir o que você precisa.
              Primeiro ele observa. Depois aprende.
            </p>
          </div>

          <div className="future-label">
            HUMAN DIGITAL TWIN
          </div>
        </section>

        <section className="privacy-card">
          <span>🔒</span>
          <div>
            <strong>Seus dados pertencem a você.</strong>
            <p>
              O Espelho Vivo foi pensado para trabalhar apenas com sinais
              autorizados pelo usuário.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
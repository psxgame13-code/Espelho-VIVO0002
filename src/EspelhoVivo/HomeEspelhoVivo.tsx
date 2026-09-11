import { useState, useEffect } from 'react';
import './HomeEspelhoVivo.css';

interface LocationData {
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
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [distance, setDistance] = useState('0,000 km');
  const [tempoParado, setTempoParado] = useState('0:00:00');
  const [veiculos, setVeiculos] = useState('0,000 km');
  const [tempoTela, setTempoTela] = useState('0:00:00 hs');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    // Posição inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLastCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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

    // Monitoramento contínuo
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (lastCoords) {
          const d = calculateDistance(
            lastCoords.lat,
            lastCoords.lng,
            latitude,
            longitude
          );
          
          if (d > 0.001) {
            setDistance(`${d.toFixed(3).replace('.', ',')} km`);
          }
        }

        setLastCoords({ lat: latitude, lng: longitude });
        setGpsStatus('active');
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
  }, [lastCoords]);

  // Cálculo de distância (Haversine)
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
                ? 'Monitoramento de sinal ativo e sincronizado.'
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
            <span className="card-label">DISTÂNCIA</span>
            <strong>{distance}</strong>
            <small>Distância detectada</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">⏱️</span>
            <span className="card-label">TEMPO PARADO</span>
            <strong>{tempoParado}</strong>
            <small>Tempo em repouso</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🚗</span>
            <span className="card-label">VEÍCULOS</span>
            <strong>{veiculos}</strong>
            <small>Percurso em transporte</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📱</span>
            <span className="card-label">TELA</span>
            <strong>{tempoTela}</strong>
            <small>Tempo de uso do dispositivo</small>
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
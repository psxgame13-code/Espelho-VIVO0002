import './HomeEspelhoVivo.css';
import { useDistanceTracking } from './useDistanceTracking';

interface HomeEspelhoVivoProps {
  email: string;
  onLogout: () => void;
}

export default function HomeEspelhoVivo({
  email,
  onLogout,
}: HomeEspelhoVivoProps) {
  const { distances, gpsStatus } = useDistanceTracking();

  const formatKm = (value: number) => {
    return `${value.toFixed(3).replace('.', ',')} km`;
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
            <span className="card-label">DISTÂNCIA HOJE</span>
            <strong>{formatKm(distances.day)}</strong>
            <small>Percorrida hoje</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📅</span>
            <span className="card-label">SEMANA</span>
            <strong>{formatKm(distances.week)}</strong>
            <small>Acumulado da semana</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🗓️</span>
            <span className="card-label">MÊS</span>
            <strong>{formatKm(distances.month)}</strong>
            <small>Acumulado do mês</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🌍</span>
            <span className="card-label">ANO</span>
            <strong>{formatKm(distances.year)}</strong>
            <small>Acumulado do ano</small>
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
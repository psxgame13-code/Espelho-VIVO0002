import './HomeEspelhoVivo.css';
import { useDistanceTracking } from './useDistanceTracking';

interface HomeEspelhoVivoProps {
  email: string;
  onLogout: () => void;
}

function formatKm(value: number): string {
  return value.toFixed(3).replace('.', ',');
}

export default function HomeEspelhoVivo({
  email,
  onLogout,
}: HomeEspelhoVivoProps) {
  const { tracking, lastPosition, totals, error, start, stop } =
    useDistanceTracking();

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
        {/* ===== CARD DE DISTÂNCIA (GPS) ===== */}
        <section className="status-card distance-card">
          <div className="distance-header">
            <div>
              <span className="card-label">DISTÂNCIA PERCORRIDA</span>
              <h2>Quilômetros</h2>
              <p>
                {tracking
                  ? 'GPS ativo — deixe o app aberto para continuar contando.'
                  : 'Toque em Iniciar para começar a contar os km.'}
              </p>
            </div>

            <button
              className={`tracking-button ${tracking ? 'tracking-active' : ''}`}
              onClick={tracking ? stop : start}
            >
              {tracking ? 'Parar' : 'Iniciar'}
            </button>
          </div>

          {error && <p className="distance-error">{error}</p>}

          <div className="distance-grid">
            <div className="distance-item">
              <small>Hoje</small>
              <strong>
                {formatKm(totals.today)} <span>km</span>
              </strong>
            </div>
            <div className="distance-item">
              <small>Esta semana</small>
              <strong>
                {formatKm(totals.week)} <span>km</span>
              </strong>
            </div>
            <div className="distance-item">
              <small>Este mês</small>
              <strong>
                {formatKm(totals.month)} <span>km</span>
              </strong>
            </div>
            <div className="distance-item">
              <small>Este ano</small>
              <strong>
                {formatKm(totals.year)} <span>km</span>
              </strong>
            </div>
          </div>

          {lastPosition && tracking && (
            <p className="distance-accuracy">
              Precisão atual: ±{Math.round(lastPosition.accuracy)} m
            </p>
          )}
        </section>

        {/* ===== STATUS ===== */}
        <section className="status-card">
          <div>
            <span className="card-label">ESTADO ATUAL</span>
            <h2>{tracking ? 'Monitorando distância' : 'Em observação'}</h2>
            <p>
              {tracking
                ? 'GPS ativo. Os km só são contados enquanto o app está aberto.'
                : 'O Espelho Vivo está começando a construir uma percepção do seu comportamento.'}
            </p>
          </div>

          <div className={`status-indicator ${tracking ? 'live' : ''}`}>
            <span></span>
            {tracking ? 'Ao vivo' : 'Ativo'}
          </div>
        </section>

        {/* ===== MÉTRICAS (placeholder) ===== */}
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-icon">🚶</span>
            <span className="card-label">MOVIMENTO</span>
            <strong>—</strong>
            <small>Caminhando hoje</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📍</span>
            <span className="card-label">DESLOCAMENTO</span>
            <strong>{formatKm(totals.today)} km</strong>
            <small>Percorridos hoje</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">⏱</span>
            <span className="card-label">TEMPO PARADO</span>
            <strong>—</strong>
            <small>Sem movimento detectado</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📱</span>
            <span className="card-label">TELA</span>
            <strong>—</strong>
            <small>Tempo de uso hoje</small>
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

          <div className="future-label">HUMAN DIGITAL TWIN</div>
        </section>

        <section className="privacy-card">
          <span>🔒</span>
          <div>
            <strong>Seus dados pertencem a você.</strong>
            <p>
              A trilha de GPS não é salva — apenas os totais de quilômetros.
              Tudo fica no seu aparelho.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
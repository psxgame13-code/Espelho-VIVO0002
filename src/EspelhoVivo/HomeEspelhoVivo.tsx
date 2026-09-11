import { useState } from 'react';
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
  const [view, setView] = useState<'home' | 'detalhes-distancia'>('home');

  const formatKm = (value: number) => {
    return `${value.toFixed(3).replace('.', ',')} km`;
  };

  // TELA DE DETALHES DE DISTÂNCIA
  if (view === 'detalhes-distancia') {
    return (
      <div className="espelho-home">
        <header className="home-header">
          <div>
            <button 
              className="logout-button" 
              onClick={() => setView('home')} 
              style={{ marginBottom: '10px' }}
            >
              ← Voltar ao Painel
            </button>
            <h1>Histórico de Distância</h1>
            <p>Acompanhamento detalhado do seu deslocamento.</p>
          </div>
        </header>

        <main className="home-content">
          <section className="metrics-grid">
            <div className="metric-card">
              <span className="metric-icon">☀️</span>
              <span className="card-label">HOJE</span>
              <strong>{formatKm(distances.day)}</strong>
              <small>Total percorrido hoje</small>
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
        </main>
      </div>
    );
  }

  // TELA PRINCIPAL (PAINEL)
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

        {/* MÉTRICAS PRINCIPAIS */}
        <section className="metrics-grid">
          {/* Card Clicável de Distância */}
          <div 
            className="metric-card" 
            onClick={() => setView('detalhes-distancia')}
            style={{ cursor: 'pointer' }}
          >
            <span className="metric-icon">🚶</span>
            <span className="card-label">DISTÂNCIA ➔</span>
            <strong>{formatKm(distances.day)}</strong>
            <small>Clique para ver detalhes</small>
          </div>

          {/* PONTO 1: Efeito de calibração do algoritmo para gerar expectativa */}
          <div className="metric-card" style={{ opacity: 0.85 }}>
            <span className="metric-icon">⏱️</span>
            <span className="card-label">TEMPO PARADO</span>
            <strong>0:00:00</strong>
            <small style={{ color: '#d4af37' }}> Calibrando algoritmo...</small>
          </div>

          <div className="metric-card" style={{ opacity: 0.85 }}>
            <span className="metric-icon">🚗</span>
            <span className="card-label">VEÍCULOS</span>
            <strong>0,000 km</strong>
            <small style={{ color: '#d4af37' }}> Calibrando algoritmo...</small>
          </div>

          <div className="metric-card" style={{ opacity: 0.85 }}>
            <span className="metric-icon">📱</span>
            <span className="card-label">TELA</span>
            <strong>0:00:00 hs</strong>
            <small style={{ color: '#d4af37' }}> Calibrando algoritmo...</small>
          </div>
        </section>

        {/* PONTO 2: Mensagem Dinâmica e Filosófica de Acordo com a Distância */}
        <section className="insight-card">
          <span className="card-label">ÚLTIMA PERCEPÇÃO</span>

          <div className="insight-content">
            <div className="insight-symbol">◈</div>

            <div>
              {distances.day >= 1.0 ? (
                <>
                  <h3 style={{ color: '#d4af37' }}>Marco atingido: Seu movimento ganhou tração.</h3>
                  <p>
                    Seu gêmeo digital registrou seus primeiros movimentos significativos hoje ({formatKm(distances.day)}). Cada deslocamento é um padrão sendo mapeado.
                  </p>
                </>
              ) : (
                <>
                  <h3>Seu dia está começando a ganhar forma.</h3>
                  <p>
                    Conforme novos sinais forem captados, o Espelho Vivo
                    poderá identificar padrões do seu comportamento ao longo
                    dos dias.
                  </p>
                </>
              )}
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
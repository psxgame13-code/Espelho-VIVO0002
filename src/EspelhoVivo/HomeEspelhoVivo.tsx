import { useState } from 'react';
import './HomeEspelhoVivo.css';
import { useSensor001 } from './useSensor001';

interface HomeEspelhoVivoProps {
  email: string;
  onLogout: () => void;
}

const formatKm = (value: number) => `${value.toFixed(3).replace('.', ',')} km`;

const formatDuration = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function HomeEspelhoVivo({ email, onLogout }: HomeEspelhoVivoProps) {
  const {
    state,
    stateLabel,
    stateIcon,
    event,
    acquisitionMode,
    gpsStatus,
    motionPermission,
    needsMotionPermission,
    requestMotionPermission,
    totals,
  } = useSensor001();

  const [view, setView] = useState<'home' | 'detalhes-distancia' | 'detalhes-sensor'>(
    'home'
  );

  const today = totals.today;

  const gpsTitle =
    gpsStatus === 'active'
      ? 'GPS Ativo'
      : gpsStatus === 'economy'
        ? 'GPS em modo econômico'
        : gpsStatus === 'loading'
          ? 'Aguardando GPS...'
          : 'GPS Indisponível';

  const acquisitionLabel =
    acquisitionMode === 'ECONOMICO'
      ? 'ECONÔMICO'
      : acquisitionMode === 'TRANSICAO'
        ? 'TRANSIÇÃO'
        : 'NORMAL';

  /* ===================== DETALHES DE DISTÂNCIA ===================== */
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
              <strong>{formatKm(today.km)}</strong>
              <small>Total percorrido hoje</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon">📅</span>
              <span className="card-label">SEMANA</span>
              <strong>{formatKm(totals.week.km)}</strong>
              <small>Acumulado da semana</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🗓️</span>
              <span className="card-label">MÊS</span>
              <strong>{formatKm(totals.month.km)}</strong>
              <small>Acumulado do mês</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🌍</span>
              <span className="card-label">ANO</span>
              <strong>{formatKm(totals.year.km)}</strong>
              <small>Acumulado do ano</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🚶</span>
              <span className="card-label">A PÉ (HOJE)</span>
              <strong>{formatKm(today.kmWalking)}</strong>
              <small>Distância classificada como caminhada</small>
            </div>

            <div className="metric-card">
              <span className="metric-icon">🚗</span>
              <span className="card-label">VEÍCULO (HOJE)</span>
              <strong>{formatKm(today.kmVehicle)}</strong>
              <small>Distância classificada como veículo</small>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ===================== DETALHES DO SENSOR ===================== */
  if (view === 'detalhes-sensor') {
    const rows: Array<[string, string]> = [
      ['Estado confirmado', state ? stateLabel : 'Calibrando'],
      ['Modo de aquisição', acquisitionLabel],
      [
        'Confiança',
        event ? `${Math.round(event.confidence * 100)}% (${event.confidenceLevel})` : '—',
      ],
      ['Velocidade', event?.speed !== null && event ? `${event.speed} km/h` : 'indisponível'],
      ['Passos na janela', event ? String(event.steps) : '—'],
      ['Frequência de passos', event ? `${event.step_frequency} Hz` : '—'],
      [
        'Regularidade',
        event?.step_regularity !== null && event ? String(event.step_regularity) : 'indisponível',
      ],
      [
        'Energia de vibração',
        event?.vibration_energy !== null && event
          ? `${event.vibration_energy} m²/s⁴`
          : 'indisponível',
      ],
      [
        'Velocidade angular',
        event?.angular_velocity !== null && event
          ? `${event.angular_velocity} rad/s`
          : 'indisponível',
      ],
      [
        'Variância angular',
        event?.angular_variance !== null && event
          ? `${event.angular_variance} rad²/s²`
          : 'indisponível',
      ],
      [
        'Precisão do GPS',
        event?.gps_accuracy !== null && event ? `${event.gps_accuracy} m` : 'indisponível',
      ],
      [
        'Scores',
        event
          ? `Parado ${event.scores.STILL} · Caminhando ${event.scores.WALKING} · Veículo ${event.scores.VEHICLE}`
          : '—',
      ],
      ['Margem', event ? String(event.margin) : '—'],
    ];

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
            <h1>Sensor 001 — Movimento</h1>
            <p>Leitura bruta da janela atual de análise.</p>
          </div>
        </header>

        <main className="home-content">
          <section className="status-card" style={{ flexDirection: 'column', gap: '12px' }}>
            <span className="card-label">JANELA ATUAL</span>
            <div style={{ width: '100%' }}>
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(212,175,55,0.12)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#817962' }}>{label}</span>
                  <strong style={{ color: '#f4f1e5' }}>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="privacy-card">
            <span>🔒</span>
            <div>
              <strong>Nada disso sai do seu aparelho.</strong>
              <p>
                O Espelho Vivo guarda apenas características derivadas (tempo, distância,
                passos, vibração), não o fluxo bruto dos sensores.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ===================== PAINEL PRINCIPAL ===================== */
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
        {/* ESTADO ATUAL — SENSOR 001 */}
        <section
          className="status-card"
          onClick={() => setView('detalhes-sensor')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span className="card-label">ESTADO ATUAL</span>
            <h2>
              {stateIcon} {state ? stateLabel : 'Calibrando algoritmo...'}
            </h2>
            <p>
              {state
                ? `${gpsTitle} · aquisição ${acquisitionLabel}${
                    event ? ` · confiança ${Math.round(event.confidence * 100)}%` : ''
                  }`
                : 'Reunindo a primeira janela de 10 segundos de sinais.'}
            </p>
          </div>

          <div className="status-indicator">
            <span className={gpsStatus === 'active' ? 'active' : ''}></span>
            {gpsStatus === 'active'
              ? 'Ativo'
              : gpsStatus === 'economy'
                ? 'Econômico'
                : gpsStatus === 'loading'
                  ? 'Conectando'
                  : 'Inativo'}
          </div>
        </section>

        {/* Permissão de movimento (iOS 13+) */}
        {needsMotionPermission && motionPermission !== 'granted' && (
          <section className="status-card">
            <div>
              <span className="card-label">PERMISSÃO NECESSÁRIA</span>
              <h3>Ative os sensores de movimento</h3>
              <p>
                O acelerômetro e o giroscópio precisam da sua autorização para que o Sensor
                001 funcione neste dispositivo.
              </p>
            </div>
            <button className="logout-button" onClick={requestMotionPermission}>
              Permitir movimento
            </button>
          </section>
        )}

        {/* MÉTRICAS PRINCIPAIS */}
        <section className="metrics-grid">
          <div
            className="metric-card"
            onClick={() => setView('detalhes-distancia')}
            style={{ cursor: 'pointer' }}
          >
            <span className="metric-icon">🚶</span>
            <span className="card-label">DISTÂNCIA ➔</span>
            <strong>{formatKm(today.km)}</strong>
            <small>Clique para ver detalhes</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">⏱️</span>
            <span className="card-label">TEMPO PARADO</span>
            <strong>{formatDuration(today.stillMs)}</strong>
            <small>Hoje</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">👟</span>
            <span className="card-label">CAMINHANDO</span>
            <strong>{formatDuration(today.walkingMs)}</strong>
            <small>{today.steps} passos detectados</small>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🚗</span>
            <span className="card-label">VEÍCULO</span>
            <strong>{formatDuration(today.vehicleMs)}</strong>
            <small>{formatKm(today.kmVehicle)} em deslocamento</small>
          </div>
        </section>

        {/* PERCEPÇÃO */}
        <section className="insight-card">
          <span className="card-label">ÚLTIMA PERCEPÇÃO</span>

          <div className="insight-content">
            <div className="insight-symbol">◈</div>

            <div>
              {state === 'VEHICLE' ? (
                <>
                  <h3 style={{ color: '#d4af37' }}>Você está em deslocamento motorizado.</h3>
                  <p>
                    O padrão de movimento é mais compatível com VEÍCULO: velocidade contínua,
                    ausência de passos e vibração característica.
                  </p>
                </>
              ) : state === 'WALKING' ? (
                <>
                  <h3 style={{ color: '#d4af37' }}>Seu corpo está em movimento.</h3>
                  <p>
                    Cadência regular detectada. Até agora, {formatDuration(today.walkingMs)} de
                    caminhada registrados hoje.
                  </p>
                </>
              ) : today.km >= 1.0 ? (
                <>
                  <h3 style={{ color: '#d4af37' }}>Marco atingido: seu movimento ganhou tração.</h3>
                  <p>
                    Seu gêmeo digital já registrou {formatKm(today.km)} hoje. Cada deslocamento
                    é um padrão sendo mapeado.
                  </p>
                </>
              ) : (
                <>
                  <h3>Seu dia está começando a ganhar forma.</h3>
                  <p>
                    Conforme novos sinais forem captados, o Espelho Vivo poderá identificar
                    padrões do seu comportamento ao longo dos dias.
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
              Neste momento, o sistema não vai presumir o que você precisa. Primeiro ele
              observa. Depois aprende.
            </p>
          </div>

          <div className="future-label">HUMAN DIGITAL TWIN</div>
        </section>

        <section className="privacy-card">
          <span>🔒</span>
          <div>
            <strong>Seus dados pertencem a você.</strong>
            <p>
              O Espelho Vivo foi pensado para trabalhar apenas com sinais autorizados pelo
              usuário.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
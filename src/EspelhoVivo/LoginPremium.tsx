import { useState, type FormEvent } from 'react';
import './LoginPremium.css';

interface LoginPremiumProps {
  onLogin: (data: { email: string }) => void;
}

export default function LoginPremium({ onLogin }: LoginPremiumProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula delay de autenticação
    setTimeout(() => {
      setIsLoading(false);
      onLogin({ email });
    }, 1400);
  };

  return (
    <div className="login-premium-container">
      {/* Background animado */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="login-card">
        {/* Logo / Branding */}
        <div className="brand">
          <div className="logo-circle">
            <span className="logo-icon">◈</span>
          </div>
          <h1>Espelho Vivo</h1>
          <p className="subtitle">Sensores • Memória • Presença</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>E-mail</label>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <span className="input-icon">✉</span>
            </div>
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '◉' : '◎'}
              </button>
            </div>
          </div>

          <div className="options-row">
            <label className="remember">
              <input type="checkbox" />
              <span>Lembrar de mim</span>
            </label>
            <a href="#" className="forgot">Esqueceu a senha?</a>
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? <span className="loader"></span> : 'Entrar'}
          </button>
        </form>

        {/* Rodapé */}
        <div className="login-footer">
          <p>
            Ainda não tem conta? <a href="#">Criar acesso</a>
          </p>
        </div>
      </div>
    </div>
  );
}
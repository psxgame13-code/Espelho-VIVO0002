import { useState } from 'react';
import LoginPremium from './EspelhoVivo/LoginPremium';
import HomeEspelhoVivo from './EspelhoVivo/HomeEspelhoVivo';
import './App.css';

export default function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  if (!user) {
    return <LoginPremium onLogin={(data) => setUser(data)} />;
  }

  return (
    <HomeEspelhoVivo
      email={user.email}
      onLogout={() => setUser(null)}
    />
  );
}
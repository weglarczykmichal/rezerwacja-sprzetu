import { useState, useEffect } from 'react';
import { api } from './api';

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);

  // Po zalogowaniu pobierz listę sprzętu
  useEffect(() => {
    if (!token) return;
    api('/equipment', { token })
      .then(setEquipment)
      .catch(() => logout()); // np. token wygasł
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api('/register', { method: 'POST', body: { email, password } });
      }
      const data = await api('/login', { method: 'POST', body: { email, password } });
      sessionStorage.setItem('token', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem('token');
    setToken(null);
    setEquipment([]);
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto' }}>
        <h1>{mode === 'login' ? 'Logowanie' : 'Rejestracja'}</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Hasło (min. 8 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">
            {mode === 'login' ? 'Zaloguj' : 'Zarejestruj i zaloguj'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Nie mam konta' : 'Mam już konto'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Dostępny sprzęt</h1>
      <button onClick={logout}>Wyloguj</button>
      <ul>
        {equipment.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>: {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { api } from './api';

export default function AdminPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [equipment, setEquipment] = useState([]);

  async function load() {
    try {
      setReservations(await api('/admin/reservations', { token }));
      setEquipment(await api('/equipment', { token }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    setError('');
    setMessage('');
    try {
      await api(`/admin/reservations/${id}`, { method: 'PATCH', token, body: { status } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addEquipment(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/equipment', {
        method: 'POST',
        token,
        body: { name, description: description || undefined },
      });
      setMessage('Dodano sprzęt (odśwież stronę, aby zobaczyć go na liście)');
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteEquipment(id) {
  setError('');
  setMessage('');
  try {
    await api(`/equipment/${id}`, { method: 'DELETE', token });
    setMessage('Usunięto sprzęt');
    await load();
  } catch (err) {
    setError(err.message);
  }
}

  return (
    <div style={{ marginTop: 40, borderTop: '2px solid #888' }}>
      <h2>Panel opiekuna</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Wszystkie rezerwacje</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Użytkownik</th>
            <th>Sprzęt</th>
            <th>Od</th>
            <th>Do</th>
            <th>Status</th>
            <th>Komentarz</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id}>
              <td>{r.email}</td>
              <td>{r.equipment_name}</td>
              <td>{r.start_date}</td>
              <td>{r.end_date}</td>
              <td>{r.status}</td>
              <td>{r.comment}</td>
              <td>
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => setStatus(r.id, 'approved')}>Zatwierdź</button>{' '}
                    <button onClick={() => setStatus(r.id, 'rejected')}>Odrzuć</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Dodaj sprzęt</h3>
      <form onSubmit={addEquipment}>
        <input
          placeholder="Nazwa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
        <br />
        <input
          placeholder="Opis (opcjonalnie)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
        <br />
        <button type="submit">Dodaj</button>
      </form>
      <h3>Sprzęt w systemie</h3>
      <ul>
      {equipment.map((item) => (
        <li key={item.id}>
            {item.name}{' '}
            <button onClick={() => deleteEquipment(item.id)}>Usuń</button>
        </li>
       ))}
      </ul>
    </div>
  );
}
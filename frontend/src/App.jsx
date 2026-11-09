import { useState, useEffect } from "react";
import { api } from "./api";

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Formularz rezerwacji
  const [equipmentId, setEquipmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");

  function logout() {
    sessionStorage.removeItem("token");
    setToken(null);
    setEquipment([]);
    setReservations([]);
  }

  async function loadReservations(t = token) {
    const data = await api("/reservations/my", { token: t });
    setReservations(data);
  }

  // Po zalogowaniu pobierz sprzęt i rezerwacje
  useEffect(() => {
    if (!token) return;
    api("/equipment", { token })
      .then((items) => {
        setEquipment(items);
        if (items.length > 0) setEquipmentId(String(items[0].id));
      })
      .then(() => loadReservations(token))
      .catch(() => logout()); // np. token wygasł
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await api("/register", { method: "POST", body: { email, password } });
      }
      const data = await api("/login", {
        method: "POST",
        body: { email, password },
      });
      sessionStorage.setItem("token", data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReserve(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/reservations", {
        method: "POST",
        token,
        body: {
          equipment_id: Number(equipmentId),
          start_date: startDate,
          end_date: endDate,
          comment: comment || undefined,
        },
      });
      setMessage("Rezerwacja została dodana");
      setComment("");
      await loadReservations();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(id) {
    setError("");
    setMessage("");
    try {
      await api(`/reservations/${id}`, { method: "DELETE", token });
      setMessage("Rezerwacja została odwołana");
      await loadReservations();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 360, margin: "40px auto" }}>
        <h1>{mode === "login" ? "Logowanie" : "Rejestracja"}</h1>
        <form onSubmit={handleAuth}>
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
            {mode === "login" ? "Zaloguj" : "Zarejestruj i zaloguj"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Nie mam konta" : "Mam już konto"}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Rezerwacja sprzętu</h1>
      <button onClick={logout}>Wyloguj</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2>Dostępny sprzęt</h2>
      <ul>
        {equipment.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>: {item.description}
          </li>
        ))}
      </ul>

      <h2>Zarezerwuj</h2>
      <form onSubmit={handleReserve}>
        <select
          value={equipmentId}
          onChange={(e) => setEquipmentId(e.target.value)}
        >
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <br />
        Od:{" "}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <br />
        Do:{" "}
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Komentarz (opcjonalnie)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={300}
        />
        <br />
        <button type="submit">Zarezerwuj</button>
      </form>

      <h2>Moje rezerwacje</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
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
              <td>{r.equipment_name}</td>
              <td>{r.start_date}</td>
              <td>{r.end_date}</td>
              <td>{r.status}</td>
              <td>{r.comment}</td>
              <td>
                {(r.status === "pending" || r.status === "approved") && (
                  <button onClick={() => handleCancel(r.id)}>Odwołaj</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

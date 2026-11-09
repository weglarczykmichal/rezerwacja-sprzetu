import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import db from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Rejestracja
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email.includes("@") || email.length > 100) {
    return res.status(400).json({ error: "Niepoprawny e-mail" });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 100
  ) {
    return res
      .status(400)
      .json({ error: "Hasło musi mieć od 8 do 100 znaków" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    return res.status(409).json({ error: "Ten e-mail jest już zajęty" });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, hash);

  res.status(201).json({ id: result.lastInsertRowid, email });
});

// Logowanie
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Podaj e-mail i hasło" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  const ok = user && (await bcrypt.compare(password, user.password_hash));

  if (!ok) {
    return res.status(401).json({ error: "Błędny e-mail lub hasło" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  res.json({ token, role: user.role });
});

// Wymaga zalogowania: sprawdza token i zapisuje dane użytkownika w req.user
function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Brak tokenu, zaloguj się" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token niepoprawny lub wygasł" });
  }
}

// Wymaga roli admina (używać zawsze PO authRequired)
function adminRequired(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Brak uprawnień" });
  }
  next();
}

// Lista sprzętu (dla każdego zalogowanego)
app.get("/api/equipment", authRequired, (req, res) => {
  const items = db.prepare("SELECT id, name, description FROM equipment").all();
  res.json(items);
});

// Dodanie sprzętu (tylko admin)
app.post("/api/equipment", authRequired, adminRequired, (req, res) => {
  const { name, description } = req.body;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 100
  ) {
    return res
      .status(400)
      .json({ error: "Nazwa musi mieć od 1 do 100 znaków" });
  }
  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 500)
  ) {
    return res
      .status(400)
      .json({ error: "Opis może mieć maksymalnie 500 znaków" });
  }

  const result = db
    .prepare("INSERT INTO equipment (name, description) VALUES (?, ?)")
    .run(name.trim(), description ?? null);

  res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
});

// Pomocnicza funkcja: czy tekst jest poprawną datą w formacie RRRR-MM-DD
function isValidDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text))
    return false;
  const d = new Date(text);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

// Utworzenie rezerwacji
app.post("/api/reservations", authRequired, (req, res) => {
  const { equipment_id, start_date, end_date, comment } = req.body;

  if (!Number.isInteger(equipment_id)) {
    return res.status(400).json({ error: "Niepoprawny sprzęt" });
  }
  if (!isValidDate(start_date) || !isValidDate(end_date)) {
    return res.status(400).json({ error: "Daty muszą mieć format RRRR-MM-DD" });
  }
  if (end_date < start_date) {
    return res
      .status(400)
      .json({ error: "Data końca nie może być wcześniejsza niż początku" });
  }
  if (
    comment !== undefined &&
    (typeof comment !== "string" || comment.length > 300)
  ) {
    return res
      .status(400)
      .json({ error: "Komentarz może mieć maksymalnie 300 znaków" });
  }

  const item = db
    .prepare("SELECT id FROM equipment WHERE id = ?")
    .get(equipment_id);
  if (!item) {
    return res.status(404).json({ error: "Nie ma takiego sprzętu" });
  }

  // Czy sprzęt jest już zajęty w tym terminie?
  const conflict = db
    .prepare(
      `SELECT id FROM reservations
       WHERE equipment_id = ?
         AND status IN ('pending', 'approved')
         AND start_date <= ? AND end_date >= ?`,
    )
    .get(equipment_id, end_date, start_date);
  if (conflict) {
    return res
      .status(409)
      .json({ error: "Sprzęt jest już zarezerwowany w tym terminie" });
  }

  const result = db
    .prepare(
      "INSERT INTO reservations (user_id, equipment_id, start_date, end_date, comment) VALUES (?, ?, ?, ?, ?)",
    )
    .run(req.user.id, equipment_id, start_date, end_date, comment ?? null);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Moje rezerwacje (user_id bierzemy z tokenu, nie z żądania)
app.get("/api/reservations/my", authRequired, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.equipment_id, e.name AS equipment_name,
              r.start_date, r.end_date, r.status, r.comment
       FROM reservations r
       JOIN equipment e ON e.id = r.equipment_id
       WHERE r.user_id = ?
       ORDER BY r.start_date`,
    )
    .all(req.user.id);
  res.json(rows);
});

// Odwołanie rezerwacji (tylko własnej)
app.delete("/api/reservations/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Niepoprawny identyfikator" });
  }

  const reservation = db
    .prepare("SELECT * FROM reservations WHERE id = ?")
    .get(id);
  if (!reservation) {
    return res.status(404).json({ error: "Nie ma takiej rezerwacji" });
  }
  if (reservation.user_id !== req.user.id) {
    return res.status(403).json({ error: "To nie jest Twoja rezerwacja" });
  }
  if (reservation.status === "cancelled") {
    return res.status(409).json({ error: "Rezerwacja jest już odwołana" });
  }

  db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(
    id,
  );
  res.json({ ok: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});

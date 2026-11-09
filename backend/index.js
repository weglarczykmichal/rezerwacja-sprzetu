import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import db from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rejestracja
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || !email.includes('@') || email.length > 100) {
    return res.status(400).json({ error: 'Niepoprawny e-mail' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
    return res.status(400).json({ error: 'Hasło musi mieć od 8 do 100 znaków' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Ten e-mail jest już zajęty' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, hash);

  res.status(201).json({ id: result.lastInsertRowid, email });
});

// Logowanie
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Podaj e-mail i hasło' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = user && (await bcrypt.compare(password, user.password_hash));

  if (!ok) {
    return res.status(401).json({ error: 'Błędny e-mail lub hasło' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token, role: user.role });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
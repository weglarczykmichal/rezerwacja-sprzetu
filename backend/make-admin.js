import db from './db.js';

const email = process.argv[2];
const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);

console.log(result.changes ? 'Ustawiono rolę admina' : 'Nie znaleziono użytkownika');

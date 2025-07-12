// Express + SQLite 기본 백엔드
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// DB 연결 및 테이블 생성
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    line TEXT NOT NULL,
    win_rate REAL
  )`);
});

// 멤버 추가
app.post('/api/members', (req, res) => {
  const { name, line, win_rate } = req.body;
  if (!name || !line) {
    return res.status(400).json({ error: 'name, line 필수' });
  }
  db.run(
    'INSERT INTO members (name, line, win_rate) VALUES (?, ?, ?)',
    [name, line, win_rate ?? null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, line, win_rate });
    }
  );
});

// 멤버 전체 조회
app.get('/api/members', (req, res) => {
  db.all('SELECT * FROM members', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

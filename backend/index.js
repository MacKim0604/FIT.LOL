// Express + SQLite 기본 백엔드
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { getLatestMatchBySummonerName } = require('./riot');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Riot API: 최근 전적 조회
app.get('/api/riot/latest-match/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const match = await getLatestMatchBySummonerName(name);
    res.json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DB 연결 및 테이블 생성
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);
});

// 멤버 추가
app.post('/api/members', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name 필수' });
  }
  db.run(
    'INSERT INTO members (name) VALUES (?)',
    [name],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name });
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

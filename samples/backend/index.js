// Express + SQLite 기본 백엔드
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { getLatestMatchBySummonerName, getPuuidBySummonerName, getMatchIdsByPuuid, getMatchDetail, getKDA } = require('./riot');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Riot API: 최근 전적 조회
app.get('/api/riot/latest-match/:name', async (req, res) => {
  const { name } = req.params;
  try {
    // DB에서 name으로 tag도 함께 조회
    db.get('SELECT tag FROM members WHERE name = ?', [name], async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: '해당 멤버 없음' });
      const tag = row.tag;
      try {
        const match = await getLatestMatchBySummonerName(name, tag);
        res.json(match);
      } catch (err2) {
        res.status(400).json({ error: err2.message });
      }
    });
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
    name TEXT NOT NULL,
    tag TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS matches (
    matchId TEXT PRIMARY KEY,
    registeredAt TEXT,
    registrant TEXT
  )`);
});

// 멤버 추가
app.post('/api/members', (req, res) => {
  const { name, tag } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name 필수' });
  }
  db.run(
    'INSERT INTO members (name, tag) VALUES (?, ?)',
    [name, tag ?? null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, tag });
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

// 등록된 경기 목록 조회
app.get('/api/matches', (req, res) => {
  db.all('SELECT * FROM matches ORDER BY registeredAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 경기 여러 건 등록
app.post('/api/matches', (req, res) => {
  const matches = req.body;
  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ error: '등록할 경기가 없습니다.' });
  }
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT OR IGNORE INTO matches (matchId, registeredAt, registrant) VALUES (?, ?, ?)');
  matches.forEach(match => {
    stmt.run(match.matchId, now, match.registrant || '');
  });
  stmt.finalize(err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/riot/matches/:name', async (req, res) => {
  const { name } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 5;
  const start = (page - 1) * pageSize;
  db.get('SELECT tag FROM members WHERE name = ?', [name], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '해당 멤버 없음' });
    const tag = row.tag;
    try {
      const puuid = await getPuuidBySummonerName(name, tag);
      // Riot API에서 최대 100개까지 받아와서 페이지네이션 처리
      const matchIds = await getMatchIdsByPuuid(puuid, 100);
      const pagedMatchIds = matchIds.slice(start, start + pageSize);
      const result = await Promise.all(pagedMatchIds.map(async (matchId) => {
        try {
          const detail = await getMatchDetail(matchId);
          // 해당 소환사 참가자 정보 찾기
          let kda = null;
          if (detail.info && detail.info.participants && Array.isArray(detail.info.participants)) {
            const participant = detail.info.participants.find(p => p.puuid === puuid);
            if (participant) {
              kda = {
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists
              };
            }
          }
          return {
            matchId,
            queueType: detail.info?.queueId || '-',
            date: detail.info?.gameStartTimestamp ? new Date(detail.info.gameStartTimestamp).toISOString() : null,
            kda
          };
        } catch {
          return { matchId, queueType: '-', date: null, kda: null };
        }
      }));
      res.json({ matches: result, total: matchIds.length });
    } catch (err2) {
      res.status(400).json({ error: err2.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

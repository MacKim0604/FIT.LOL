require('dotenv').config();

const { createServer } = require('./server');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createServer();

app.listen(PORT, () => {
  console.log(`[LolAPIService] listening on http://localhost:${PORT}`);
});

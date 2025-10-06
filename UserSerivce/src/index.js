require('dotenv').config();

const { createServer } = require('./server');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;

const app = createServer();

app.listen(PORT, () => {
  console.log(`[UserSerivce] listening on http://localhost:${PORT}`);
});

require('dotenv').config();

const { createServer } = require('./server');
const { startWorkers } = require('./workers');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

async function main() {
  // start background workers
  await startWorkers();

  const app = createServer();
  app.listen(PORT, () => {
    console.log(`[RiotDataService] listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

require('dotenv').config();

const { createServer } = require('./server');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3004;
const app = createServer();

app.listen(PORT, () => {
  console.log(`[AnalysisService] listening on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { helloRouter } from './routes/hello.route';

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', helloRouter);

  // basic error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}

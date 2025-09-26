import { Router } from 'express';
import { HelloController } from '../controllers/hello.controller';

export const helloRouter = Router();
const controller = new HelloController();

helloRouter.get('/hello', (req, res) => controller.getHello(req, res));

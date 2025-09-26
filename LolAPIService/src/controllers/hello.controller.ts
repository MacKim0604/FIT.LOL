import { Request, Response } from 'express';
import { HelloService } from '../services/hello.service';

export class HelloController {
  private service = new HelloService();

  getHello(_req: Request, res: Response) {
    const dto = this.service.getHello();
    res.status(200).json(dto);
  }
}

import { HelloDto } from '../dto/hello.dto';

export class HelloService {
  getHello(): HelloDto {
    return { message: 'Hello World from LolAPIService' };
  }
}

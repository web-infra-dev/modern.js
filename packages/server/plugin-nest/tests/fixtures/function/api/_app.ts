// eslint-disable-next-line max-classes-per-file
import { hook } from '@modern-js/server-utils';
import {
  Controller,
  Get,
  Injectable,
  Module,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world!';
  }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.info(`access url: ${req.url}`);
    next();
  }
}

@Controller('cats')
export class CatsController {
  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
  constructor(private readonly catsService: AppService) {}

  @Get()
  getHello() {
    return this.catsService.getHello();
  }
}

@Module({
  providers: [AppService],
  controllers: [CatsController],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}

export default hook(({ addMiddleware }) => {
  addMiddleware(AppModule);
});

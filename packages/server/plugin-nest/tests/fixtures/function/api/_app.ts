// eslint-disable-next-line max-classes-per-file
import { hook } from '@modern-js/server-utils';
import { Controller, Get, Injectable, Module } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world!';
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

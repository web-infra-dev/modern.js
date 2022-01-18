import { Controller, Get, Injectable, Module } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello world!';
  }
}

@Controller('cats')
export class CatsController {
  private readonly catsService: AppService;

  constructor(catsService: AppService) {
    this.catsService = catsService;
  }

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

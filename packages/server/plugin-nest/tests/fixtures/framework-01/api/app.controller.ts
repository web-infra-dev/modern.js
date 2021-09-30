import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('cats')
export class CatsController {
  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
  constructor(private readonly catsService: AppService) {}

  @Get()
  getHello() {
    return this.catsService.getHello();
  }
}

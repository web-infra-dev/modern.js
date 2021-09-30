import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CatsController } from './app.controller';

@Module({
  providers: [AppService],
  controllers: [CatsController],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { defineCustom } from '../../../../src';
import { AppModule } from './app.module';

export default defineCustom(async modules => {
  @Module({ imports: [AppModule, ...modules] })
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class MainModule {}

  return NestFactory.create(MainModule);
});

import type { INestApplication } from '@nestjs/common';
import './runtime';

export type CustomFactory = (modules: any[]) => Promise<INestApplication>;

export const defineCustom = (factory: CustomFactory): CustomFactory => factory;

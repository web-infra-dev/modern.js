import path from 'path';
import { client } from './browser-test';
export const root = path.resolve(__dirname);
export const answer = 42;
console.log('client', client);

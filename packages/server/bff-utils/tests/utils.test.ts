import path from 'path';
import { getAllAPIFiles, getAPIMode } from '../src/utils';
import { APIMode } from '../src/constant';

const FUNCTION_PWD = path.resolve(__dirname, './fixtures/function');
const LAMBDA_PWD = path.resolve(__dirname, './fixtures/lambda');

describe('server', () => {
  describe('getAllBFFFiles', () => {
    it('function', () => {
      const filenames = getAllAPIFiles(FUNCTION_PWD);
      expect(filenames.length).toBe(13);
    });

    it('lambda', () => {
      const filenames = getAllAPIFiles(LAMBDA_PWD);
      expect(filenames.length).toBe(13);
    });
  });

  describe('getAPIMode', () => {
    it('function', () => {
      const type = getAPIMode(FUNCTION_PWD);
      expect(type).toBe(APIMode.FUNCTION);
    });

    it('lambda', () => {
      const type = getAPIMode(LAMBDA_PWD);
      expect(type).toBe(APIMode.FARMEWORK);
    });
  });
});

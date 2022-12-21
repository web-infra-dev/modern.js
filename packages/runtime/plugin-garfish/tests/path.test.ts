
import '@testing-library/jest-dom';
import { pathJoin } from '../src/runtime/utils/apps';

describe('path', () => {
    test('path join', async () => {
        expect(pathJoin('','')).toBe('/');
        expect(pathJoin('','/')).toBe('/');
        expect(pathJoin('/','')).toBe('/');
        expect(pathJoin('/','/')).toBe('/');
        expect(pathJoin('/','b')).toBe('/b');
        expect(pathJoin('/','b')).toBe('/b');
        expect(pathJoin('','/b')).toBe('/b');
        expect(pathJoin('/a','/')).toBe('/a');
        expect(pathJoin('/a','/b')).toBe('/a/b');
        expect(pathJoin('/a/','/b')).toBe('/a/b');
        expect(pathJoin('/a/','/b/')).toBe('/a/b');
        expect(pathJoin('a/','/b/')).toBe('/a/b');
        expect(pathJoin('a/','b/')).toBe('/a/b');
        expect(pathJoin('a/','/b')).toBe('/a/b');
    });
  });

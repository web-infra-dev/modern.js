import * as path from 'path';
import { fs } from '@modern-js/utils';
import { addSourceMappingUrl } from '../src/utils';

describe('utils test', () => {
  it('addSourceMappingUrl should right', () => {
    const code = 'const far = 1;';
    const mapLoc = `far.js.map`;
    const codeWithSourceMappingUrl = addSourceMappingUrl(code, mapLoc);
    const rightCodeWithSourceMappingUrl = fs.readFileSync(
      path.join(__dirname, './fixtures/utils/far'),
      'utf-8',
    );
    expect(codeWithSourceMappingUrl.trim()).toEqual(
      rightCodeWithSourceMappingUrl.trim(),
    );
  });
});

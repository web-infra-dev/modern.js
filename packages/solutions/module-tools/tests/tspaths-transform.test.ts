import path from 'path';
import { transformDtsAlias } from '../src/utils/tspaths-transform';

describe('tspaths-transform', () => {
  it('transformDtsAlias', () => {
    const filepath = path.join(__dirname, 'fixtures/tspaths/a.ts');
    const options = {
      filenames: [filepath],
      baseUrl: './',
      paths: {
        '@/*': ['./*'],
      },
    };
    expect(transformDtsAlias(options)).toEqual([
      {
        path: filepath,
        content: "import '@/b.ts';",
      },
    ]);
  });
});

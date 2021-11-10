import fs from 'fs';
import path from 'path';
import { loadEnv } from '@/loadEnv';

const fixture = path.resolve(__dirname, './fixtures/load-env');

fs.mkdirSync(fixture);

const createFixtures = (
  dir: string,
  files: {
    name: string;
    content: string;
  }[],
) => {
  fs.mkdirSync(path.join(fixture, dir));
  for (const { name, content } of files) {
    fs.writeFileSync(path.join(fixture, dir, name), content, 'utf8');
  }
};

describe('load environment variables', () => {
  const defaultEnv = process.env;

  beforeEach(() => (process.env = { ...defaultEnv }));

  afterAll(() => {
    process.env = { ...defaultEnv };
    fs.rmSync(fixture, {force: true, recursive: true})
  });

  test(`support .env file`, () => {
    createFixtures('base', [
      {
        name: '.env',
        content: `DB_HOST=localhost
        DB_USER=root
        DB_PASS=root
        `,
      },
    ]);
    loadEnv(path.join(fixture, 'base'));

    expect(process.env.DB_HOST).toBe('localhost');

    expect(process.env.DB_USER).toBe('root');

    expect(process.env.DB_PASS).toBe('root');
  });

  test(`support "environment" .env file`, () => {
    createFixtures('environment', [
      {
        name: '.env',
        content: `DB_HOST=localhost
        DB_USER=root
        DB_PASS=root
        `,
      },
      {
        name: '.env.production',
        content: `DB_HOST=localhost
        DB_USER=root-local-dev
        `,
      },
    ]);

    process.env.NODE_ENV = 'production';

    loadEnv(path.join(fixture, 'environment'));

    expect(process.env.DB_HOST).toBe('localhost');

    expect(process.env.DB_USER).toBe('root-local-dev');

    expect(process.env.DB_PASS).toBe('root');

    delete process.env.NODE_ENV;
  });

  test(`support dotenv-expand`, () => {
    createFixtures('expand', [
      {
        name: '.env',
        content: `DB_HOST=localhost
        DB_USER=\${DB_HOST}001
        DB_PASS=root
        `,
      },
    ]);
    loadEnv(path.join(fixture, 'expand'));

    expect(process.env.DB_HOST).toBe('localhost');

    expect(process.env.DB_USER).toBe('localhost001');

    expect(process.env.DB_PASS).toBe('root');
  });
});

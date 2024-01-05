import path from 'path';
import * as FSModule from 'node:fs/promises';
import { fileReader } from '../../src/node/fileReader';

test('should fileReader work correctly', async () => {
  const dir = path.join(__dirname, '../fixtures', 'fileReader');

  const nullRes = await fileReader.readFile(path.join(dir, 'foo.ts'));
  expect(nullRes).toBeNull();

  const dirRes = await fileReader.readFile(path.join(dir, 'test-dir'));
  expect(dirRes).toBeNull();
  const res = await fileReader.readFile(path.join(dir, 'index.ts'));
  expect(res).toMatch('modern');

  const res1 = await fileReader.readFile(path.join(dir, 'index.ts'));
  expect(res1).not.toBeNull();
  expect(res).toMatch('modern');
});

describe('FileReader#cache', () => {
  const tmpFile = path.resolve(__dirname, '../fixtures/fileReader/x.tmp');
  const writeTmpFile = (content: string) =>
    FSModule.writeFile(tmpFile, content);

  const writeReadTmpFile = (content: string) =>
    writeTmpFile(content).then(() => fileReader.readFile(tmpFile));

  beforeEach(async () => {
    await fileReader.reset();
    // touch
    await writeTmpFile('');
  });
  afterEach(async () => {
    await FSModule.rm(tmpFile);
  });

  it('should read cached content first', async () => {
    await expect(writeReadTmpFile('foo')).resolves.toBe('foo');
    await expect(writeReadTmpFile('bar')).resolves.toBe('foo');
  });

  it('should read file again after FileReader reset', async () => {
    await expect(writeReadTmpFile('foo2')).resolves.toBe('foo2');
    await fileReader.reset();
    await expect(writeReadTmpFile('bar2')).resolves.toBe('bar2');
  });
});

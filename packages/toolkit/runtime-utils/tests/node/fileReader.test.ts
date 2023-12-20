import path from 'path';
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

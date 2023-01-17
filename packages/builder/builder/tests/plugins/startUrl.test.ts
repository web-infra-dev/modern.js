import { expect, describe, it } from 'vitest';
import { replacePlaceholder } from '@/plugins/startUrl';

describe('plugins/startUrl', () => {
  it('#replacePlaceholder - should replace port number correctly', () => {
    expect(replacePlaceholder('http://localhost:8080', 3000)).toEqual(
      'http://localhost:8080',
    );
    expect(replacePlaceholder('http://localhost:<port>', 3000)).toEqual(
      'http://localhost:3000',
    );
    expect(replacePlaceholder('http://localhost:<port>/path/', 3000)).toEqual(
      'http://localhost:3000/path/',
    );
  });
});

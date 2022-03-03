import { mergeRegex } from '../src/utils/mergeRegex';
import { generateMetaTags } from '../src/utils/generateMetaTags';

describe('mergeRegex', () => {
  it('should merge regexp correctly', () => {
    expect(mergeRegex(/\.js$/, /\.ts$/)).toEqual(/\.js$|\.ts$/);
  });

  it('should merge string correctly', () => {
    expect(mergeRegex('\\.js$', '\\.ts$')).toEqual(/\.js$|\.ts$/);
  });
});

describe('generateMetaTags', () => {
  it('should return empty string when params is empty', () => {
    expect(generateMetaTags()).toEqual('');
  });

  it('should generate meta tag correctly', () => {
    const options = {
      foo: {
        name: 'viewport',
        content: 'width=500, initial-scale=1',
      },
    };
    expect(generateMetaTags(options).trim()).toEqual(
      '<meta name="viewport" content="width=500, initial-scale=1">',
    );
  });
});

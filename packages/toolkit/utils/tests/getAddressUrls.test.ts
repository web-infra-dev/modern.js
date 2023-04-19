import { getAddressUrls } from '../src/prettyInstructions';

describe('getAddressUrls', () => {
  test('should allow to custom host', () => {
    expect(getAddressUrls('http', 3000, 'localhost')).toEqual([
      { label: 'Local:  ', url: 'http://localhost:3000' },
    ]);
    expect(getAddressUrls('http', 3000, '192.168.0.1')).toEqual([
      { label: 'Network:  ', url: 'http://192.168.0.1:3000' },
    ]);
    expect(getAddressUrls('https', 3001, '192.168.0.1')).toEqual([
      { label: 'Network:  ', url: 'https://192.168.0.1:3001' },
    ]);
  });

  test('should get multiple addresses when host is 0.0.0.0', () => {
    expect(getAddressUrls('https', 3001, '0.0.0.0').length > 1).toBeTruthy();
  });
});

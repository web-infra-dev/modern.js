import { parseCookie } from '../../src/universal/request';

describe('test ./src/universal/request.ts', () => {
  it('should keep "=" inside cookie values', () => {
    const request = new Request('http://localhost:8080/', {
      headers: { cookie: 'token=YWJjZA==; theme=dark' },
    });

    expect(parseCookie(request)).toEqual({
      token: 'YWJjZA==',
      theme: 'dark',
    });
  });
});

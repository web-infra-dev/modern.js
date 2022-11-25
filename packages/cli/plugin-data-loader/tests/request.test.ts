/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch';
import { getRequestUrl } from '../src/cli/create-request';

describe('getRequestUrl', () => {
  test('support params', () => {
    const request = new Request('http://localhost:8080/three/:id/profile');
    const routeId = `user/profile/layout`;
    const params = {
      id: '1234',
    };
    const url = getRequestUrl({ params, request, routeId });
    expect(url.href).toEqual(
      `http://localhost:8080/three/1234/profile?_loader=${encodeURIComponent(
        'user/profile/layout',
      )}`,
    );
  });
});

/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch';
import { getRequestUrl } from '../src/cli/create-request';
import { DIRECT_PARAM, LOADER_ID_PARAM } from '../src/common/constants';

describe('getRequestUrl', () => {
  test('support params', () => {
    const request = new Request('http://localhost:8080/three/:id/profile');
    const routeId = `user/profile/layout`;
    const params = {
      id: '1234',
    };
    const url = getRequestUrl({ params, request, routeId });
    expect(url.href).toEqual(
      `http://localhost:8080/three/1234/profile?${LOADER_ID_PARAM}=${encodeURIComponent(
        'user/profile/layout',
      )}&${DIRECT_PARAM}=true`,
    );
  });
});

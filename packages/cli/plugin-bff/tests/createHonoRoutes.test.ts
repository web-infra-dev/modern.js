import { rs } from '@rstest/core';
import { createBffServer } from './bffServer';

describe('BFF HTTP request and response handling', () => {
  let server: Awaited<ReturnType<typeof createBffServer>>;
  beforeAll(async () => {
    server = await createBffServer();
  });

  it('passes ordered path segments, query and a null body to GET handlers', async () => {
    const scoped = await createBffServer('/api/:org');
    for (const id of ['modern', 'rsbuild']) {
      const response = await scoped.request(`/api/web-infra/user/${id}?a=1`);
      const { segments, input } = await response.json();
      expect(segments).toEqual(['web-infra', id]);
      expect(input).toMatchObject({
        params: { org: 'web-infra', id },
        query: { a: '1' },
        body: null,
      });
      expect(input).not.toHaveProperty('data');
    }
  });

  it.each(['GET', 'HEAD'])('does not read a JSON body on %s', async method => {
    const request = new Request('http://localhost/api/upload', {
      method,
      headers: { 'content-type': 'application/json' },
    });
    const text = rs.spyOn(request, 'text');
    const response = await server.request(request);
    expect(response.status).toBe(202);
    expect(response.headers.get('x-bff')).toBe('modern');
    expect(text).not.toHaveBeenCalled();
    if (method === 'GET') {
      expect(await response.json()).toMatchObject({ body: null });
    }
  });

  it('keeps parsing form content types of GET requests', async () => {
    const response = await server.request('/api/hello', {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const input = await response.json();
    expect(input.formUrlencoded).toEqual({});
    expect(input).not.toHaveProperty('body');
  });

  it('parses POST requests by content type', async () => {
    const post = async (body: BodyInit, contentType?: string) => {
      const response = await server.request('/api/hello', {
        method: 'POST',
        body,
        headers: contentType ? { 'content-type': contentType } : {},
      });
      return response.json();
    };

    const json = await post(
      JSON.stringify({ name: 'modern' }),
      'application/json; charset=utf-8',
    );
    expect(json.data).toEqual({ name: 'modern' });
    expect(json).not.toHaveProperty('body');

    const formData = new FormData();
    formData.append('file', 'content');
    const multipart = await post(formData);
    expect(multipart.formData).toEqual({ file: 'content' });
    expect(multipart).not.toHaveProperty('body');

    const urlencoded = await post(
      'a=1&b=2',
      'application/x-www-form-urlencoded',
    );
    expect(urlencoded.formUrlencoded).toEqual({ a: '1', b: '2' });
    expect(urlencoded).not.toHaveProperty('body');

    expect((await post('{"a":1}', 'text/plain')).body).toEqual({ a: 1 });
    expect((await post('not json', 'text/plain')).body).toBeNull();
  });

  it('validates multipart files in Upload handlers with Zod 4', async () => {
    const formData = new FormData();
    formData.append(
      'images',
      new File(['image contents'], 'mock_image.png', { type: 'image/png' }),
    );
    formData.append('params', JSON.stringify({ id: 1 }));

    const response = await server.request('/api/upload', {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      file_name: 'mock_image.png',
      file_type: 'image/png',
      file_content: 'image contents',
      params: { id: 1 },
    });

    const invalidFormData = new FormData();
    invalidFormData.append('images', 'not a file');
    invalidFormData.append('params', '{}');
    const invalidResponse = await server.request('/api/upload', {
      method: 'POST',
      body: invalidFormData,
    });

    expect(invalidResponse.status).toBe(400);
    expect((await invalidResponse.json()).message).toContain('expected file');
  });

  it('falls back to a null body for other requests without a body', async () => {
    const response = await server.request('/api/hello', { method: 'DELETE' });
    expect(await response.json()).toMatchObject({ body: null });
  });
});

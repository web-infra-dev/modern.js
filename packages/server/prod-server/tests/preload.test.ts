import path from 'path';
import type { ServerOptions } from '@modern-js/server-core';
import { fs } from '@modern-js/utils';
import {
  flushServerHeader,
  FlushServerHeaderOptions,
  parseLinks,
} from '../src/libs/preload';
import { shouldFlushServerHeader } from '../src/libs/preload/shouldFlushServerHeader';

describe('test preload', () => {
  const distDir = path.join(__dirname, 'fixtures', 'preload');
  const template = fs.readFileSync(path.resolve(distDir, 'tpl.html'), 'utf-8');

  describe('test shouldFlushServerHeader', () => {
    type ServerConf = ServerOptions['server'];
    it('test case01', () => {
      const serverConf: ServerConf = {};
      expect(shouldFlushServerHeader(serverConf)).toBeFalsy();
    });

    it('test case02', () => {
      const serverConf: ServerConf = {
        ssr: true,
      };
      expect(shouldFlushServerHeader(serverConf)).toBeFalsy();
    });

    it('test case03', () => {
      const serverConf: ServerConf = {
        ssr: {
          preload: true,
        },
      };

      expect(shouldFlushServerHeader(serverConf)).toBeTruthy();
    });

    it('test case04', () => {
      const serverConf: ServerConf = {
        ssr: {
          preload: {
            userAgentFilter: /spider/,
          },
        },
      };

      expect(
        shouldFlushServerHeader(
          serverConf,
          'Mozilla/5.0 (compatible; xxxxxBot/1.0 ; http://example.com/spider/; )',
        ),
      ).toBeFalsy();
    });

    it('test case05', () => {
      const serverConf: ServerConf = {
        ssr: {
          preload: {
            userAgentFilter: /spider/,
          },
        },
      };

      expect(
        shouldFlushServerHeader(
          serverConf,
          'Mozilla/5.0 (compatible; http://example.com/; )',
        ),
      ).toBeTruthy();
    });

    it('test case06', () => {
      const serverConf: ServerConf = {
        ssr: {
          preload: true,
        },
      };

      expect(shouldFlushServerHeader(serverConf, undefined, true)).toBeFalsy();
    });
  });

  describe('test parseLinks', () => {
    it('parse from template', async () => {
      const links = await parseLinks({ pathname: '', distDir, template });
      expect(links).toMatchSnapshot();
    });

    it('parse from routes', async () => {
      const links = await parseLinks({
        pathname: '/three/user/page',
        distDir,
        template,
      });
      expect(links).toMatchSnapshot();
    });
  });

  it('test flushServerHeader', async () => {
    const headers: any[] = [];
    let flushed = false;
    let responseData = '';
    const optinos: FlushServerHeaderOptions = {
      ctx: {
        res: {
          set(key: string, value: any) {
            headers.push({
              key,
              value,
            });
          },
          flushHeaders() {
            flushed = true;
          },
          write(chunk: unknown) {
            responseData += chunk;
          },
        },
        path: '/three/user/page',
      } as any,
      distDir,
      template,
      serverConf: {
        ssr: {
          preload: {
            include: [
              { url: 'http://example.com', as: 'script' },
              { url: 'http://example.com', as: 'script' },
              {
                url: 'http://example3.com',
                rel: 'dns-prefetch',
              },
              '/static/js/async/three_user/layout.js',
            ],
            attributes: {
              script: {
                crossorigin: true,
                id: 'script_id',
              },
              style: {
                id: 'css_link_id',
              },
            },
          },
        },
      },
      headers: {
        'Content-Type': 'html',
      },
    };

    await flushServerHeader(optinos);
    expect(flushed).toBeTruthy();
    expect(
      headers.map(({ key, value }) => ({ key, value: value.split(', ') })),
    ).toMatchSnapshot();
    const mockDom = '<script></script>';

    expect(responseData).toEqual(new Array(mockDom.length).fill(' ').join(''));
  });
});

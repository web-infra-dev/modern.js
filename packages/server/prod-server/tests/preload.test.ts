import path from 'path';
import type { ServerOptions } from '@modern-js/server-core';
import { fs } from '@modern-js/utils';
import {
  flushServerHeader,
  shouldFlushServerHeader,
  parseLinks,
  FlushServerHeaderOptions,
} from '../src/libs/preload';

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
    const links: any[] = [];
    let flushed = false;
    const optinos: FlushServerHeaderOptions = {
      ctx: {
        res: {
          set(key: string, value: any) {
            links.push({
              key,
              value,
            });
          },
          flushHeaders() {
            flushed = true;
          },
        },
        path: '/three/user/page',
      } as any,
      distDir,
      template,
      serverConf: {
        ssr: {
          preload: true,
        },
      },
      headers: {
        'Content-Type': 'html',
      },
    };

    await flushServerHeader(optinos);
    expect(flushed).toBeTruthy();
    expect(links).toMatchSnapshot();
  });
});

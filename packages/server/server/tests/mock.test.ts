import path from 'path';
import { createMockHandler } from '../src/dev-tools/mock';
import getMockData, { getMatched } from '../src/dev-tools/mock/getMockData';
import { noop } from './helper';

describe('test dev tools', () => {
  describe('should mock middleware work correctly', () => {
    const pwd = path.join(__dirname, './fixtures/mock');

    it('should return null if no config mock dir', () => {
      expect(createMockHandler({ pwd: path.join(pwd, 'empty') })).toBeNull();
    });

    it('should return null if no api dir', () => {
      expect(createMockHandler({ pwd: path.join(pwd, 'zero') })).toBeNull();
    });

    it('should return middleware if mock api exist', async () => {
      const middleware = createMockHandler({ pwd: path.join(pwd, 'exist') });

      expect(middleware).not.toBeNull();

      let response: any;
      const context: any = {
        path: '/api/getInfo',
        method: 'get',
        res: {
          setHeader: noop,
          end: (data: any) => {
            response = JSON.parse(data);
          },
        },
      };
      await middleware?.(context, noop);
      expect(response).toEqual({
        data: [1, 2, 3, 4],
      });
    });

    it('should not return middleware if mock api exist', async () => {
      const middleware = createMockHandler({ pwd: path.join(pwd, 'exist') });

      expect(middleware).not.toBeNull();

      let response: any;
      const context: any = {
        path: '/api/getInfp',
        method: 'get',
        res: {
          setHeader: noop,
          end: (data: any) => {
            response = JSON.parse(data);
          },
        },
      };
      await middleware?.(context, noop);
      expect(response).toBeUndefined();
    });

    it('should get api list correctly', resolve => {
      const apiList = getMockData(path.join(pwd, 'exist/config/mock/index.ts'));
      expect(apiList.length).toBe(3);

      const pathList = apiList.map(api => api.path);
      expect(pathList).toEqual([
        '/api/getInfo',
        '/api/getExample',
        '/api/addInfo',
      ]);

      let response: any;
      const context: any = {
        res: {
          setHeader: noop,
          end: (data: any) => {
            try {
              response = JSON.parse(data);
            } catch (e) {
              response = data;
            }
          },
        },
      };

      apiList[0].handler(context, noop as any);
      expect(response).toEqual({
        data: [1, 2, 3, 4],
      });
      apiList[1].handler(context, noop as any);
      expect(response).toEqual({ id: 1 });

      apiList[2].handler(context, noop as any);
      setTimeout(() => {
        expect(response).toBe('delay 2000ms');
        resolve();
      }, 3000);
    });

    it('should match api correctly', () => {
      const apiList = [
        {
          method: 'get',
          path: '/api/getInfo',
          handler: noop,
        },
        {
          method: 'get',
          path: '/api/getExample',
          handler: noop,
        },
        {
          method: 'get',
          path: '/api/addInfo',
          handler: noop,
        },
      ];
      const matched = getMatched(
        { path: '/api/getInfo', method: 'get' } as any,
        apiList,
      );
      expect(matched).toBe(apiList[0]);

      const missMethod = getMatched(
        { path: '/api/getModern', method: 'post' } as any,
        apiList,
      );
      expect(missMethod).toBeUndefined();
    });

    it('should throw error if get mock file fail', resolve => {
      try {
        createMockHandler({ pwd: path.join(pwd, 'module-error') });
      } catch (e: any) {
        expect(e.message).toMatch('parsed failed!');
        resolve();
      }
    });

    it('should throw error if get mock api has wrong type', resolve => {
      try {
        createMockHandler({ pwd: path.join(pwd, 'type-error') });
      } catch (e: any) {
        expect(e.message).toMatch(
          'should be object or function, but got string',
        );
        resolve();
      }
    });
  });
});

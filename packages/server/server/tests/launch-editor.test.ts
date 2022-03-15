import { LAUNCH_EDITOR_ENDPOINT } from '@modern-js/utils';
import { createLaunchEditorHandler } from '../src/dev-tools/launch-editor';
import { noop } from './helper';

describe('should createLaunchEditorHandler work correctly', () => {
  const middleware = createLaunchEditorHandler();

  it('should return 200 if filename exist', () => {
    let response: any;
    const context: any = {
      url: LAUNCH_EDITOR_ENDPOINT,
      query: {
        filename: 'test.ts',
      },
      res: {
        end: (data: any) => {
          response = data;
        },
      },
    };
    middleware(context, noop);
    expect(context.status).toBe(200);
    expect(response).toBeUndefined();
  });

  it('should return 500 if filename not exist', () => {
    let response: any;
    const context: any = {
      url: LAUNCH_EDITOR_ENDPOINT,
      query: {
        filename: '',
      },
      res: {
        end: (data: any) => {
          response = data;
        },
      },
    };
    middleware(context, noop);
    expect(context.status).toBe(500);
    expect(typeof response === 'string').toBeTruthy();
  });

  it('should invoke next if not launch editor url', () => {
    let response: any;
    const context: any = {
      url: '',
      res: {
        end: (data: any) => {
          response = data;
        },
      },
    };
    middleware(context, noop);
    expect(context.status).toBeUndefined();
    expect(response).toBeUndefined();
  });
});

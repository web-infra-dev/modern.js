import {
  createWorkflow,
  createAsyncWorkflow,
  createParallelWorkflow,
  isWorkflow,
  isAsyncWorkflow,
  isParallelWorkflow,
  createAsyncInterruptWorkflow,
} from '../src/workflow';
import { sleep } from './helpers';

describe('workflow', () => {
  describe('sync', () => {
    it('should run with attaching order', () => {
      const workflow = createWorkflow();

      let count = 0;
      workflow.use(() => {
        count++;
      });

      workflow.use(() => {
        count++;
      });

      workflow.use(() => {
        count++;
      });

      workflow.run();

      expect(count).toBe(3);
    });

    it('should run and return the values', () => {
      const workflow = createWorkflow<void, number>();

      let count = 0;
      workflow.use(() => ++count);
      workflow.use(() => ++count);

      const result = workflow.run();

      expect(result).toEqual([1, 2]);
    });

    it('isWorkflow', () => {
      const workflow = createWorkflow();

      expect(isWorkflow(workflow)).toBeTruthy();
      expect(isWorkflow({})).toBeFalsy();
      expect(isWorkflow('test')).toBeFalsy();
      expect(isWorkflow(null)).toBeFalsy();
    });
  });

  describe('async', () => {
    it('should run with attaching order', async () => {
      const workflow = createAsyncWorkflow();

      let count = 0;

      workflow.use(() => {
        count = 1;
      });

      workflow.use(async () => {
        await sleep(100);
        count = 2;
      });

      workflow.use(() => {
        count = 3;
      });

      await workflow.run();

      expect(count).toBe(3);
    });

    it('isAsyncWorkflow', () => {
      const workflow = createAsyncWorkflow();

      expect(isAsyncWorkflow(workflow)).toBeTruthy();
      expect(isAsyncWorkflow({})).toBeFalsy();
      expect(isAsyncWorkflow('test')).toBeFalsy();
      expect(isAsyncWorkflow(null)).toBeFalsy();
    });
  });

  describe('parallel', () => {
    it('should run without stable order', async () => {
      const workflow = createParallelWorkflow();

      let count = 0;

      workflow.use(() => {
        count = 1;
      });

      workflow.use(async () => {
        await sleep(100);
        count = 2;
      });

      workflow.use(() => {
        count = 3;
      });

      await workflow.run();

      expect(count).toBe(2);
    });

    it('isParallelWorkflow', () => {
      const workflow = createParallelWorkflow();

      expect(isParallelWorkflow(workflow)).toBeTruthy();
      expect(isParallelWorkflow({})).toBeFalsy();
      expect(isParallelWorkflow('test')).toBeFalsy();
      expect(isParallelWorkflow(null)).toBeFalsy();
    });
  });
  describe('interrupt', () => {
    it('should return interrupt value', async () => {
      const workflow = createAsyncInterruptWorkflow();

      let count = 0;

      workflow.use(() => {
        count = 1;
      });

      workflow.use(async () => {
        await sleep(100);
        count = 2;
      });

      // eslint-disable-next-line consistent-return
      workflow.use((_, interrupt) => {
        if (interrupt) {
          return interrupt('test');
        }
        count = 3;
      });

      workflow.use(() => {
        count = 4;
      });

      const result = await workflow.run();

      expect(count).toBe(2);
      expect(result).toBe('test');
    });
  });
});

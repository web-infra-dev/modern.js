import { sleep } from './helpers';
import {
  createWorkflow,
  createAsyncWorkflow,
  createParallelWorkflow,
  isWorkflow,
  isAsyncWorkflow,
  isParallelWorkflow,
} from '../src/workflow';

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
});

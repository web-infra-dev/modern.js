import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isDebug, logger } from './logger';

describe('logger', () => {
  // Store original environment variable
  const originalDebug = process.env.DEBUG;

  // Reset environment variable before each test
  beforeEach(() => {
    process.env.DEBUG = undefined;
  });

  // Restore environment variable after each test
  afterEach(() => {
    process.env.DEBUG = originalDebug;
  });

  describe('isDebug', () => {
    it('should return false when DEBUG is not set', () => {
      expect(isDebug()).toBe(false);
    });

    it('should return true when DEBUG includes modernjs:image', () => {
      process.env.DEBUG = 'modernjs:image';
      expect(isDebug()).toBe(true);
    });

    it('should return true when DEBUG includes MODERNJS:IMAGE (uppercase)', () => {
      process.env.DEBUG = 'MODERNJS:IMAGE';
      expect(isDebug()).toBe(true);
    });

    it('should return true when DEBUG includes wildcard *', () => {
      process.env.DEBUG = '*';
      expect(isDebug()).toBe(true);
    });

    it('should work correctly when DEBUG contains multiple values', () => {
      process.env.DEBUG = 'other:debug,modernjs:image,something:else';
      expect(isDebug()).toBe(true);
    });

    it('should return false when DEBUG is set to other values', () => {
      process.env.DEBUG = 'other:debug';
      expect(isDebug()).toBe(false);
    });
  });

  describe('logger instance', () => {
    it('should export logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('should set verbose level in debug mode', async () => {
      process.env.DEBUG = 'modernjs:image';
      // Need to reload the module to trigger logger level setting
      vi.resetModules();
      const { logger: debugLogger } = await import('./logger');
      expect(debugLogger.level).toBe('verbose');
    });
  });
});

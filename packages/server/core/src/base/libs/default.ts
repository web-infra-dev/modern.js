import { Reporter } from '@modern-js/types';
import { Logger, Metrics } from '../../core/server';

export const defaultMetrics: Metrics = {
  emitCounter() {
    // no impl
  },
  emitTimer() {
    // no impl
  },
};

export const defaultLogger: Logger = {
  error() {
    // no impl
  },
  info(): void {
    // no impl
  },
  warn(): void {
    // no impl
  },
  debug(): void {
    // no impl
  },
};

export const defaultReporter: Reporter = {
  init() {
    // noImpl
  },
  reportError() {
    // noImpl
  },
  reportTiming() {
    // noImpl
  },
  reportInfo() {
    // noImpl
  },
  reportWarn() {
    // noImpl
  },
};

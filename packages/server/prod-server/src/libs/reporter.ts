import { Reporter } from '@modern-js/types/server';

export const defaultReporter: Reporter = {
  reportEvent(_) {
    // noImpl
  },
  reportLog(_) {
    // noImpl
  },
  reportError() {
    // noImpl
  },
  reportTime() {
    // noImpl
  },
  reportInfo(): void {
    // noImpl
  },
  reportWarn(): void {
    // noImpl
  },
};

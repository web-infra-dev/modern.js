import React from 'react';
import { getGlobalApp, getGlobalRoutes } from '../context';

export function createRoot() {
  console.log('createRoot');
  const app = getGlobalApp();
  const routes = getGlobalRoutes();
  if (app) {
    return app;
  }
  console.log('routes', routes);
  return React.Fragment;
}

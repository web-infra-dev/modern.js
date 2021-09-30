import React from 'react';
import { render } from '@testing-library/react';
import app from './app';

const WrapModernProviders = (props: any) =>
  React.createElement(app.createApp(props));

const customRender = (ui: React.ReactElement, options: any) =>
  render(ui, { wrapper: WrapModernProviders, ...options });

export default customRender as typeof render;

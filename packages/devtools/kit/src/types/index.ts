export interface IframeTabView {
  type: 'iframe';
  src: string;
}

export type CustomTabView = IframeTabView;

export interface CustomTab {
  name: string;
  title: string;
  view: CustomTabView;
  icon?: string;
}

export * from './server';
export * from './client';
export * from './mount-point';

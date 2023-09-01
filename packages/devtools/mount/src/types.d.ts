export interface Options {
  client: string;
  dataSource: string;
  version: string;
}

export type MountDevTools = (options: Partial<Options>) => void;

export declare const mountDevTools: MountDevTools;

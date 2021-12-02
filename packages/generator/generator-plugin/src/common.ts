export enum PluginType {
  Extend = 'extend', // customize Modern.js solution
  New = 'new', // create new solution
}

export interface IExtendInfo {
  extend: string;
}

export interface ICustomInfo {
  key: string; // solution key
  name: string; // solution show name
  type: string; // solution base solution
}

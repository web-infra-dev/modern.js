import path from 'path';
import { ROUTE_PREFIX } from './constants';

export function transformModuleName(name: string) {
  return name.replace(/\//g, '_').replace(/-/g, '_');
}

export function getModulePath(name: string) {
  return path
    .join(`${ROUTE_PREFIX}/modules`, `${transformModuleName(name)}`)
    .replace(/\\/g, '/');
}

export function getClassPath(moduleName: string, className: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/classes`,
      `${transformModuleName(moduleName)}.${className}`,
    )
    .replace(/\\/g, '/');
}

export function getInterfacePath(moduleName: string, interfaceName: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/interfaces`,
      `${transformModuleName(moduleName)}.${interfaceName}`,
    )
    .replace(/\\/g, '/');
}

export function getFunctionPath(moduleName: string, functionName: string) {
  return path
    .join(
      `${ROUTE_PREFIX}/functions`,
      `${transformModuleName(moduleName)}.${functionName}`,
    )
    .replace(/\\/g, '/');
}

import {
  parseExportInfoFromESMCode,
  validateExportVariableName,
} from './parseExports';

export const commentDefaultExport = '// ESMPACK PATCH DEFAULT EXPORT';
export const commentNamedExport = '// ESMPACK PATCH NAMED EXPORTS';

export async function rewriteExports(code: string) {
  const exportInfo = await parseExportInfoFromESMCode(code);
  if (!exportInfo) {
    return code;
  }
  const {
    hasDefaultExport,
    defaultExportId,
    defaultExportAssignedKeySet,
    localVariableNames,
    namedExportsInsideCode,
    namedExportsOutsideCode,
    namedExportAlias,
  } = exportInfo;

  if (hasDefaultExport) {
    /**
     * 有 default 的情况下，尝试把 default 的属性都作为 named export
     */
    if (defaultExportId) {
      const assignedKeysSet = new Set(defaultExportAssignedKeySet);

      const conflictVariableNameSetInsideCode = new Set<string>();
      // remove already name exported
      for (const key of assignedKeysSet) {
        if (localVariableNames.has(key)) {
          assignedKeysSet.delete(key);
          conflictVariableNameSetInsideCode.add(key);
        }
        if (namedExportsInsideCode.has(key)) {
          assignedKeysSet.delete(key);
          conflictVariableNameSetInsideCode.delete(key);
        }
        if (namedExportsOutsideCode.has(key)) {
          assignedKeysSet.delete(key);
          conflictVariableNameSetInsideCode.delete(key);
        }
        if (!validateExportVariableName(key)) {
          assignedKeysSet.delete(key);
          conflictVariableNameSetInsideCode.delete(key);
        }
      }
      /**
       * const Item = () => {};
       * const Component = () => {};
       * Component.Item = Item;
       * export default Component;
       *
       * ---------
       * const Item = () => {};
       * export { Item };
       * // ...
       */
      // 在当前 scope 定义的 var，直接 export {}
      let localVariableNamedExportCode = '';
      if (conflictVariableNameSetInsideCode.size) {
        localVariableNamedExportCode = `export {
${Array.from(conflictVariableNameSetInsideCode)
  .map(k => `  ${k}`)
  .join(',\n')}
}`;
      }

      if (localVariableNamedExportCode) {
        code += `
${commentNamedExport}
${localVariableNamedExportCode}
`;
      }

      // default 上挂载的都使用 export const xxx = defaultExportId.xxx 导出
      if (assignedKeysSet.size) {
        const moreNamedExportLine = Array.from(assignedKeysSet).map(key => {
          return `export const ${key} = ${defaultExportId}.${key};`;
        });
        code += `
${commentNamedExport}
${moreNamedExportLine.join('\n')}
`;
      }

      // 尝试把 named export 挂载在 default 上
      const patchDefaultWithNamedExportNameList = Array.from(
        namedExportsInsideCode,
      ).filter(x => !defaultExportAssignedKeySet.has(x));
      if (patchDefaultWithNamedExportNameList.length) {
        const patchDefaultWithNamedExportCodeList =
          patchDefaultWithNamedExportNameList.map(exportedName => {
            const localName = namedExportAlias[exportedName];
            if (exportedName === '__moduleExports') {
              return `if (!('${exportedName}' in ${defaultExportId})) { Object.defineProperty(${defaultExportId}, '${exportedName}', { value: ${localName} }); }`;
            }
            return `if (!${defaultExportId}.${exportedName}) { ${defaultExportId}.${exportedName} = ${localName}; }`;
          });
        code += `
${commentDefaultExport}
try {
  if ('object' === typeof ${defaultExportId} || 'function' === typeof ${defaultExportId}) {
${patchDefaultWithNamedExportCodeList.join('\n')}
if (!('default' in ${defaultExportId})) { Object.defineProperty(${defaultExportId}, 'default', { value: ${defaultExportId} }); }
  }
} catch(_e) {
  // no-catch
}
`;
      }
    }
    return code;
  }

  /**
   * 当没有 default 的情况下 patch 一个 export
   * 包含尽可能多的 exports
   * 当前只处理 namedExportsInCode
   * TODO：处理 namedExportsOutsideCode, 从其他模块 reexport 的形式
   */
  // 1. no exports, patch a default null
  if (!namedExportsInsideCode.size) {
    code += `
${commentDefaultExport}
export default null;
`;
    return code;
  }

  // 2. export default { ... }
  const exportLines = Array.from(namedExportsInsideCode.values()).map(
    exportedName => {
      const localName = namedExportAlias[exportedName];
      if (localName) {
        return `${exportedName}: ${localName}`;
      }
      return exportedName;
    },
  );
  code += `
${commentDefaultExport}
export default {
${exportLines.join(',\n')}
}
`;

  return code;
}

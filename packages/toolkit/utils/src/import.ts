// cover: https://rushstack.io/pages/api/node-core-library.import.lazy/
const lazy = (
  moduleName: string,
  getRequireFn: () => (id: string) => unknown,
): any => {
  const importLazyLocal: (moduleName: string) => unknown =
    require('../compiled/import-lazy')(getRequireFn());
  return importLazyLocal(moduleName);
};

export { lazy as lazyImport };

export const Import = { lazy };

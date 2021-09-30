import { isDev } from '@modern-js/utils';
import { LoaderManifest, MODE } from '../manifest-op';

const FUNCTION_CREATE_CONTAINER_NAME = 'createContainer';
const FUNCTION_USE_LOADER_NAME = 'useLoader';
const FUNCTION_USE_STATIC_LOADER_NAME = 'useStaticLoader';
const CONTAINER_LOADER_NAME = 'loader';
const CONTAINER_STATIC_LOADER_NAME = 'staticLoader';

const noop = function () {
  return { name: 'babel-plugin-ssg-static-loader' };
};

// develoment not need to static analysis
const loader = isDev()
  ? noop
  : function () {
      const loaderManifest = new LoaderManifest();
      let useSSG = 0;
      let createContainer: string | null = null;
      let useStaticLoader: string | null = null;
      let useLoader: string | null = null;

      return {
        name: 'babel-plugin-ssg-static-loader',
        // reset settings whenever a new file passes through loader
        pre() {
          useSSG = 0;
          createContainer = null;
          useStaticLoader = null;
          useLoader = null;
        },
        visitor: {
          ImportSpecifier(path: any) {
            const importName = path.get('imported.name').node;
            const localName = path.get('local.name').node;

            if (importName === FUNCTION_CREATE_CONTAINER_NAME) {
              createContainer = localName;
            }

            if (importName === FUNCTION_USE_STATIC_LOADER_NAME) {
              useStaticLoader = localName;
            }

            if (importName === FUNCTION_USE_LOADER_NAME) {
              useLoader = localName;
            }
          },
          Identifier(path: any) {
            // If the current file uses useLoader, the page can use SSG in MIXIN mode
            // Todo: Mixin Mode is not support
            const nodeName = path.node.name;
            if (nodeName === useLoader && path.key === 'callee') {
              useSSG = Math.max(useSSG, MODE.MIXIN);
              return;
            }

            // If the current file uses useStaticLoader, the page can use SSG in STRICT mode
            if (nodeName === useStaticLoader && path.key === 'callee') {
              useSSG = Math.max(useSSG, MODE.STRICT);
              return;
            }

            // after testing the Hook API, skip detection if the current nodeName is not 'container.(loader | staticLoader)'
            if (
              nodeName !== CONTAINER_LOADER_NAME &&
              nodeName !== CONTAINER_STATIC_LOADER_NAME
            ) {
              return;
            }

            // if the current nodeName is 'container.(loader | staticLoader)', check whether the calling node is 'createContainer'
            const closestPath = path.find((p: any) => p.isCallExpression());
            if (closestPath?.node?.callee?.name === createContainer) {
              if (nodeName === CONTAINER_LOADER_NAME) {
                useSSG = Math.max(useSSG, MODE.MIXIN);
                return;
              }

              if (nodeName === CONTAINER_STATIC_LOADER_NAME) {
                useSSG = Math.max(useSSG, MODE.STRICT);
              }
            }
          },
        },
        post(file: any) {
          const { filename } = file.opts;
          // if the current usage mode is not determined, that is, no runtime API is used, the default is LOOSE
          if (!useSSG) {
            useSSG = MODE.LOOSE;
          }

          loaderManifest.add(filename, useSSG);
        },
      };
    };

export default loader;

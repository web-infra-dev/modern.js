import { getDeferredBootstrapCode } from '@modern-js/render/html';
import { ROUTER_DATA_JSON_ID } from '../../core/constants';

// Keep the router's s/r/p protocol as an adapter to the shared data store.
// Route IDs remain owned by the router and form a separate source namespace.
export const setupFnStr = `function s(r,e){return window.__MODERN_RENDER_DATA__.read("router:"+r,e)};`;

export const resolveFnStr = `function r(e,r,o,A){window.__MODERN_RENDER_DATA__.resolve("router:"+e,r,o,A)};`;

/**
   * update data for pre resolved promises
   * original function:
   * function preResolvedDeferredPromise(data, error) {
    if(typeof error !== 'undefined'){
      return Promise.reject(new Error(error.message));
    }else{
      return Promise.resolve(data);
    }
  }
   */
export const preResolvedFnStr = `function p(e,r){return void 0!==r?Promise.reject(new Error(r.message)):Promise.resolve(e)};`;

/**
 * let initialScripts = '...';
 * initialScripts += Object.entries(activeDeferreds)
      .map(([routeId, deferredData]) => {
        const pendingKeys = new Set(deferredData.pendingKeys);
        const { deferredKeys } = deferredData;
        const deferredKeyPromiseStr = deferredKeys
          .map(key => {
            if (pendingKeys.has(key)) {
              deferredDataScripts.push(
                <DeferredDataScript
                  nonce={props?.nonce}
                  key={`${routeId} | ${key}`}
                  data={deferredData.data[key]}
                  dataKey={key}
                  routeId={routeId}
                />,
              );

              return `${JSON.stringify(key)}: _ROUTER_DATA.s(${JSON.stringify(
                routeId,
              )},${JSON.stringify(key)}) `;
            } else {
              const trackedPromise = deferredData.data[key] as TrackedPromise;
              if (typeof trackedPromise._error !== 'undefined') {
                const error = {
                  message: trackedPromise._error.message,
                  stack:
                    process.env.NODE_ENV !== 'production'
                      ? trackedPromise._error.stack
                      : undefined,
                };
                return `${JSON.stringify(
                  key,
                )}: _ROUTER_DATA.p(${undefined}, ${serializeJson(error)})`;
              } else {
                if (typeof trackedPromise._data === 'undefined') {
                  throw new Error(
                    `The deferred data for ${key} was not resolved, did you forget to return data from a deferred promise`,
                  );
                }
                return `${JSON.stringify(key)}: _ROUTER_DATA.p(${serializeJson(
                  trackedPromise._data,
                )})`;
              }
            }
          })
          .join(',\n');

        return `Object.assign(_ROUTER_DATA.loaderData[${JSON.stringify(
          routeId,
        )}], {${deferredKeyPromiseStr}});`;
      })
      .join('\n');
 */
/**
 * Abstracting the above logic to `mergeLoaderData`:
 *  function mergeLoaderData (routeIdJsonStr, deferredKeyPromiseManifests) {
      const source = deferredKeyPromiseManifests.reduce(function(o, {key, routerDataFnName, routerDataFnArgs }) {
        const args = routerDataFnArgs.map(arg => {
          if (arg === 'undefined' || arg === null) {
            return undefined;
          }
          return JSON.parse(arg);
        });
        return {...o, [key]: _ROUTER_DATA[routerDataFnName](...args)};
      }, {});
      Object.assign(_ROUTER_DATA.loaderData[routeIdJsonStr], source);
    };
 */
export const mergeLoaderDataStr = `function mergeLoaderData(e,n){var r=n.reduce((function(e,{key:n,routerDataFnName:r,routerDataFnArgs:a}){var t=a.map((e=>{if("undefined"!==e&&null!==e)return JSON.parse(e)}));return console.info("args",t),{...e,[n]:_ROUTER_DATA[r](...t)}}),{});Object.assign(_ROUTER_DATA.loaderData[e],r)}`;

/**
   * This original string is: ${setupFnStr};${resolveFnStr};${preResolvedFnStr};
   * function mergeData (routeIdJsonStr, deferredKeyPromiseManifests) {
      const source = deferredKeyPromiseManifests.reduce(function(o, {key, routerDataFnName, routerDataFnArgs }) {
        return {...o, [key]: _ROUTER_DATA[routerDataFnName](...routerDataFnArgs)}
      }, {});
      Object.assign(_ROUTER_DATA.loaderData[routeIdJsonStr], source);
    };
   */
export const initRouterDataAttrs = `${getDeferredBootstrapCode()}_ROUTER_DATA.s = ${setupFnStr}_ROUTER_DATA.r = ${resolveFnStr}_ROUTER_DATA.p = ${preResolvedFnStr}${mergeLoaderDataStr}`;

/**
  function runWindowFn() {
    window[document.currentScript.getAttribute('data-fn-name')](...JSON.parse(document.currentScript.getAttribute('data-fn-args')))
  }
  function runRouterDataFn() {
    _ROUTER_DATA[document.currentScript.getAttribute('data-fn-name')](...JSON.parse(document.currentScript.getAttribute('data-fn-args')))
  }
  function initRouterData(id) {
    const ele = document.getElementById(id);
    if (ele) {
      try {
        _ROUTER_DATA = JSON.parse(ele.textContent);
      } catch(e) {
        console.error("parse ".concat(id, " error"), t);
        _ROUTER_DATA = {};
      }
    }
  }
  initRouterData();
  ${initRouterDataAttrs}
*/
export const modernInline = `function runWindowFn(){window[document.currentScript.getAttribute("data-fn-name")].apply(window,JSON.parse(document.currentScript.getAttribute("data-fn-args")))}function runRouterDataFn(){_ROUTER_DATA[document.currentScript.getAttribute("data-fn-name")].apply(_ROUTER_DATA,JSON.parse(document.currentScript.getAttribute("data-fn-args")))}function initRouterData(e){var r=document.getElementById(e);if(r)try{_ROUTER_DATA=JSON.parse(r.textContent)}catch(r){console.error("parse ".concat(e," error"),t),_ROUTER_DATA={}}};initRouterData('${ROUTER_DATA_JSON_ID}');${initRouterDataAttrs}`;

export const runRouterDataFnStr = `runRouterDataFn();`;

export const runWindowFnStr = `runWindowFn();`;

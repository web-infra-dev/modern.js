/**
 * setup promises for deferred data
 * original function:
  function setupDeferredPromise(routeId, key) {
    _ROUTER_DATA.r  = _ROUTER_DATA.r || {};
    _ROUTER_DATA.r[routeId] = _ROUTER_DATA.r[routeId] || {};
    const promise = new Promise(function (resolve, reject) {
      _ROUTER_DATA.r[routeId][key] = {
        resolve,
        reject,
      };
    });
    return promise;
  };
 *
 */
const setupFnStr = `function s(r,e){_ROUTER_DATA.r=_ROUTER_DATA.r||{},_ROUTER_DATA.r[r]=_ROUTER_DATA.r[r]||{};return new Promise((function(A,R){_ROUTER_DATA.r[r][e]={resolve:A,reject:R}}))};`;

/**
     * resolve promises for deferred data
     * original function:
      function resolveDeferredPromise(routeId, key, data, error) {
        if (error) {
          _ROUTER_DATA.r[routeId][key].reject(error);
        } else {
          _ROUTER_DATA.r[routeId][key].resolve(data);
        }
      };
     */
const resolveFnStr = `function r(e,r,o,A){A?_ROUTER_DATA.r[e][r].reject(A):_ROUTER_DATA.r[e][r].resolve(o)};`;

/**
     * update data for pre resolved promises
     * original function:
     * function preResovledDeferredPromise(data, error) {
      if(typeof error !== 'undefined'){
        return Promise.reject(new Error(error.message));
      }else{
        return Promise.resolve(data);
      }
    }
     */
const preResolvedFnStr = `function p(e,r){return void 0!==r?Promise.reject(new Error(r.message)):Promise.resolve(e)};`;

/**
   * This original string is: ${setupFnStr};${resolveFnStr};${preResolvedFnStr};
   * function mergeData (routeIdJsonStr, deferredKeyPromiseManifests) {
      const source = deferredKeyPromiseManifests.reduce(function(o, {key, routerDataFnName, routerDataFnArgs }) {
        return {...o, [key]: _ROUTER_DATA[routerDataFnName](...routerDataFnArgs)}
      }, {});
      Object.assign(_ROUTER_DATA.loaderData[routeIdJsonStr], source);
    };
   */
export const initRouterDataAttrs = `_ROUTER_DATA.s = ${setupFnStr}_ROUTER_DATA.r = ${resolveFnStr}_ROUTER_DATA.p = ${preResolvedFnStr}function mergeData(a,e){e=e.reduce(function(a,{key:e,routerDataFnName:r,routerDataFnArgs:t}){return{...a,[e]:_ROUTER_DATA[r](...t)}},{});Object.assign(_ROUTER_DATA.loaderData[a],e)}`;

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
   */
export const defineRunInlineAndRouterDataInit = `function runWindowFn(){window[document.currentScript.getAttribute("data-fn-name")](...JSON.parse(document.currentScript.getAttribute("data-fn-args")))}function runRouterDataFn(){_ROUTER_DATA[document.currentScript.getAttribute("data-fn-name")](...JSON.parse(document.currentScript.getAttribute("data-fn-args")))}function initRouterData(e){var r=document.getElementById(e);if(r)try{_ROUTER_DATA=JSON.parse(r.textContent)}catch(r){console.error("parse ".concat(e," error"),t),_ROUTER_DATA={}}}`;

export const runRouterDataFnStr = `runRouterDataFn();`;

export const runWindowFnStr = `runWindowFn();`;

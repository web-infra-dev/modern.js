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
export const setupFnStr = `function s(r,e){_ROUTER_DATA.r=_ROUTER_DATA.r||{},_ROUTER_DATA.r[r]=_ROUTER_DATA.r[r]||{};return new Promise((function(A,R){_ROUTER_DATA.r[r][e]={resolve:A,reject:R}}))};`;

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
export const resolveFnStr = `function r(e,r,o,A){A?_ROUTER_DATA.r[e][r].reject(A):_ROUTER_DATA.r[e][r].resolve(o)};`;

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
        return {...o, [key]: _ROUTER_DATA[routerDataFnName](...routerDataFnArgs)}
      }, {});
      Object.assign(_ROUTER_DATA.loaderData[routeIdJsonStr], source);
    };
 */
export const mergeLoaderDataStr = `function mergeLoaderData(a,e){e=e.reduce(function(a,{key:e,routerDataFnName:r,routerDataFnArgs:t}){return{...a,[e]:_ROUTER_DATA[r](...t)}},{});Object.assign(_ROUTER_DATA.loaderData[a],e)}`;

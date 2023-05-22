/* eslint-disable react/no-danger */
import { TrackedPromise } from '@modern-js/utils/runtime/router';
import { Suspense, useEffect, useRef, useMemo, useContext } from 'react';
import {
  Await,
  UNSAFE_DataRouterContext as DataRouterContext,
  useAsyncError,
} from 'react-router-dom';
import { serializeJson } from '@modern-js/utils/runtime-node';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';
import { serializeErrors } from './utils';

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
 * DeferredDataScripts only renders in server side,
 * it doesn't need to be hydrated in client side.
 */
const DeferredDataScripts = () => {
  const context = useContext(DataRouterContext);
  const { staticContext } = context || {};
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = true;
  }, []);

  // No need to memo since DeferredDataScripts only renders in server side,
  // here we memo it in case DeferredDataScripts renders in client side one day.
  const deferredScripts: [string, JSX.Element[]] | null = useMemo(() => {
    if (!staticContext) {
      return null;
    }

    const activeDeferreds = staticContext.activeDeferreds || [];

    const _ROUTER_DATA = {
      loaderData: staticContext.loaderData,
      errors: serializeErrors(staticContext.errors),
    };

    let initialScripts = [
      `_ROUTER_DATA = ${serializeJson(_ROUTER_DATA)};`,
      `_ROUTER_DATA.s = ${setupFnStr}`,
      `_ROUTER_DATA.r = ${resolveFnStr}`,
      `_ROUTER_DATA.p = ${preResolvedFnStr}`,
    ].join('\n');
    const deferredDataScripts: JSX.Element[] = [];

    initialScripts += Object.entries(activeDeferreds)
      .map(([routeId, deferredData]) => {
        const pendingKeys = new Set(deferredData.pendingKeys);
        const { deferredKeys } = deferredData;
        const deferredKeyPromiseStr = deferredKeys
          .map(key => {
            if (pendingKeys.has(key)) {
              deferredDataScripts.push(
                <DeferredDataScript
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

    return [initialScripts, deferredDataScripts];
  }, []);

  if (!deferredScripts) {
    return null;
  }

  return (
    <>
      {!hydratedRef.current && (
        <script
          async
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: deferredScripts[0] }}
        />
      )}
      {!hydratedRef.current && deferredScripts[1]}
      {JSX_SHELL_STREAM_END_MARK}
    </>
  );
};

const DeferredDataScript = ({
  data,
  routeId,
  dataKey,
}: {
  data: any;
  routeId: string;
  dataKey: string;
}) => {
  return (
    <Suspense>
      {typeof document === 'undefined' && data && dataKey && routeId ? (
        <Await
          resolve={data}
          errorElement={
            <ErrorDeferredDataScript routeId={routeId} dataKey={dataKey} />
          }
        >
          {(data: any) => (
            <script
              async
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: `_ROUTER_DATA.r(${JSON.stringify(
                  routeId,
                )}, ${JSON.stringify(dataKey)}, ${serializeJson(data)});`,
              }}
            />
          )}
        </Await>
      ) : null}
    </Suspense>
  );
};

const ErrorDeferredDataScript = ({
  routeId,
  dataKey,
}: {
  routeId: string;
  dataKey: string;
}) => {
  const error = useAsyncError() as Error;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `_ROUTER_DATA.r(${JSON.stringify(routeId)}, ${JSON.stringify(
          dataKey,
        )}, ${undefined}, ${serializeJson({
          message: error.message,
          stack: error.stack,
        })});`,
      }}
    />
  );
};

export default DeferredDataScripts;

/* eslint-enable react/no-danger */

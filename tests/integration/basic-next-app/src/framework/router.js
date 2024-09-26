/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

// ---------------------------------------------------------
// Note: this code would usually be provided by a framework.
// ---------------------------------------------------------

import React from 'react';
import {
  createFromFetch,
  createFromReadableStream,
} from 'react-server-dom-webpack/client.browser';
import {
  createContext,
  startTransition,
  useContext,
  useState,
  use,
} from 'react';
import '../style.css';

const RouterContext = createContext();
const initialCache = new Map();

// 向服务端发送 location，拿到响应，然后渲染
export function Router() {
  const [cache, setCache] = useState(initialCache);
  const [location, setLocation] = useState({
    selectedId: null,
    isEditing: false,
    searchText: '',
  });

  const locationKey = JSON.stringify(location);
  let content = cache.get(locationKey);
  if (document && !content) {
    const fetchUrl =
      typeof window !== 'undefined'
        ? '/react?location=' + encodeURIComponent(locationKey)
        : `http://localhost:${process.env.PORT || 8080}/react?location=` +
          encodeURIComponent(locationKey);

    content = createFromFetch(fetch(fetchUrl));
    cache.set(locationKey, content);
  }

  function refresh(response) {
    startTransition(() => {
      const nextCache = new Map();
      if (response != null) {
        const locationKey = response.headers.get('X-Location');
        const nextLocation = JSON.parse(locationKey);
        const nextContent = createFromReadableStream(response.body);
        nextCache.set(locationKey, nextContent);
        navigate(nextLocation);
      }
      setCache(nextCache);
    });
  }

  function navigate(nextLocation) {
    startTransition(() => {
      setLocation(loc => ({
        ...loc,
        ...nextLocation,
      }));
    });
  }

  return (
    <RouterContext.Provider value={{ location, navigate, refresh }}>
      {use(content)}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function useMutation({ endpoint, method }) {
  const { refresh } = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [didError, setDidError] = useState(false);
  const [error, setError] = useState(null);
  if (didError) {
    // Let the nearest error boundary handle errors while saving.
    throw error;
  }

  async function performMutation(payload, requestedLocation) {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${endpoint}?location=${encodeURIComponent(
          JSON.stringify(requestedLocation),
        )}`,
        {
          method,
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      refresh(response);
    } catch (e) {
      setDidError(true);
      setError(e);
    } finally {
      setIsSaving(false);
    }
  }

  return [isSaving, performMutation];
}

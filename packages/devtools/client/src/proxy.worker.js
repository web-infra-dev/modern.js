const users = [
  {
    id: '1',
    name: 'User 1',
  },
  {
    id: '2',
    name: 'User 2',
  },
  {
    id: '3',
    name: 'User 3',
  },
];

const getUserById = ({ id }) => users.find(user => user.id === id);

const responses = [
  {
    url: 'https://api.example.com/json',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      message: 'a json response',
    },
  },
  {
    url: 'https://api.example.com/users/:id',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: params => getUserById(params),
  },
  {
    url: 'https://api.example.com/text',
    method: 'GET',
    body: 'plain text body',
  },
  {
    url: 'https://api.example.com/pdf',
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
    },
    file: 'demo/example.pdf',
  },
  {
    url: 'https://api.example.com/post',
    method: 'POST',
    status: 201,
    statusText: 'Created',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      message: 'created',
    },
  },
  {
    url: 'https://api.example.com/script.js',
    method: 'GET',
    headers: {
      'Content-Type': 'text/javascript',
    },
    body: {
      message: 'alert("foo")',
    },
  },
  {
    url: 'https://api.example.com/notfound',
    method: 'GET',
    status: 404,
    statusText: 'Not found',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      message: 'Not found',
    },
  },
  {
    url: 'https://localhost/*',
    method: 'GET',
    status: 302,
    redirectUrl: 'http://localhost:8080/$1',
  },
];

const handleInstall = () => {
  console.log('[SWOPR] service worker installed');

  self.skipWaiting();
};

const handleActivate = () => {
  console.log('[SWOPR] service worker activated');

  return self.clients.claim();
};

const delayResponse = (time, response) =>
  new Promise(resolve => setTimeout(() => resolve(response), time));
const compose =
  (...fns) =>
  x =>
    fns.reduce((res, f) => res || f(x), false);

const getResponseFor = ({ url: reqUrl, method: reqMethod }) => {
  const exactUrlMatch = ({ url, method }) =>
    url === reqUrl && method === reqMethod;
  const patternUrlMatch = ({ url, method }) => {
    return (
      url.includes('*') &&
      new RegExp(url.replace('*', '(.+)')).test(reqUrl) &&
      method === reqMethod
    );
  };

  const paramsUrlMatch = ({ url, method }) => {
    return (
      url.includes(':') &&
      new RegExp(`${url.replaceAll(/(:[a-z-A-Z0-9]+)/g, '([0-9]+)')}$`).test(
        reqUrl,
      ) &&
      method === reqMethod
    );
  };

  const exactOrPatternMatch = compose(
    exactUrlMatch,
    patternUrlMatch,
    paramsUrlMatch,
  );

  return responses.find(exactOrPatternMatch);
};

const getRequestParams = (matchedUrl, reqUrl) => {
  const params = [...matchedUrl.matchAll(/(:[a-z-A-Z0-9]+)/g)].map(([m]) => m);
  const values = [...reqUrl.matchAll(/(?<=\/)[0-9]+/g)].map(([m]) => m);

  return params.reduce(
    (acc, key, index) => ({ ...acc, [key.substring(1)]: values[index] }),
    {},
  );
};

const getResponseBody = (response, params) =>
  typeof response.body === 'function' ? response.body(params) : response.body;

const handleFetch = async e => {
  const { request } = e;
  const { method: reqMethod, url: reqUrl } = request;
  const response = getResponseFor(request);

  if (response) {
    const {
      headers,
      status,
      statusText,
      delay,
      resMethod,
      url: matchedUrl,
    } = response;
    const params = matchedUrl.includes(':')
      ? getRequestParams(matchedUrl, reqUrl)
      : null;

    const redirectUrl = matchedUrl.includes('*')
      ? reqUrl.replace(
          new RegExp(matchedUrl.replace('*', '(.+)')),
          response.redirectUrl,
        )
      : response.redirectUrl;
    const init = {
      headers,
      status,
      statusText,
      url: reqUrl,
      method: resMethod ? resMethod : reqMethod,
    };

    // eslint-disable-next-line no-nested-ternary
    const proxyResponse = response.file
      ? fetch(`${self.origin}/${response.file}`)
      : redirectUrl
      ? fetch(redirectUrl, init)
      : Promise.resolve(
          new Response(JSON.stringify(getResponseBody(response, params)), init),
        );

    const msg = `[SWOPR] proxying request ${reqMethod}: ${reqUrl}`;
    console.log(
      `${msg} ${redirectUrl ? `-> ${redirectUrl}` : ``} ${
        response.file ? `-> serving: ${response.file}` : ``
      }`,
    );

    e.waitUntil(
      e.respondWith(
        delay ? delayResponse(delay, proxyResponse) : proxyResponse,
      ),
    );
  }
};

self.addEventListener('install', handleInstall);
self.addEventListener('activate', handleActivate);
self.addEventListener('fetch', handleFetch);

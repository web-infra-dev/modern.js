/* eslint-disable max-lines */
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable consistent-return */
/* eslint-disable node/no-deprecated-api */
/**
 * create-react-app
 * Configuring the Proxy Manually
 * see https://facebook.github.io/create-react-app/docs/proxying-api-requests-in-development
 */
import url from 'url';
import path from 'path';
import { Buffer } from 'buffer';
import zlib from 'zlib';
import bodyParser from 'body-parser';
import { fs } from '@modern-js/utils';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Express } from 'express';
import { indexHtml } from '../constants';
import { readdir } from './util';
import toBlockMap from './util/to-block-map';
import { getStories, saveAsStory } from './util/stories';
import { parseStories } from './util/parse-stories';
import { getLocalDataSources } from './util/getLocalDataSources';
import { isContainer, getPageContainerList } from './util/container';
import { getDependencyMap } from './util/dependency';
import getName from './util/getPkgName';
import getEditorStaticPath from './util/getEditorStaticPath';
import { category, model } from './components';

const responseSuccess = (res: any, data: any) => {
  const resData: Record<string, any> = {
    code: 0,
    message: 'success',
  };
  if (data) {
    resData.data = data;
  }
  res.json(resData);
};

const responseError = (res: any, err: any) => {
  res.json({
    code: err?.code || 1,
    message: err.toString() || 'error',
  });
};

export default function (
  app: Express,
  {
    type,
    port,
    appDirectory,
    internalDirectory,
  }: {
    type: string;
    port: string;
    appDirectory: string;
    internalDirectory: string;
  },
  { isTest = false, debug = false },
) {
  // 可以通过环境变量EDITOR_REMOTE_URL 动态设置编辑器地址
  const editorStaticPath =
    process.env.EDITOR_REMOTE_URL || getEditorStaticPath(isTest);
  const localSandbox = path.join(internalDirectory, `.nocode.sandbox.json`);
  const localSandboxPage = path.join(internalDirectory, `.nocode.page.json`);

  app.use(cors());

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
    }),
  );
  app.use(bodyParser.text({ limit: '50mb' }));
  app.use(bodyParser.raw({ limit: '50mb' }));

  app.use((req, res, next) => {
    const parsed = url.parse(req.url, true);
    req.query = parsed.query;
    next();
  });

  app.get('/', (req, res) => {
    res.json({
      coed: 0,
      data: null,
    });
  });

  app.get('/category', (req, res) => {
    try {
      const { mode = 'blcok' } = req.query;
      const { meta = {}, name, version } = require(path.join(
        appDirectory,
        'package.json',
      ));
      if (typeof mode === 'string' && mode.toLowerCase() === 'block') {
        res.json(category(meta, name, version));
      } else {
        res.json(model(meta, name, version));
      }
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/sandbox', (req, res) => {
    try {
      if (fs.existsSync(localSandbox)) {
        const sandboxes = JSON.parse(
          fs.readFileSync(localSandbox, 'utf-8') || '[]',
        );
        if (Array.isArray(sandboxes)) {
          const sandbox = sandboxes.find(
            it => it.sandboxId === req.query.sandboxId,
          );
          return res.json(sandbox ? sandbox : null);
        } else {
          // 兼容一下老版本，老版的是 Object, 新版的是Array
          fs.removeSync(localSandbox);
        }
      }
      return res.json(null);
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.post('/sandbox', (req, res) => {
    try {
      if (fs.existsSync(localSandbox)) {
        let sandboxes = JSON.parse(
          fs.readFileSync(localSandbox, 'utf-8') || '[]',
        );
        if (Array.isArray(sandboxes)) {
          const index = sandboxes.findIndex(
            it => it.sandboxId === req.query.sandboxId,
          );
          if (index > -1) {
            sandboxes[index] = req.body.sandbox;
          } else {
            sandboxes = [...sandboxes, req.body.sandbox];
          }
          fs.ensureFileSync(localSandbox);
          fs.writeFileSync(localSandbox, JSON.stringify(sandboxes));
        } else {
          fs.ensureFileSync(localSandbox);
          fs.writeFileSync(localSandbox, JSON.stringify([req.body.sandbox]));
        }
      } else {
        fs.ensureFileSync(localSandbox);
        fs.writeFileSync(localSandbox, JSON.stringify([req.body.sandbox]));
      }
      res.json({ code: 0 });
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/page/:id', (req, res) => {
    try {
      if (fs.existsSync(localSandboxPage)) {
        const pageData = JSON.parse(
          fs.readFileSync(localSandboxPage, 'utf-8') || '[]',
        );
        const data = pageData.find((it: any) => it.pageId === req.params.id);
        return res.json(data ? data : null);
      }

      return res.json(null);
    } catch (err) {
      console.error(err);
      return responseError(res, err);
    }
  });

  app.post('/page/:id', (req, res) => {
    try {
      if (fs.existsSync(localSandboxPage)) {
        let pageData = JSON.parse(
          fs.readFileSync(localSandboxPage, 'utf-8') || '[]',
        );
        const index = pageData.findIndex(
          (it: any) => it.pageId === req.params.id,
        );
        if (index > -1) {
          pageData[index] = req.body.pageData;
        } else {
          pageData = [...pageData, req.body.pageData];
        }
        fs.ensureFileSync(localSandboxPage);
        fs.writeFileSync(localSandboxPage, JSON.stringify(pageData));
      } else {
        const pageData = [req.body.pageData];
        fs.ensureFileSync(localSandboxPage);
        fs.writeFileSync(localSandboxPage, JSON.stringify(pageData));
      }

      res.json({ code: 0 });
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/unpkg', (req, res) => {
    try {
      const text = fs.readFileSync(
        path.join(process.cwd(), 'dist/umd/index.js'),
        'utf-8',
      );
      const { name } = require(path.join(appDirectory, 'package.json'));
      const textArr = text.split('\n');
      textArr.pop(); // sourceMap realpath
      const source = textArr.join('\n');
      res.send(
        `(() => {
  try {
    const module_ = { exports: {}, default: undefined };
    const exports_ = module_.exports;
    console.info('@byted-blocks/local-block start');
    const setModule = (${source});
    setModule.call(window, module_, exports_, window.require);

    window.registerBlocks('${name}', '${getName(name)}', module_.exports);
  } catch(e) {
    console.info('区块${name}引入错误：', e)
  }
})()
//# sourceMappingURL=https://localhost:${port}/source-map`,
      );
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/source-map', (req, res) => {
    try {
      res.send(
        fs.readFileSync(
          path.join(process.cwd(), 'dist/umd/index.js.map'),
          'utf-8',
        ),
      );
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/ui_tools_api/dependencies', (req, res) => {
    const { blocks } = toBlockMap();
    try {
      res.json(blocks);
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.all('/ui_tools_api/dependency_map/*', (req: any, res) => {
    try {
      const pkgName = req.params['0'];
      const mapText = getDependencyMap(pkgName);
      res.send(mapText);
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  if (type === 'block') {
    app.options('/fes/newBlock', (req, res) => {
      const { infos } = toBlockMap();
      try {
        responseSuccess(res, infos);
      } catch (err) {
        console.error(err);
        responseError(res, err);
      }
    });
  }

  if (type === 'plugin') {
    app.options('/fes/newPlugin', (req, res) => {
      try {
        responseSuccess(res, 'ok');
      } catch (err) {
        console.info(err);
        responseError(res, err);
      }
    });
  }

  app.options('/ui_tools_api/local_sources', (req, res) => {
    const data = getLocalDataSources();
    try {
      responseSuccess(res, data);
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/ui_tools_api/sources', async (req, res) => {
    try {
      const block = await readdir(path.resolve(__dirname, '../'), 'src');
      responseSuccess(res, { ...block });
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.get('/ui_tools_api/is_container', (req, res) => {
    try {
      const container = isContainer();
      responseSuccess(res, container);
    } catch (err) {
      // console.error(err);
      responseError(res, err);
    }
  });

  app.get('/ui_tools_api/container', (req, res) => {
    try {
      const list = getPageContainerList();
      responseSuccess(res, list);
    } catch (err) {
      // console.error(err);
      responseError(res, err);
    }
  });

  app.get('/ui_tools_api/stories', (req, res) => {
    try {
      parseStories();
      const stories = getStories();
      responseSuccess(res, stories);
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  app.post('/ui_tools_api/saveStory', (req, res) => {
    try {
      const { name, data } = req.body;
      const story = saveAsStory({ name, data });
      responseSuccess(res, { story });
    } catch (err) {
      console.error(err);
      responseError(res, err);
    }
  });

  // app.use(
  //   '/api',
  //   createProxyMiddleware({
  //     target: 'http://fes2.bytedance.net',
  //     changeOrigin: true,
  //   }),
  // );
  // 这里一定要放在最后面
  app.use(
    '/',
    createProxyMiddleware({
      target: editorStaticPath,
      changeOrigin: true,
      logLevel: debug ? 'debug' : 'silent',
      pathRewrite: (urlPath: string, req: any) => {
        const { pathname } = url.parse(req.url);
        if (pathname === '/' || /\/p\/*/.test(pathname || '')) {
          return indexHtml;
        }

        return path;
      },
      selfHandleResponse: true,
      onProxyRes: (proxyRes: any, request: any, res: any) => {
        const bodyChunks: any = [];
        proxyRes.on('data', (chunk: any) => {
          bodyChunks.push(chunk);
        });

        proxyRes.on('end', () => {
          const body = Buffer.concat(bodyChunks);

          if (proxyRes.statusCode !== undefined) {
            res.status(proxyRes.statusCode);
          }

          Object.keys(proxyRes.headers).forEach(key => {
            res.append(key, proxyRes.headers[key]);
          });

          if (proxyRes.headers['content-type']?.includes('text/html')) {
            const isGzip = res.getHeader('content-encoding') === 'gzip';
            let html = isGzip
              ? zlib.gunzipSync(body).toString()
              : body.toString();

            const index = html.lastIndexOf('</body>');
            html = `${html.substr(
              0,
              index,
            )}<script src="/reload/reload.js"></script>${html.substr(index)}`;

            res.send(isGzip ? zlib.gzipSync(html) : Buffer.from(html));
          } else {
            res.send(body);
          }

          res.end();
        });
      },
    } as any),
  );
}
/* eslint-enable node/no-deprecated-api */
/* eslint-enable max-lines */

import { ServerCore } from './core';
import { ServerCoreOptions } from './type';

export function createServer(options: ServerCoreOptions) {
  const server = new ServerCore(options);

  // server.use(otherMiddlewars )

  return server;
}

// TODO: another way
// export class Server {
//   private core: ServerCore;

//   constructor(core: ServerCore) {
//     this.core = core;
//     this.core.use(async (_, next) => {
//       console.log('run beforeReq');
//       await next();
//       console.log('run afterReq');
//     });
//   }

//   get use() {
//     return this.core.use;
//   }

//   get get() {
//     return this.core.get;
//   }

//   get post() {
//     return this.core.post;
//   }

//   get handle() {
//     return this.core.handle;
//   }
// }

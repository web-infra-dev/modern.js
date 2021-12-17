import net from 'net';

const NORMAL_PORT = 3000;
const MAX_RANGE_PORT = 17000;

// 检测端口是否被占用
function detectPort(port: number) {
  return new Promise(resolve => {
    // 创建服务并监听该端口
    const server = net.createServer().listen(port);

    server.on('listening', () => {
      // 执行这块代码说明端口未被占用
      server.close(); // 关闭服务
      resolve(true);
    });

    server.on('error', err => {
      if ((err as any).code === 'EADDRINUSE') {
        // 端口已经被使用
        resolve(false);
      }
    });
  });
}

const freePort = async () => {
  let port = randomPort();
  while (!(await detectPort(port))) {
    port = randomPort();
  }
  return port;
};

const randomPort = () =>
  NORMAL_PORT + Math.round(Math.random() * MAX_RANGE_PORT);

export default freePort;

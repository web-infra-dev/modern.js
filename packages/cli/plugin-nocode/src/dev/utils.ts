import os from 'os';

export const getIP = () => {
  const interfaces = os.networkInterfaces();
  const interfacesKeys = Object.keys(interfaces);
  const ip = interfacesKeys
    .map(k => interfaces[k]?.filter(i => i.family === 'IPv4' && !i.internal))
    .reduce((address, i) => address?.concat(i || []), []);

  return ip;
};

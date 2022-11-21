import util from 'util';

export const useOutput = () => {
  let buf = '';
  const log = (...args: any[]) => {
    buf += util.format(...args);
    buf += '\n';
  };
  const handle = (out: any) => log(out);
  const toString = () => buf;
  return { handle, toString, log };
};

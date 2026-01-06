export const externalDebug = ({ request }: any, callback: any) => {
  if (request) {
    if (request.includes('compiled/debug/index.js')) {
      return callback(undefined, 'var ()=>{return ()=>{}}');
    }
  }
  callback();
};

export const externalGlobby = ({ request }: any, callback: any) => {
  if (request) {
    if (request.includes('compiled/globby/index.js')) {
      return callback(undefined, 'var {}');
    }
  }
  callback();
};

import { getCertificate } from './getCert';

export const genHttpsOptions = (userOptions: any) => {
  const httpsOptions = userOptions === true ? {} : userOptions;

  let fakeCert;
  if (!httpsOptions.key || !httpsOptions.cert) {
    fakeCert = getCertificate();
  }

  httpsOptions.key = httpsOptions.key || fakeCert;
  httpsOptions.cert = httpsOptions.cert || fakeCert;
  return httpsOptions;
};

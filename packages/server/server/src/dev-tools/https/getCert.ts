import path from 'path';
import os from 'os';
import { fs } from '@modern-js/utils';
import createCertificate from './createCertificate';

function getCertificate() {
  // Use a self-signed certificate if no certificate was configured.
  // Cycle certs every 24 hours
  const certificateDir = os.tmpdir();
  const certificatePath = path.join(certificateDir, 'server.pem');

  let certificateExists = fs.existsSync(certificatePath);

  if (certificateExists) {
    const certificateTtl = 1000 * 60 * 60 * 24;
    const certificateStat = fs.statSync(certificatePath);

    const now = new Date();

    // cert is more than 30 days old, kill it with fire
    if (
      (now.getTime() - certificateStat.ctime.getTime()) / certificateTtl >
      30
    ) {
      fs.unlinkSync(certificatePath);
      certificateExists = false;
    }
  }

  if (!certificateExists) {
    const attributes = [{ name: 'commonName', value: 'localhost' }];
    const pems = createCertificate(attributes);

    fs.mkdirSync(certificateDir, { recursive: true });
    fs.writeFileSync(certificatePath, pems.private + pems.cert, {
      encoding: 'utf8',
    });
  }

  return fs.readFileSync(certificatePath);
}

export { getCertificate };

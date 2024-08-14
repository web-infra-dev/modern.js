import execSync from './execSync';

const networkTypes = ['Ethernet', 'Thunderbolt Ethernet', 'Wi-Fi'];

const isMacOS = () => process.platform === 'darwin';

const getNetworkType = () => {
  for (let i = 0; i < networkTypes.length; i++) {
    const type = networkTypes[i];
    const result = execSync(`networksetup -getwebproxy ${type}`);

    if (result.status === 0) {
      return type;
    }
  }

  throw new Error('Unknown network type');
};

export const enableGlobalProxy = (ip: string, port: string) => {
  // The `networksetup` command only exists under macOS
  if (!isMacOS()) {
    return;
  }

  const networkType = getNetworkType();

  // && networksetup -setproxybypassdomains ${networkType} localhost localhost
  execSync(`networksetup -setwebproxy ${networkType} ${ip} ${port}`);
  execSync(`networksetup -setsecurewebproxy ${networkType} ${ip} ${port}`);
};

export const disableGlobalProxy = () => {
  if (!isMacOS()) {
    return;
  }

  const networkType = getNetworkType();
  execSync(`networksetup -setwebproxystate ${networkType} off`);
  execSync(`networksetup -setsecurewebproxystate ${networkType} off`);
};

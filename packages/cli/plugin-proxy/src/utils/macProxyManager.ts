import execSync from './execSync';

const networkTypes = ['Ethernet', 'Thunderbolt Ethernet', 'Wi-Fi'];

const getNetworkType = () => {
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
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
  const networkType = getNetworkType();

  // && networksetup -setproxybypassdomains ${networkType} 127.0.0.1 localhost
  execSync(`networksetup -setwebproxy ${networkType} ${ip} ${port}`);
  execSync(`networksetup -setsecurewebproxy ${networkType} ${ip} ${port}`);
};

export const disableGlobalProxy = () => {
  const networkType = getNetworkType();
  execSync(`networksetup -setwebproxystate ${networkType} off`);
  execSync(`networksetup -setsecurewebproxystate ${networkType} off`);
};

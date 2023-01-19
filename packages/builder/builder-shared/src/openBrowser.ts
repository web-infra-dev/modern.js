/**
 * The following code is modified based on source found in
 * https://github.com/facebook/create-react-app
 *
 * MIT Licensed
 * Copyright (c) 2015-present, Facebook, Inc.
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import { execSync } from 'child_process';
import open from '../compiled/open';

const supportedChromiumBrowsers = [
  'Google Chrome Canary',
  'Google Chrome Dev',
  'Google Chrome Beta',
  'Google Chrome',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
];

export async function openBrowser(url: string): Promise<boolean> {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // a Chromium browser with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript = process.platform === 'darwin';

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      const ps = execSync('ps cax').toString();
      const openedBrowser = supportedChromiumBrowsers.find(b => ps.includes(b));
      if (openedBrowser) {
        // Try to reuse existing tab with AppleScript
        execSync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${openedBrowser}"`,
          {
            stdio: 'ignore',
          },
        );
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    await open(url);
    return true;
  } catch (err) {
    return false;
  }
}

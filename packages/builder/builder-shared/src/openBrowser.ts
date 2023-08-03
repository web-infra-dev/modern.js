/**
 * The following code is modified based on source found in
 * https://github.com/facebook/create-react-app
 *
 * MIT Licensed
 * Copyright (c) 2015-present, Facebook, Inc.
 * https://github.com/facebook/create-react-app/blob/master/LICENSE
 */
import { execSync } from 'child_process';
import { join } from 'path';
import open from '../compiled/open';
import { logger } from './logger';

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

const getTargetBrowser = () => {
  // Use user setting first
  let targetBrowser = process.env.BROWSER;
  // If user setting not found or not support, use opening browser first
  if (!targetBrowser || !supportedChromiumBrowsers.includes(targetBrowser)) {
    const ps = execSync('ps cax').toString();
    targetBrowser = supportedChromiumBrowsers.find(b => ps.includes(b));
  }
  return targetBrowser;
};

export async function openBrowser(url: string): Promise<boolean> {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // a Chromium browser with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript = process.platform === 'darwin';

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      const targetBrowser = getTargetBrowser();
      if (targetBrowser) {
        // Try to reuse existing tab with AppleScript
        execSync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${targetBrowser}"`,
          {
            stdio: 'ignore',
            cwd: join(__dirname, '../static'),
          },
        );
        return true;
      }
      return false;
    } catch (err) {
      logger.error(
        'Failed to open start URL with apple script:',
        JSON.stringify(err),
      );
      return false;
    }
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    await open(url);
    return true;
  } catch (err) {
    logger.error('Failed to open start URL:', JSON.stringify(err));
    return false;
  }
}

import path from 'path';
import { logger, fs } from '@modern-js/utils';
import type { DevProxyOptions } from '@modern-js/core';

interface ProxyRule {
  pattern: string;
  target: string;
}

const createWhistleProxyRule = (ruleDirectory: string, rules: ProxyRule[]) => {
  const dest = path.resolve(ruleDirectory, 'proxy.rule.js');

  let code = `/.*/ enable://intercept\n`;

  for (const rule of rules) {
    const { pattern, target } = rule;
    code += `${pattern} ${target}\n`;
  }

  fs.outputFileSync(
    dest,
    `exports.name = 'modernjs proxy rule';\nexports.rules = \`${code}\`;`,
  );
  return dest;
};

export const createProxyRule = (
  appDirectory: string,
  proxyOptions: DevProxyOptions,
) => {
  const rules = [];

  if (proxyOptions && typeof proxyOptions === 'string') {
    return proxyOptions;
  }

  if (typeof proxyOptions === 'object') {
    for (const pattern of Object.keys(proxyOptions)) {
      const target = proxyOptions[pattern];
      if (!target || typeof target !== 'string') {
        logger.error(`dev.proxy.${pattern} value should be string type`);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
      rules.push({ pattern, target });
    }
  }

  return createWhistleProxyRule(appDirectory, rules);
};

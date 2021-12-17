export const getRequireCode = (plugins: string[]) =>
  plugins
    .map(
      (p, index) => `const mod_${index} = require('${p}');
const plugin_${index} =  mod_${index}.default || mod_${index};`,
    )
    .join('\n');

export const getPluginsCode = (plugins: string[]) =>
  `[${plugins.map((p, index) => `plugin_${index}`).join(',')}]`;

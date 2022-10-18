import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

/**
 * When using markdown-it-include, vuepress can't trigger hmr correctly
 * So we added this hack to fix the hmr.
 */
if (process.env.NODE_ENV === 'development') {
  chokidar
    .watch(
      path.resolve(
        __dirname,
        '../../node_modules/@modern-js/builder-doc/**/*.md',
      ),
      {
        followSymlinks: true,
      },
    )
    .on('change', changedPath => {
      const filePath = changedPath.split('@modern-js/builder-doc/')[1];
      if (filePath) {
        const [lang, _, type] = filePath.split('/');
        const issuerFile = path.join(
          __dirname,
          '..',
          lang,
          'api',
          `config-${type}.md`,
        );

        if (fs.existsSync(issuerFile)) {
          fs.writeFileSync(issuerFile, fs.readFileSync(issuerFile, 'utf-8'));
        }
      }
    });
}

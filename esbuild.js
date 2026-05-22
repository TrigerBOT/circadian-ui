const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const ctx = esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !watch,
});

if (watch) {
  ctx.then((c) => c.watch()).then(() => console.log('[circadian-ui] watching…'));
} else {
  ctx.then((c) => c.rebuild()).then(() => {
    console.log('[circadian-ui] built dist/extension.js');
    return ctx.then((c) => c.dispose());
  });
}

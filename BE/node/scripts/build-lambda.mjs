// Bundles the Lambda entrypoint and all dependencies into dist-lambda/index.mjs.
import { rmSync } from 'node:fs';
import { build } from 'esbuild';

rmSync('dist-lambda', { recursive: true, force: true });

await build({
  entryPoints: ['src/lambda.ts'],
  outfile: 'dist-lambda/index.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: true,
  // CommonJS dependencies (express etc.) call require(); ESM output needs it defined
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});

console.log('Built dist-lambda/index.mjs');

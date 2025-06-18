const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  input: 'src/index.ts',
  output: [
    // CommonJS (for Node.js)
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    // ES Modules (for bundlers)
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
    }),
  ].filter(Boolean),
  external: [
    // Don't bundle these - they should be peer dependencies
    'react', // Optional peer dependency
    // Bundle @kuyo/types since it's a dependency
  ],
};
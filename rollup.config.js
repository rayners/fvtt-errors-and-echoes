import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/module.ts',
  output: {
    file: 'dist/module.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true
    }),
    copy({
      targets: [
        { src: 'module.json', dest: 'dist/' },
        { src: 'templates/*.hbs', dest: 'dist/templates/' },
        { src: 'languages/*.json', dest: 'dist/languages/' },
        { src: 'styles/*.css', dest: 'dist/' }
      ]
    })
  ],
  external: []
};
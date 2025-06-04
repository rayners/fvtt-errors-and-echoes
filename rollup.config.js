import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/module.ts',
  output: {
    file: 'dist/module.js',
    format: 'es',
    sourcemap: false,
    inlineDynamicImports: true
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      declaration: false,
      declarationMap: false
    }),
    copy({
      targets: [
        { src: 'module.json', dest: 'dist/' },
        { src: 'templates/*.hbs', dest: 'dist/templates/' },
        { src: 'languages/*.json', dest: 'dist/languages/' },
        { src: 'styles/*.css', dest: 'dist/styles/' },
        { src: 'examples/', dest: 'dist/' },
        { src: 'README.md', dest: 'dist/' },
        { src: 'CHANGELOG.md', dest: 'dist/' },
        { src: 'LICENSE', dest: 'dist/' }
      ]
    })
  ],
  external: []
};
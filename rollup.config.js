import { createFoundryConfig } from '@rayners/foundry-dev-tools';

export default createFoundryConfig({
  cssFileName: 'styles/errors-and-echoes.css',
  additionalCopyTargets: [
    { src: 'examples/', dest: 'dist/' },
    { src: 'styles/*.css', dest: 'dist/styles/' },
  ],
  // Disable SCSS processing since E&E uses plain CSS
  scssOptions: {
    output: false,
  },
});

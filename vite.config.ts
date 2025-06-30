import { resolve } from 'path';
import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DagEditor',
      fileName: (format) => `dag-editor.${format}.js`,
    },
    rollupOptions: {
      external: [], // add dependencies that shouldn't be bundled
      output: {
        globals: {},
      },
    },
  },
  plugins: [typescript({ tsconfig: './tsconfig.json' })],
});

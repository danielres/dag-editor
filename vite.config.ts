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
      external: ['sortablejs'],
      output: {
        globals: {
          sortablejs: 'Sortable',
        },
      },
    },
  },
  plugins: [typescript({ tsconfig: './tsconfig.json' })],
});
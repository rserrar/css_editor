import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // HMR can be disabled through DISABLE_HMR when needed.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

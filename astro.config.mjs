import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://giuseppeblog.onrender.com',
  prefetch: true,
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  vite: {
    ssr: {
      noExternal: ['@astrojs/dev-toolbar'],
    },
  },
});

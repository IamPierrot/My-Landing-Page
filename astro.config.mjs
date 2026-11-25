// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://pierrot.io.vn',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],

  markdown: {
      shikiConfig: {
          theme: 'github-dark-default',
          wrap: true,
      },
	},

  vite: {
    plugins: [tailwindcss()],
  },
});
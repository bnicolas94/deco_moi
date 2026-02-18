import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    integrations: [
        tailwind(),
        react({ exclude: ['**/components/cart/**', '**/components/checkout/**'] }),
        preact({ include: ['**/components/cart/**', '**/components/checkout/**'] }), // Carrito y Checkout
    ],
    vite: {
        resolve: {
            alias: {
                '@': '/src',
            },
        },
    },
});

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos: o app funciona em qualquer pasta de hospedagem estática
  // (GitHub Pages em subpasta, Netlify, Cloudflare Pages etc.).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      // O app se atualiza sozinho quando há versão nova (sem perguntas para a usuária).
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Relatório de Visitas',
        short_name: 'Visitas',
        description: 'Registre visitas pastorais e gere o relatório em PDF.',
        lang: 'pt-BR',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        background_color: '#faf7f0',
        theme_color: '#17468f',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Guarda TODOS os arquivos para uso sem internet. Inclui o dicionário do
        // corretor ortográfico (.dic/.aff, vários MB) na Fase 5.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json,woff2,dic,aff}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

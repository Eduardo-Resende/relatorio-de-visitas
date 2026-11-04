// Gera os ícones do app (PNG) a partir de um desenho SVG.
// Uso: node scripts/gerar-icones.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2159b3"/>
      <stop offset="1" stop-color="#0f3169"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#fundo)"/>
  <circle cx="512" cy="512" r="360" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="14"/>
  <rect x="462" y="250" width="100" height="520" rx="22" fill="#ffffff"/>
  <rect x="340" y="378" width="344" height="100" rx="22" fill="#ffffff"/>
  <path d="M512 905 C 430 840 380 800 380 745 C 380 705 410 680 445 680 C 475 680 497 697 512 722 C 527 697 549 680 579 680 C 614 680 644 705 644 745 C 644 800 594 840 512 905 Z" fill="#ffb400" transform="translate(0 -40) scale(1 .9) translate(0 70)"/>
</svg>`

await mkdir('public/icons', { recursive: true })
const base = Buffer.from(svg)

const saidas = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]
for (const [arquivo, tamanho] of saidas) {
  await sharp(base).resize(tamanho, tamanho).png().toFile(arquivo)
  console.log('ok', arquivo)
}
await writeFile('public/favicon.svg', svg)
console.log('ok public/favicon.svg')

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'favicon.svg')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

// Maskable icon needs ~20% padding so platform masks don't clip the artwork.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0b5d3b"/>
  <g transform="translate(6.4 6.4) scale(0.8)">
    ${svg.toString().replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>`

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, `icon-${size}.png`))
  await sharp(Buffer.from(maskableSvg)).resize(size, size).png().toFile(join(outDir, `icon-${size}-maskable.png`))
}

console.log('Generated icons in', outDir)

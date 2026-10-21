import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '../public/icons')
const svg = join(iconsDir, 'leaf.svg')

async function main() {
  mkdirSync(iconsDir, { recursive: true })
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('sharp not available, skip png icons')
    return
  }
  if (!existsSync(svg)) return
  const sizes = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-512-maskable.png', 512],
    ['apple-touch.png', 180],
  ]
  for (const [name, size] of sizes) {
    await sharp(svg).resize(size, size).png().toFile(join(iconsDir, name))
    console.log('wrote', name)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

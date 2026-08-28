#!/usr/bin/env node
/**
 * Makes dist/esm loadable as real ESM.
 *
 * TypeScript emits relative import specifiers exactly as written in the source,
 * and this codebase writes them without a file extension. That is fine for
 * CommonJS and for bundlers, but Node's ESM resolver does not guess extensions
 * or directory indexes, so `import './models'` would fail at runtime. This
 * rewrites every relative specifier to the file it actually resolves to and
 * marks the directory as ESM.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'dist', 'esm')

function walk (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name.endsWith('.js') ? [full] : []
  })
}

const nodeModules = path.join(__dirname, '..', 'node_modules')

/** './models' -> './models/index.js', './interface' -> './interface.js' */
function addExtension (target, specifier) {
  if (fs.existsSync(`${target}.js`)) return `${specifier}.js`
  if (fs.existsSync(path.join(target, 'index.js'))) return `${specifier}/index.js`
  return null
}

function resolveSpecifier (fromFile, specifier) {
  if (path.extname(specifier)) return specifier

  if (specifier.startsWith('.')) {
    const resolved = addExtension(path.resolve(path.dirname(fromFile), specifier), specifier)
    if (resolved) return resolved
    throw new Error(`cannot resolve ${specifier} from ${fromFile}`)
  }

  // Deep imports into a dependency ("pkg/lib/main/thing") need the same
  // treatment: Node's ESM resolver will not add the extension for them either,
  // and these dependencies publish CommonJS without an "exports" map.
  const segments = specifier.split('/')
  const depth = specifier.startsWith('@') ? 2 : 1
  if (segments.length <= depth) return specifier

  return addExtension(path.join(nodeModules, specifier), specifier) ?? specifier
}

if (!fs.existsSync(root)) {
  console.error('dist/esm does not exist -- run the esm build first')
  process.exit(1)
}

const files = walk(root)
let rewritten = 0

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const updated = source.replace(
    /(\bfrom\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g,
    (match, prefix, quote, specifier) => {
      const resolved = resolveSpecifier(file, specifier)
      if (resolved !== specifier) rewritten++
      return `${prefix}${quote}${resolved}${quote}`
    }
  )
  if (updated !== source) fs.writeFileSync(file, updated)
}

// Node decides module format from the nearest package.json; the root one has no
// "type", so without this every file here would be parsed as CommonJS. That
// also makes this the nearest manifest for bundlers, so "sideEffects" has to be
// repeated here or the root declaration stops applying to these files.
fs.writeFileSync(
  path.join(root, 'package.json'),
  JSON.stringify({ type: 'module', sideEffects: false }, null, 2) + '\n'
)

console.log(`finalized ${files.length} esm files, rewrote ${rewritten} specifiers`)

/**
 * Writes docs/moldsef/abstract.html and docs/moldsef/visual-annex.html from the benchmark results.
 *
 *   node --import ./research/register.mjs research/makeDocs.ts
 *   chrome --headless --no-pdf-header-footer --print-to-pdf=docs/moldsef/abstract.pdf file:///.../docs/moldsef/abstract.html
 *   chrome --headless --no-pdf-header-footer --print-to-pdf=docs/moldsef/visual-annex.pdf file:///.../docs/moldsef/visual-annex.html
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { abstractHtml, annexHtml } from './docs.ts'

const dir = fileURLToPath(new URL('../docs/moldsef/', import.meta.url))
await mkdir(dir, { recursive: true })
await writeFile(`${dir}abstract.html`, abstractHtml())
await writeFile(`${dir}visual-annex.html`, annexHtml())
console.log(`wrote ${dir}abstract.html and visual-annex.html`)

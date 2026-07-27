const fs = require('fs');
const path = require('path');

const SRC = path.resolve(process.cwd(), 'src');
const exts = ['.jsx', '.js', '.ts', '.tsx', '/index.jsx', '/index.js'];

function walk(dir, files=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function existsCaseSensitive(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir);
  return entries.includes(base);
}

function resolveImport(fromFile, importPath) {
  const baseDir = path.dirname(fromFile);
  const resolved = path.resolve(baseDir, importPath);
  const candidates = [resolved, ...exts.map(e => resolved + e)];
  for (const c of candidates) {
    if (existsCaseSensitive(c)) return true;
  }
  return false;
}

const files = walk(SRC);
const importRegex = /(?:from\s+|import\s*\(\s*)['"](\.[^'"]*)['"]/g;
let problems = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const importPath = m[1];
    if (!resolveImport(file, importPath)) {
      problems.push({ file: path.relative(process.cwd(), file), importPath });
    }
  }
}

if (problems.length === 0) {
  console.log('No broken relative imports found.');
} else {
  console.log(`Found ${problems.length} broken relative import(s):\n`);
  for (const p of problems) {
    console.log(`${p.file}\n  -> imports "${p.importPath}" (not found, case-sensitive)\n`);
  }
}

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

function existsFullPathCaseSensitive(absPath) {
  const parts = absPath.split(path.sep).filter(Boolean);
  let current = path.sep;
  for (const part of parts) {
    if (!fs.existsSync(current)) return false;
    const entries = fs.readdirSync(current);
    if (!entries.includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}

function resolveImport(fromFile, importPath) {
  let resolved;
  if (importPath.startsWith('@/')) {
    resolved = path.join(SRC, importPath.slice(2));
  } else if (importPath.startsWith('.')) {
    resolved = path.resolve(path.dirname(fromFile), importPath);
  } else {
    return true;
  }
  const candidates = [resolved, ...exts.map(e => resolved + e)];
  for (const c of candidates) {
    if (existsFullPathCaseSensitive(c)) return true;
  }
  return false;
}

const files = walk(SRC);
const importRegex = /(?:from\s+|import\s*\(\s*)['"](@\/[^'"]*|\.[^'"]*)['"]/g;
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
  console.log('No broken imports found (relative + @/ alias).');
} else {
  console.log(`Found ${problems.length} broken import(s):\n`);
  for (const p of problems) {
    console.log(`${p.file}\n  -> imports "${p.importPath}" (not found, case-sensitive)\n`);
  }
}

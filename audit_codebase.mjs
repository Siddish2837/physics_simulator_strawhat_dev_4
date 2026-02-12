
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const JS_FILES = [];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (f.startsWith('.') || f === 'node_modules') continue;
        const fp = path.join(dir, f);
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) {
            walk(fp);
        } else if (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.html')) {
            JS_FILES.push(fp);
        }
    }
}

walk(ROOT);

console.log(`Scanning ${JS_FILES.length} files...`);

const EXPORTS = {};
const IMPORTS = [];

// 1. Parse Exports
for (const fp of JS_FILES) {
    if (fp.endsWith('.html')) continue;
    const content = fs.readFileSync(fp, 'utf8');
    EXPORTS[fp] = new Set();

    // Improved Regex
    const regexFn = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const regexConst = /export\s+(?:const|let|var)\s+(\w+)/g;
    const regexList = /export\s+\{([^}]+)\}/g;
    const regexDefault = /export\s+default/g;

    let m;
    while ((m = regexFn.exec(content)) !== null) EXPORTS[fp].add(m[1]);
    while ((m = regexConst.exec(content)) !== null) EXPORTS[fp].add(m[1]);
    while ((m = regexList.exec(content)) !== null) {
        m[1].split(',').forEach(s => {
            const name = s.trim().split(/\s+as\s+/)[0];
            if (name) EXPORTS[fp].add(name);
        });
    }
    if (regexDefault.test(content)) EXPORTS[fp].add('default');
}

// 2. Parse Imports
for (const fp of JS_FILES) {
    const content = fs.readFileSync(fp, 'utf8');

    // Multiple names in curly braces
    const regexImport = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    // Default import
    const regexDefaultImport = /import\s+([^{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g;

    let m;
    while ((m = regexImport.exec(content)) !== null) {
        const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(n => n);
        const src = m[2];
        IMPORTS.push({ file: fp, source: src, names, isDefault: false });
    }
    while ((m = regexDefaultImport.exec(content)) !== null) {
        const src = m[2];
        IMPORTS.push({ file: fp, source: src, names: ['default'], isDefault: true });
    }
}

// 3. Verify
let errors = 0;
for (const imp of IMPORTS) {
    if (!imp.source.startsWith('.')) continue; // Skip external packages

    const dir = path.dirname(imp.file);
    let targetPath = path.resolve(dir, imp.source);

    if (!fs.existsSync(targetPath)) {
        if (fs.existsSync(targetPath + '.js')) {
            targetPath += '.js';
        } else if (fs.existsSync(targetPath + '.mjs')) {
            targetPath += '.mjs';
        } else {
            console.error(`❌ Broken Import: '${imp.source}' in ${path.relative(ROOT, imp.file)} (File not found)`);
            errors++;
            continue;
        }
    }

    const targetExports = EXPORTS[targetPath];
    if (!targetExports) continue;

    for (const name of imp.names) {
        if (!targetExports.has(name)) {
            console.error(`❌ Missing Export: '${name}' in ${path.relative(ROOT, targetPath)} (Imported by ${path.relative(ROOT, imp.file)})`);
            errors++;
        }
    }
}

if (errors === 0) {
    console.log("✅ Audit Passed: No broken imports or exports detected.");
} else {
    console.log(`\nFound ${errors} issues.`);
}

#!/usr/bin/env node
/**
 * Figma Tokens (DTCG) → CSS custom properties (--rr-*).
 * Источник: bibli/tokens/source (копия из bibli/tockens).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_PRIMARY = path.join(ROOT, 'tokens', 'source');
const SOURCE_FALLBACK = path.join(ROOT, 'tockens');
const OUT_DIR = path.join(ROOT, 'shared', 'tokens', 'generated');
const FLAT_JSON = path.join(ROOT, 'shared', 'tokens', 'tokens.flat.json');

const TOKEN_SETS = [
  {
    file: 'Light-mode.tokens3.1 Primitivies.json',
    out: 'primitives-light.css',
    selector: ':root[data-color-mode="light"], :root:not([data-color-mode])',
    group: 'primitives',
  },
  {
    file: 'Dark-mode.tokens3.1 Primitivies.json',
    out: 'primitives-dark.css',
    selector: ':root[data-color-mode="dark"]',
    group: 'primitives',
  },
  {
    file: 'Light-mode.tokens-semantic.json',
    out: 'semantic-light.css',
    selector: ':root[data-color-mode="light"], :root:not([data-color-mode])',
    group: 'semantic',
  },
  {
    file: 'Dark-mode.tokens-semantic.json',
    out: 'semantic-dark.css',
    selector: ':root[data-color-mode="dark"]',
    group: 'semantic',
  },
  {
    file: 'Light-mode.tokens.json',
    out: 'components-light.css',
    selector: ':root[data-color-mode="light"], :root:not([data-color-mode])',
    group: 'components',
  },
  {
    file: 'Dark-mode.tokens.json',
    out: 'components-dark.css',
    selector: ':root[data-color-mode="dark"]',
    group: 'components',
  },
  {
    file: 'Desktop.tokens.json',
    out: 'typography-desktop.css',
    selector: ':root, :root[data-rr-viewport="desktop"]',
    group: 'typography',
  },
  {
    file: 'Mobile.tokens.json',
    out: 'typography-mobile.css',
    selector: ':root[data-rr-viewport="mobile"]',
    group: 'typography',
  },
  {
    file: 'Desktop.tokens1.1 Dimention.json',
    out: 'dimensions-desktop.css',
    selector: ':root, :root[data-rr-viewport="desktop"]',
    group: 'dimensions',
  },
  {
    file: 'Mobile.tokens1.1 Dimention.json',
    out: 'dimensions-mobile.css',
    selector: ':root[data-rr-viewport="mobile"]',
    group: 'dimensions',
  },
  {
    file: '75%.tokens.json',
    out: 'density-75.css',
    selector: ':root[data-rr-density="75"]',
    group: 'density',
  },
  {
    file: '100%.tokens.json',
    out: 'density-100.css',
    selector: ':root, :root[data-rr-density="100"], :root:not([data-rr-density])',
    group: 'density',
  },
  {
    file: '116.6%.tokens.json',
    out: 'density-116.css',
    selector: ':root[data-rr-density="116"]',
    group: 'density',
  },
  {
    file: '133,3%.tokens.json',
    out: 'density-133.css',
    selector: ':root[data-rr-density="133"]',
    group: 'density',
  },
];

function resolveSourceDir() {
  if (fs.existsSync(SOURCE_PRIMARY) && fs.readdirSync(SOURCE_PRIMARY).some((f) => f.endsWith('.json'))) {
    return SOURCE_PRIMARY;
  }
  if (fs.existsSync(SOURCE_FALLBACK)) {
    return SOURCE_FALLBACK;
  }
  throw new Error('No token JSON found in tokens/source or tockens/');
}

function segmentToKebab(segment) {
  return String(segment)
    .replace(/,/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pathToCssVar(segments, prefix = 'rr') {
  const body = segments.map(segmentToKebab).filter(Boolean).join('-');
  return `--${prefix}-${body}`;
}

function collectTokenPaths(obj, segments, paths) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(obj, '$type') && Object.prototype.hasOwnProperty.call(obj, '$value')) {
    paths.add(segments.join('.'));
    return;
  }

  for (const [key, child] of Object.entries(obj)) {
    if (key.startsWith('$')) {
      continue;
    }
    collectTokenPaths(child, [...segments, key], paths);
  }
}

function resolveAliasToCssVar(value, tokenPaths) {
  const match = String(value).match(/^\{([^}]+)\}$/);
  if (!match) {
    return null;
  }

  const segments = match[1].split('.');
  const path = segments.join('.');
  if (tokenPaths.has(path)) {
    return `var(${pathToCssVar(segments)})`;
  }

  const defaultPath = [...segments, 'Default'].join('.');
  if (tokenPaths.has(defaultPath)) {
    return `var(${pathToCssVar([...segments, 'Default'])})`;
  }

  return null;
}

function resolveTokenValue(node, tokenPaths) {
  const { $type, $value } = node;
  if ($value === undefined || $value === null) {
    return null;
  }

  if ($type === 'color') {
    if (typeof $value === 'string') {
      const alias = resolveAliasToCssVar($value, tokenPaths);
      return alias ?? null;
    }
    if ($value.hex) {
      const a = $value.alpha ?? 1;
      if (a < 1 && $value.components) {
        const [r, g, b] = $value.components;
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
      return $value.hex;
    }
    if (Array.isArray($value.components)) {
      const [r, g, b] = $value.components;
      const a = $value.alpha ?? 1;
      if (a < 1) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
  }

  if ($type === 'number') {
    return `${$value}px`;
  }

  if ($type === 'string') {
    const s = String($value);
    // Неразрешённые alias из Figma — пропускаем
    if (/^\{[A-Za-z0-9./]+\}$/.test(s)) {
      return null;
    }
    // Figma FONT_STYLE → CSS numeric font-weight
    const fontWeightMap = {
      thin: '100',
      extralight: '200',
      'extra-light': '200',
      light: '300',
      regular: '400',
      normal: '400',
      medium: '500',
      semibold: '600',
      'semi-bold': '600',
      bold: '700',
      extrabold: '800',
      'extra-bold': '800',
      black: '900',
    };
    const weightKey = s.replace(/\s+/g, '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(fontWeightMap, weightKey)) {
      return fontWeightMap[weightKey];
    }
    if (s.includes(' ') || s.includes(',')) {
      return `"${s}"`;
    }
    return s;
  }

  if ($type === 'boolean') {
    return $value ? '1' : '0';
  }

  return String($value);
}

function walkTokens(obj, segments, out, tokenPaths) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(obj, '$type') && Object.prototype.hasOwnProperty.call(obj, '$value')) {
    const cssValue = resolveTokenValue(obj, tokenPaths);
    if (cssValue !== null) {
      out.push({
        name: pathToCssVar(segments),
        value: cssValue,
        path: segments.join('.'),
        type: obj.$type,
      });
    }
    return;
  }

  for (const [key, child] of Object.entries(obj)) {
    if (key.startsWith('$')) {
      continue;
    }
    walkTokens(child, [...segments, key], out, tokenPaths);
  }
}

function buildCssFile({ selector, tokens, sourceFile }) {
  const header = `/* Russ Redesign tokens — auto-generated from ${sourceFile} */\n`;
  const lines = tokens.map((t) => `  ${t.name}: ${t.value};`);
  return `${header}${selector} {\n${lines.join('\n')}\n}\n`;
}

function syncSourceFromTockens() {
  if (!fs.existsSync(SOURCE_FALLBACK)) {
    return;
  }
  fs.mkdirSync(SOURCE_PRIMARY, { recursive: true });
  for (const name of fs.readdirSync(SOURCE_FALLBACK)) {
    if (!name.endsWith('.json')) {
      continue;
    }
    const src = path.join(SOURCE_FALLBACK, name);
    const dest = path.join(SOURCE_PRIMARY, name);
    fs.copyFileSync(src, dest);
  }
}

function main() {
  syncSourceFromTockens();
  const sourceDir = resolveSourceDir();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const flat = {};
  const indexImports = [];

  for (const set of TOKEN_SETS) {
    const filePath = path.join(sourceDir, set.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`skip (missing): ${set.file}`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const tokenPaths = new Set();
    collectTokenPaths(raw, [], tokenPaths);
    const tokens = [];
    walkTokens(raw, [], tokens, tokenPaths);

    const css = buildCssFile({
      selector: set.selector,
      tokens,
      sourceFile: set.file,
    });

    const outPath = path.join(OUT_DIR, set.out);
    fs.writeFileSync(outPath, css, 'utf8');
    indexImports.push(set.out);

    for (const t of tokens) {
      flat[t.name] = {
        value: t.value,
        path: t.path,
        type: t.type,
        group: set.group,
        source: set.file,
      };
    }

    console.log(`✓ ${set.out} (${tokens.length} vars)`);
  }

  const indexCss = `/* Russ Redesign — import all token layers */\n${indexImports
    .map((f) => `@import './${f}';`)
    .join('\n')}\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.css'), indexCss, 'utf8');

  fs.writeFileSync(
    FLAT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        prefix: 'rr',
        count: Object.keys(flat).length,
        tokens: flat,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\nDone: ${indexImports.length} CSS files, ${Object.keys(flat).length} tokens → ${OUT_DIR}`);
}

main();

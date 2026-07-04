const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const sass = require('sass');

const projectRoot = path.resolve(__dirname, '..');
const stylesDir = path.join(projectRoot, 'src/styles');
const generatedDir = path.join(stylesDir, '.generated');
const globalCssPath = path.join(projectRoot, 'global.css');

const TAILWIND_PREAMBLE = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

function isScssEntry(fileName) {
  return fileName.endsWith('.scss') && !fileName.startsWith('_');
}

function findScssEntries(dir) {
  const entries = [];

  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (dirent.name === '.generated') {
      continue;
    }

    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      entries.push(...findScssEntries(fullPath));
      continue;
    }

    if (isScssEntry(dirent.name)) {
      entries.push(fullPath);
    }
  }

  return entries.sort();
}

function generatedCssPath(scssPath) {
  const relativePath = path.relative(stylesDir, scssPath).replace(/\.scss$/, '.css');
  return path.join(generatedDir, relativePath);
}

function syncStyles() {
  const entryFiles = findScssEntries(stylesDir);

  if (entryFiles.length === 0) {
    throw new Error(`No SCSS entry files found in ${stylesDir}`);
  }

  fs.mkdirSync(generatedDir, { recursive: true });

  const compiledBlocks = [];
  const loadedUrls = [];

  for (const scssPath of entryFiles) {
    const result = sass.compile(scssPath, {
      style: 'expanded',
      sourceMap: false,
      loadPaths: [stylesDir],
    });

    const css = result.css.trim();
    const outputPath = generatedCssPath(scssPath);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${css}\n`);

    compiledBlocks.push(css);
    loadedUrls.push(...result.loadedUrls);
  }

  fs.writeFileSync(globalCssPath, `${TAILWIND_PREAMBLE}\n${compiledBlocks.join('\n\n')}\n`);

  return { entryFiles, loadedUrls };
}

function debounce(fn, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

function watchStyles() {
  const watchedFiles = new Set();

  const rebuild = debounce(() => {
    try {
      const { entryFiles, loadedUrls } = syncStyles();

      for (const url of loadedUrls) {
        if (url.protocol !== 'file:') {
          continue;
        }

        const filePath = fileURLToPath(url);
        if (watchedFiles.has(filePath)) {
          continue;
        }

        watchedFiles.add(filePath);
        fs.watch(filePath, { persistent: true }, () => rebuild());
      }

      console.log(`[scss] Rebuilt global.css from ${entryFiles.length} file(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[scss] Build failed:', message);
    }
  }, 100);

  rebuild();

  fs.watch(stylesDir, { recursive: true, persistent: true }, (_event, filename) => {
    if (!filename?.endsWith('.scss')) {
      return;
    }
    rebuild();
  });

  console.log(`[scss] Watching ${path.relative(projectRoot, stylesDir)}/**/*.scss`);
}

const isWatch = process.argv.includes('--watch');

if (isWatch) {
  watchStyles();
} else {
  syncStyles();
}

const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const expoArgs = ['expo', 'start', ...process.argv.slice(2)];

const children = [
  spawn(process.execPath, [path.join(__dirname, 'sync-styles.js'), '--watch'], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  spawn('npx', expoArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children) {
    child.kill('SIGTERM');
  }

  process.exit(code);
}

for (const child of children) {
  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }
    shutdown(code ?? 0);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

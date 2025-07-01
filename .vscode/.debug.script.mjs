import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const pkg = createRequire(import.meta.url)('../package.json')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// write .debug.env
const envContent = Object.entries(pkg.debug.env).map(([key, val]) => `${key}=${val}`)
fs.writeFileSync(path.join(__dirname, '.debug.env'), envContent.join('\n'))

// bootstrap
try {
  const cmd = process.platform === 'win32' ? 'cmd' : 'npm'; // changed cmd for windows fallback
  const args = process.platform === 'win32' ? ['/c', 'npm.cmd', 'run', 'dev'] : ['run', 'dev'];
  const procEnv = {
    VSCODE_DEBUG: 'true',
    PATH: process.env.PATH, // Trims environment down to avoid conflicts
  };

  console.log('Command:', cmd);
  console.log('Arguments:', args);
  console.log('Simplified Environment:', procEnv);

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    env: procEnv,
    cwd: __dirname,
  });

  child.on('error', (err) => {
    console.error('Error spawning process, check cmd/args/env:', err);
  });

  child.on('exit', (code, signal) => {
    console.log(`Process exited with code: ${code}, signal: ${signal}`);
  });
} catch (e) {
  console.error('Unhandled error:', e);
}

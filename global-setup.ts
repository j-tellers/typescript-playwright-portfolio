import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { initializeMealieAdmin } from './src/fixtures/auth.fixture';
import globalTeardown from './global-teardown';

const execFileAsync = promisify(execFile);

export default async function globalSetup(): Promise<void> {
  await globalTeardown();
  const { stdout, stderr } = await execFileAsync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-File',
    join(__dirname, 'environment', 'scripts', 'start-and-wait.ps1'),
  ], { cwd: __dirname, windowsHide: true });
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
  await initializeMealieAdmin();
}

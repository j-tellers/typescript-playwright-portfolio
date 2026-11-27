import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { mealieBaseUrl, mealieComposeProject } from './src/config/config';

const execFileAsync = promisify(execFile);

export default async function globalTeardown(): Promise<void> {
  const port = new URL(mealieBaseUrl).port || '80';
  const { stdout, stderr } = await execFileAsync('docker', [
    'compose', '-p', mealieComposeProject, '-f', join(__dirname, 'environment', 'docker-compose.yml'),
    'down', '-v',
  ], {
    cwd: __dirname,
    windowsHide: true,
    env: { ...process.env, MEALIE_BASE_URL: mealieBaseUrl, MEALIE_HOST_PORT: port },
  });
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
}

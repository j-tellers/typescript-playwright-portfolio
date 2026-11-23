import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { test as base, expect } from '@playwright/test';
import { mealieBaseUrl } from '../config/config';

const projectRoot = join(__dirname, '..', '..');
const composeFile = join(projectRoot, 'environment', 'docker-compose.yml');
const scriptsDirectory = join(projectRoot, 'environment', 'scripts');

type Command = (executable: string, args: string[]) => Promise<string>;

const runEnvironmentScript = (command: Command, script: string): Promise<string> =>
  command('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-File', join(scriptsDirectory, script),
  ]);

const runCommand: Command = (executable, args) =>
  new Promise((resolve, reject) => {
    const port = new URL(mealieBaseUrl).port || '80';
    const env = { ...process.env, MEALIE_BASE_URL: mealieBaseUrl, MEALIE_HOST_PORT: port };
    execFile(executable, args, { cwd: projectRoot, windowsHide: true, env }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${executable} failed: ${error.message}`));
        return;
      }
      if (stdout.trim()) {
        console.log(stdout.trim());
      }
      if (stderr.trim()) {
        console.error(stderr.trim());
      }
      resolve(stdout);
    });
  });

export async function withMealieEnvironment(
  command: Command,
  use: (url: string) => Promise<void>,
): Promise<void> {
  const runningContainers = await command('docker', [
    'compose', '-f', composeFile, 'ps', '--status', 'running', '--quiet', 'mealie',
  ]);
  const startedByRun = runningContainers.trim().length === 0;
  let failure: unknown;
  let failed = false;

  try {
    await runEnvironmentScript(command, 'start-and-wait.ps1');
    await use(mealieBaseUrl);
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    if (startedByRun) {
      try {
        await runEnvironmentScript(command, 'stop.ps1');
      } catch (error) {
        if (failed) {
          throw new AggregateError([failure, error], 'Mealie setup or test and cleanup both failed.');
        }
        throw error;
      }
    }
  }

  if (failed) {
    throw failure;
  }
}

type EnvironmentFixtures = {
  mealieBaseUrl: string;
};

export const test = base.extend<{}, EnvironmentFixtures>({
  mealieBaseUrl: [async ({}, use, workerInfo) => {
    if (workerInfo.config.workers !== 1) {
      throw new Error('The Mealie environment fixture requires one worker. Run with --workers=1.');
    }
    await withMealieEnvironment(runCommand, use);
  }, { scope: 'worker', timeout: 600_000 }],
});

export { expect };

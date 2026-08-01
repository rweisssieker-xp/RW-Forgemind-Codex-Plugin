import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { resolveWorkspace } from './paths.mjs';

export async function inspectProject(workspace) {
  const root = await resolveWorkspace(workspace);
  const entries = await readdir(root, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  const stacks = [];
  const commands = [];
  let packageManager = null;

  if (names.has('package.json')) {
    stacks.push('node');
    packageManager = names.has('pnpm-lock.yaml') ? 'pnpm' : names.has('yarn.lock') ? 'yarn' : 'npm';
    try {
      const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
      for (const category of ['test', 'build', 'lint']) {
        if (packageJson.scripts?.[category]) {
          commands.push({
            command: `${packageManager} ${category}`,
            category,
            confidence: 'detected',
            source: `package.json#scripts.${category}`,
          });
        }
      }
    } catch {
      // Malformed project metadata is reported by callers; inspection remains best-effort.
    }
  }

  const hasDotnet = entries.some((entry) => entry.isFile() && /\.(?:sln|csproj|fsproj)$/i.test(entry.name));
  if (hasDotnet) {
    stacks.push('dotnet');
    commands.push({ command: 'dotnet test', category: 'test', confidence: 'inferred', source: '*.csproj' });
  }

  if (names.has('pyproject.toml') || names.has('requirements.txt')) {
    stacks.push('python');
    commands.push({
      command: 'python -m pytest',
      category: 'test',
      confidence: 'inferred',
      source: names.has('pyproject.toml') ? 'pyproject.toml' : 'requirements.txt',
    });
  }

  stacks.sort();
  commands.sort((left, right) => left.command.localeCompare(right.command));
  return {
    schemaVersion: 1,
    root,
    packageManager,
    stacks,
    commands,
  };
}

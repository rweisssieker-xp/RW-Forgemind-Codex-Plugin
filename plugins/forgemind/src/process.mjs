import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';

export async function runProcess(command, args = [], options = {}) {
  const startedAt = new Date().toISOString();
  const maxOutputBytes = options.maxOutputBytes ?? 256 * 1024;
  const invocation = await resolveInvocation(command, args, options.env ?? process.env);
  if (invocation.error) {
    return result(127, [], [Buffer.from(invocation.error)], false, startedAt);
  }

  return new Promise((resolve) => {
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let truncated = false;
    let child;
    try {
      child = spawn(invocation.command, invocation.args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      resolve(result(127, stdout, [Buffer.from(error.message)], truncated, startedAt));
      return;
    }

    child.stdout.on('data', (chunk) => {
      const remaining = Math.max(0, maxOutputBytes - stdoutBytes);
      if (chunk.length > remaining) truncated = true;
      if (remaining) stdout.push(chunk.subarray(0, remaining));
      stdoutBytes += Math.min(chunk.length, remaining);
    });
    child.stderr.on('data', (chunk) => {
      const remaining = Math.max(0, maxOutputBytes - stderrBytes);
      if (chunk.length > remaining) truncated = true;
      if (remaining) stderr.push(chunk.subarray(0, remaining));
      stderrBytes += Math.min(chunk.length, remaining);
    });
    child.on('error', (error) => {
      resolve(result(127, stdout, [...stderr, Buffer.from(error.message)], truncated, startedAt));
    });
    child.on('close', (code) => {
      resolve(result(code ?? 1, stdout, stderr, truncated, startedAt));
    });
  });
}

async function resolveInvocation(command, args, env) {
  if (process.platform === 'win32' && /\.(?:bat|cmd)$/i.test(command)) {
    if ([command, ...args].some((value) => /[&|<>()^%!"\r\n]/.test(String(value)))) {
      return { error: 'Unsafe Windows batch invocation: command and arguments must not contain shell metacharacters.' };
    }
    return {
      command: env.ComSpec ?? env.COMSPEC ?? 'cmd.exe',
      args: ['/d', '/s', '/c', windowsBatchInvocation(command, args)],
    };
  }
  if (process.platform !== 'win32' || !['npm', 'pnpm', 'yarn'].includes(command)) {
    return { command, args };
  }
  const relativeCandidates = {
    npm: ['node_modules/npm/bin/npm-cli.js'],
    pnpm: ['node_modules/pnpm/bin/pnpm.cjs', 'node_modules/corepack/dist/pnpm.js'],
    yarn: ['node_modules/yarn/bin/yarn.js', 'node_modules/corepack/dist/yarn.js'],
  }[command];
  const candidates = [];
  if (env.npm_execpath && path.basename(env.npm_execpath).toLowerCase().includes(command)) {
    candidates.push(env.npm_execpath);
  }
  for (const directory of (env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    for (const relative of relativeCandidates) candidates.push(path.join(directory, relative));
  }
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return { command: process.execPath, args: [candidate, ...args] };
    } catch {
      // Continue to the next known package-manager installation layout.
    }
  }
  return { command: `${command}.cmd`, args };
}

function windowsBatchInvocation(command, args) {
  return `call ${[command, ...args].map(String).join(' ')}`;
}

function result(exitCode, stdout, stderr, truncated, startedAt) {
  return {
    exitCode,
    stdout: Buffer.concat(stdout).toString('utf8'),
    stderr: Buffer.concat(stderr).toString('utf8'),
    truncated,
    shell: false,
    startedAt,
    endedAt: new Date().toISOString(),
  };
}

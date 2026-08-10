import assert from 'node:assert/strict';
import test from 'node:test';

import { runCli } from '../src/cli.mjs';

function outputBuffer() {
  let value = '';
  return {
    stream: { write(chunk) { value += String(chunk); } },
    text() { return value; },
  };
}

test('help returns success and lists the stable primary commands', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();

  const result = await runCli(['help'], { stdout: stdout.stream, stderr: stderr.stream });

  assert.equal(result.exitCode, 0);
  assert.match(stdout.text(), /ForgeMind/);
  for (const command of ['doctor', 'validate', 'init', 'leap', 'verify', 'evidence', 'package']) {
    assert.match(stdout.text(), new RegExp(`\\b${command}\\b`));
  }
  assert.equal(stderr.text(), '');
});

test('an unknown command is invalid input with exit code 2', async () => {
  const stdout = outputBuffer();
  const stderr = outputBuffer();

  const result = await runCli(['not-a-command'], { stdout: stdout.stream, stderr: stderr.stream });

  assert.equal(result.exitCode, 2);
  assert.equal(stdout.text(), '');
  assert.match(stderr.text(), /Unknown command: not-a-command/);
});

test('Compass has a portable CLI entrypoint and routes an explicit goal', async () => {
  const stdout = outputBuffer();
  const result = await runCli(['compass', '--workspace', process.cwd(), '--goal', 'validate a market opportunity and pricing', '--artifacts', 'none', '--json'], { stdout: stdout.stream, stderr: outputBuffer().stream });

  assert.equal(result.exitCode, 0);
  assert.equal(result.data.recommendedJourney, 'venture');
  assert.equal(result.data.handoff, '$forgemind-venture');
  assert.equal(result.data.goalSource, 'user');
});

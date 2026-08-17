import { redactText } from './redact.mjs';

const UNSAFE_COMMAND_PATTERN = /\b(?:migrate|deploy|publish|seed|reset|delete|destroy|drop|truncate|production)\b/i;
const WINDOWS_BATCH_COMMAND_PATTERN = /\.(?:bat|cmd)$/i;
const WINDOWS_COMMAND_CHAIN_PATTERN = /[&|<>^%!\r\n]/;

export async function executeCommandAdapter({ candidate, workspace, runProcess }) {
  if (!isSafeXrayCommandCandidate(candidate)) {
    return {
      adapter: 'command',
      status: 'skipped',
      surfaceIds: commandSurfaceIds(candidate),
      evidence: commandEvidence(candidate),
      stdout: '',
      stderr: '',
      command: formatCommandCandidate(candidate),
      gap: unsafeCommandGap(candidate),
    };
  }

  let result;
  try {
    result = await runProcess(candidate.command, candidate.args ?? [], { cwd: workspace });
  } catch (error) {
    result = { exitCode: 127, stdout: '', stderr: error?.message ?? String(error) };
  }
  const prerequisite = classifyPrerequisiteFailure(result);
  return {
    adapter: 'command',
    status: result.exitCode === 0 ? 'passed' : prerequisite ? 'blocked' : 'failed',
    surfaceIds: commandSurfaceIds(candidate),
    evidence: commandEvidence(candidate),
    stdout: redactText(result.stdout ?? '').text,
    stderr: redactText(result.stderr ?? '').text,
    command: formatCommandCandidate(candidate),
    exitCode: result.exitCode,
    ...(prerequisite ? { gap: prerequisiteGap(candidate, prerequisite) } : {}),
  };
}

export function formatCommandCandidate(candidate = {}) {
  return [candidate.command, ...(candidate.args ?? [])]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

export function isSafeXrayCommandCandidate(candidate = {}) {
  return !candidate.unsafe
    && !(candidate.safetyReasons?.length)
    && !UNSAFE_COMMAND_PATTERN.test(formatCommandCandidate(candidate))
    && (!WINDOWS_BATCH_COMMAND_PATTERN.test(String(candidate.command ?? ''))
      || ![candidate.command, ...(candidate.args ?? [])].some((value) => WINDOWS_COMMAND_CHAIN_PATTERN.test(String(value))));
}

export function classifyPrerequisiteFailure(result) {
  const output = `${result?.stderr ?? ''}\n${result?.stdout ?? ''}`;
  if (result?.exitCode === 127 || /\b(?:ENOENT|command not found|not recognized as an internal or external command|cannot find (?:the )?(?:file|command|executable))\b/i.test(output)) {
    return 'tool';
  }
  const localServiceUnavailable = /(?:\b(?:localhost|127\.0\.0\.1|\[?::1\]?|local (?:service|server|database))\b[^\n]*(?:unavailable|not running|failed to connect|ECONNREFUSED|connection refused)|(?:unavailable|not running|failed to connect|ECONNREFUSED|connection refused)[^\n]*\b(?:localhost|127\.0\.0\.1|\[?::1\]?|local (?:service|server|database))\b)/i.test(output);
  if (/\b(?:no (?:running )?(?:emulator|simulator|device)|(?:credential|api[_-]?key|token).*(?:missing|not configured|unavailable|required))\b/i.test(output)
    || localServiceUnavailable) {
    return 'prerequisite';
  }
  return null;
}

export function prerequisiteGap(candidate, kind) {
  return {
    code: kind === 'tool' ? 'FM_XRAY_TOOL_UNAVAILABLE' : 'FM_XRAY_PREREQUISITE_UNAVAILABLE',
    ...(candidate?.id ? { checkId: candidate.id } : {}),
    message: kind === 'tool'
      ? 'The detected check could not start because its executable is unavailable.'
      : 'The detected check could not assess application behavior because a local prerequisite is unavailable.',
  };
}

function commandSurfaceIds(candidate = {}) {
  return [...(candidate.surfaceIds ?? candidate.surfaceHints ?? [])];
}

function commandEvidence(candidate = {}) {
  return candidate.id ? [candidate.id] : [];
}

function unsafeCommandGap(candidate) {
  return {
    code: 'FM_XRAY_UNSAFE_CHECK_SKIPPED',
    ...(candidate?.id ? { checkId: candidate.id } : {}),
    message: 'This check was not executed because its command may be destructive or irreversible.',
  };
}

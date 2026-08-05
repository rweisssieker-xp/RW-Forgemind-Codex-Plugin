import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export function canonicalJson(value) {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

export async function writeJsonAtomic(target, value) {
  return writeTextAtomic(target, canonicalJson(value));
}

export async function writeTextAtomic(target, content, options = {}) {
  const resolved = path.resolve(target);
  const directory = path.dirname(resolved);
  const temporary = path.join(directory, `.${path.basename(resolved)}.${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    if (options.ifAbsent) {
      try {
        await writeFile(resolved, content, { encoding: 'utf8', flag: 'wx' });
        return resolved;
      } finally {
        await rm(temporary, { force: true });
      }
    }
    await rename(temporary, resolved);
  } finally {
    await rm(temporary, { force: true });
  }
  return resolved;
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, sortValue(value[key])]),
    );
  }
  return value;
}

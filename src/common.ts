import { promises } from 'fs';
import { resolve } from 'path';
import * as rt from 'runtypes';
import writeFileAtomic from 'write-file-atomic';
import { readJson } from 'fs-extra';

export const progressFileName = '.dirpath.progress.json';

export function getProgressPath(dirPath: string) {
  return normalizePath(dirPath, resolve(dirPath, progressFileName));
}

const commonRt = rt
  .Record({
    directoryPath: rt.String,
    files: rt.Array(rt.String).asReadonly(),
  })
  .asReadonly();

const finishedProgressRt = rt.Intersect(
  commonRt,
  rt.Record({ progress: rt.Literal('finished') }).asReadonly(),
);

const pendingProgressRt = rt.Intersect(
  commonRt,
  rt.Record({ progress: rt.Literal('pending') }).asReadonly(),
);

const failedProgressRt = rt.Intersect(
  commonRt,
  rt.Record({ progress: rt.Literal('failed'), error: rt.Unknown }).asReadonly(),
);

const progressRuntype = rt.Union(
  finishedProgressRt,
  pendingProgressRt,
  failedProgressRt,
);

export type Progress = rt.Static<typeof progressRuntype>;

export type ProgressState = Progress['progress'];

export async function loadProgress(pth: string): Promise<Progress | undefined> {
  const data = await readJson(pth, { throws: false });
  const validation = progressRuntype.validate(data);
  return validation.success ? validation.value : undefined;
}

export async function writeProgress(pth: string, progress: Progress) {
  const body = JSON.stringify(progress, null, 2);
  await writeFileAtomic(pth, body);
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizePath(dirPath: string, filePath: string) {
  if (filePath.startsWith(dirPath)) {
    return filePath;
  }

  const fullPath = resolve(dirPath, filePath);

  if (fullPath.startsWith(dirPath)) {
    return fullPath;
  }

  throw new Error('nop. wrong fial');
}

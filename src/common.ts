import * as rt from 'runtypes';
import { promises } from 'fs';
import writeFileAtomic from 'write-file-atomic';
import { resolve } from 'path';

export const progressFileName = '.dirpath.progress.json';

export function getProgressPath(dirPath: string) {
  return resolve(dirPath, progressFileName);
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
  try {
    const validation = progressRuntype.validate(
      JSON.parse(await promises.readFile(pth, 'utf-8')),
    );
    return validation.success ? validation.value : undefined;
  } catch (err) {
    return undefined;
  }
}

export async function writeProgress(pth: string, progress: Progress) {
  const body = JSON.stringify(progress, null, 2);
  await writeFileAtomic(pth, body);
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

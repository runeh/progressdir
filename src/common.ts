import * as rt from 'runtypes';
import { resolve } from 'path';
import { watch, FSWatcher, promises } from 'fs';

export const progressFileName = '.dirpath.progress.json';

export const progressRuntype = rt
  .Record({
    directoryPath: rt.String,
    status: rt.Union(rt.Literal('pending'), rt.Literal('finished')),
    finishedFiles: rt.Array(rt.String).asReadonly(),
  })
  .asReadonly();

export type Progress = rt.Static<typeof progressRuntype>;

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

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

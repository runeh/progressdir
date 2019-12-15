import { resolve } from 'path';
import { watch, FSWatcher } from 'fs';
import { loadProgress, progressFileName, Progress, sleep } from './common';

export interface ProgressReaderOpts {
  longestPermittedWaitMs?: number;
  sleepDurationMs?: number;
}

const defaultOpts: ProgressReaderOpts = {
  longestPermittedWaitMs: 60000,
  sleepDurationMs: 50,
};

export class ProgressReader {
  opts: ProgressReaderOpts;
  dirPath: string;
  progressPath: string;
  progressState?: Progress;
  yieldedPaths: Set<string>;
  watcher: FSWatcher;
  lastFileChangeTs: number;

  constructor(dirPath: string, opts?: ProgressReaderOpts) {
    this.opts = { ...defaultOpts, ...(opts ?? {}) };
    this.dirPath = dirPath;
    this.yieldedPaths = new Set();
    this.progressPath = resolve(dirPath, progressFileName);
    this.watcher = watch(this.progressPath, () => this.onProgressUpdate());
    this.onProgressUpdate();
  }

  async onProgressUpdate() {
    this.lastFileChangeTs = Date.now();
    this.progressState = await loadProgress(this.progressPath);
  }

  private finalize() {
    this.watcher.close();
  }

  private getAndMark(): string | undefined {
    const nonYielded = (this.progressState?.finishedFiles ?? []).filter(
      pth => !this.yieldedPaths.has(pth),
    );

    if (nonYielded.length === 0) {
      return undefined;
    } else {
      const ret = nonYielded[0];
      this.yieldedPaths.add(ret);
      return ret;
    }
  }

  private hasTimedOut() {
    return (
      Date.now() - this.lastFileChangeTs > this.opts.longestPermittedWaitMs
    );
  }

  async next() {
    while (true) {
      const path = this.getAndMark();
      if (path !== undefined) {
        return { value: path, done: false };
      } else if (this.progressState?.status === 'finished') {
        this.finalize();
        return { value: undefined, done: true };
      } else if (this.hasTimedOut()) {
        this.finalize();
        throw new Error('nopos');
      } else {
        await sleep(this.opts.sleepDurationMs);
      }
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

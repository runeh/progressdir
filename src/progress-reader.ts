import { FSWatcher, watch } from 'fs';
import { getProgressPath, loadProgress, Progress, sleep } from './common';
import { remove } from 'fs-extra';

export interface ProgressReaderOpts {
  longestPermittedWaitMs?: number;
  sleepDurationMs?: number;
}

const defaultOpts: Required<ProgressReaderOpts> = {
  longestPermittedWaitMs: 60000,
  sleepDurationMs: 50,
};

export class ProgressReader {
  opts: Required<ProgressReaderOpts>;
  dirPath: string;
  progressPath: string;
  progressState?: Progress;
  yieldedPaths: Set<string>;
  watcher: FSWatcher;
  lastFileChangeTimeStamp: number;

  constructor(dirPath: string, opts?: ProgressReaderOpts) {
    this.opts = { ...defaultOpts, ...(opts ?? {}) };
    this.dirPath = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
    this.yieldedPaths = new Set();
    this.progressPath = getProgressPath(this.dirPath);
    this.watcher = watch(this.progressPath, () => this.onProgressUpdate());
    this.lastFileChangeTimeStamp = 0;
    this.onProgressUpdate();
  }

  async onProgressUpdate() {
    this.lastFileChangeTimeStamp = Date.now();
    this.progressState = await loadProgress(this.progressPath);
  }

  private finalize() {
    this.watcher.close();
  }

  private getAndMark(): string | undefined {
    const nonYielded = (this.progressState?.files ?? []).filter(
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
      Date.now() - this.lastFileChangeTimeStamp >
      this.opts.longestPermittedWaitMs
    );
  }

  async next() {
    while (true) {
      const path = this.getAndMark();
      if (path !== undefined) {
        return { value: path, done: false };
      } else if (this.progressState?.progress === 'finished') {
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

  async remove() {
    await remove(this.dirPath);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

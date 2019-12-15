import { resolve } from 'path';
import { watch, FSWatcher } from 'fs';
import { loadProgress, progressFileName, Progress, sleep } from './common';

export interface ProgressConsumerOpts {
  longestPermittedWaitMs?: number;
  sleepDurationMs?: number;
}

const defaultOpts: ProgressConsumerOpts = {
  longestPermittedWaitMs: 60000,
  sleepDurationMs: 50,
};

export class ProgressConsumer {
  progress?: Progress;
  yieldedPaths: Set<string>;
  dirPath: string;
  progressPath: string;
  watcher: FSWatcher;
  opts: ProgressConsumerOpts;
  lastFileChange: number;

  constructor(dirPath: string, opts?: ProgressConsumerOpts) {
    this.opts = { ...defaultOpts, ...(opts ?? {}) };
    this.dirPath = dirPath;
    this.yieldedPaths = new Set();
    this.progressPath = resolve(dirPath, progressFileName);
    this.watcher = watch(this.progressPath);
    this.watcher.on('change', () => this.onProgressUpdate());
    this.onProgressUpdate();
  }

  async onProgressUpdate() {
    this.lastFileChange = Date.now();
    this.progress = await loadProgress(this.progressPath);
  }

  private finalize() {
    this.watcher.close();
  }

  private getAndMark(): string | undefined {
    const nonYielded = (this.progress?.finishedFiles ?? []).filter(
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
    return Date.now() - this.lastFileChange > this.opts.longestPermittedWaitMs;
  }

  async next() {
    while (true) {
      const path = this.getAndMark();
      if (path !== undefined) {
        return { value: path, done: false };
      } else if (this.progress?.status === 'finished') {
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

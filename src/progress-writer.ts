import { getProgressPath, writeProgress } from './common';

export class ProgressWriter {
  dirPath: string;
  progressPath: string;
  paths: string[];

  constructor(dirPath: string) {
    this.dirPath = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
    this.progressPath = getProgressPath(this.dirPath);
    this.paths = [];
  }

  update(pth: string) {
    const relativePath = pth.startsWith(this.dirPath)
      ? pth.slice(this.dirPath.length)
      : pth;

    this.paths.push(relativePath);

    writeProgress(this.progressPath, {
      progress: 'pending',
      directoryPath: this.dirPath,
      files: this.paths,
    });
  }

  finish() {
    writeProgress(this.progressPath, {
      progress: 'finished',
      directoryPath: this.dirPath,
      files: this.paths,
    });
  }
}

import { createWriteStream, promises, writeFileSync } from 'fs';
import { pipeline as callbackPipeline, Readable } from 'stream';
import { directory as tempDirectory } from 'tempy';
import { promisify } from 'util';
import {
  getProgressPath,
  normalizePath,
  Progress,
  writeProgress,
} from './common';
import { remove } from 'fs-extra';

const pipeline = promisify(callbackPipeline);

export class ProgressWriter {
  dirPath: string;
  progressPath: string;
  private paths: string[];

  constructor(dirPath: string = tempDirectory()) {
    this.dirPath = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
    this.progressPath = getProgressPath(this.dirPath);
    this.paths = [];

    const progress: Progress = {
      directoryPath: this.dirPath,
      progress: 'pending',
      files: this.paths,
    };

    writeFileSync(this.progressPath, JSON.stringify(progress));
  }

  private async update(fullPth: string) {
    const relativePath = fullPth.slice(this.dirPath.length + 1);
    this.paths.push(relativePath);
    await writeProgress(this.progressPath, {
      progress: 'pending',
      directoryPath: this.dirPath,
      files: this.paths,
    });
  }

  private async writeBufferToFile(pth: string, data: Buffer | string) {
    await promises.writeFile(pth, data);
  }

  private async writeStreamToFile(pth: string, stream: Readable) {
    const outStream = createWriteStream(pth);
    stream.pipe(outStream);
    await pipeline(stream, outStream);
  }

  async writeFile(
    pth: string,
    data: Buffer | string | Readable | Promise<string | Buffer | Readable>,
  ) {
    const fullPath = normalizePath(this.dirPath, pth);
    const unpacked = await Promise.resolve(data);
    if (Buffer.isBuffer(unpacked) || typeof unpacked === 'string') {
      await this.writeBufferToFile(fullPath, unpacked);
    } else {
      await this.writeStreamToFile(fullPath, unpacked);
    }

    this.update(fullPath);
  }

  async remove() {
    await remove(this.dirPath);
  }

  async finish() {
    await writeProgress(this.progressPath, {
      progress: 'finished',
      directoryPath: this.dirPath,
      files: this.paths,
    });
  }
}

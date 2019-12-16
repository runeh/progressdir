import { ProgressReader } from './src';
import { resolve } from 'path';
import { ProgressWriter } from './src/progress-writer';
import { sleep } from './src/common';

async function readerMain(dirPath: string) {
  const reader = new ProgressReader(dirPath, {
    longestPermittedWaitMs: 40000,
  });
  for await (const x of reader) {
    console.log('woooo', x);
  }
}

async function writerMain(writer: ProgressWriter) {
  console.log(writer.dirPath);
  await writer.writeFile('foo1.txt', 'asdf');
  await sleep(2000);
  await writer.writeFile('foo2.txt', Promise.resolve('asdf'));
  await sleep(2000);
  await writer.writeFile('foo3.txt', Promise.resolve('asdf'));
  await sleep(2000);
  await writer.writeFile('foo4.txt', Promise.resolve('asdf'));
  await sleep(2000);
  await writer.writeFile('foo5.txt', Promise.resolve('asdf'));
  await sleep(2000);
  await writer.finish();
}

async function main() {
  const writer = new ProgressWriter();
  const dirPath = writer.dirPath;
  setTimeout(() => writerMain(writer));
  readerMain(dirPath);
}

main();
// writerMain();
// readerMain();

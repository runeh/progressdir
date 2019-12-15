import { ProgressReader } from './src';
import { resolve } from 'path';

async function readerMain() {
  const progress = new ProgressReader(resolve(__dirname, 'testdir'), {
    longestPermittedWaitMs: 40000,
  });
  for await (const x of progress) {
    console.log('woooo', x);
  }
}

readerMain();

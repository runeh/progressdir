import { ProgressReader } from './src';
import { resolve } from 'path';

async function main() {
  const progress = new ProgressConsumer(resolve(__dirname, 'testdir'), {
    longestPermittedWaitMs: 40000,
  });
  for await (const x of progress) {
    console.log('woooo', x);
  }
}

main();

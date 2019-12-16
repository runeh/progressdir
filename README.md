In main thread

```js
import { ProgressReader } from 'progressdir';
import { writeAllTheFiles } from 'async-worker';
import { JSZip } from 'jszip';

async function streamSomeFiles(res) {
  const destinationDir = generateOuputData();
  const zip = new JSZip();
  const outStream = zip.createNodeStream();
  outStream.pipe(res);

  const reader = new ProgressReader(destinationDir);

  for await (const path of reader) {
    zip.add(path, path);
  }
}
```

In worker thread

```js
import { ProgressWriter } from 'progressdir';

function generateOuputData() {
  const writer = new ProgressWriter();

  setImmediate(() => {
    for (const pth of filesToDoStuffWith) {
      const output = slowOperation(pth);
      writer.writeFile(pth, output);
    }
  })

  return writer.dirPath;
}
```

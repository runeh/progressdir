In main thread

```js
import { ProgressReader } from 'progressdir';
import { writeAllTheFiles } from 'async-worker';
import { JSZip } from 'jszip';
import tempy from 'tempy';

async function streamSomeFiles(res) {
  const tempDir = tempy.directory();
  const generateOuputData(tempDir);
  const zip = new JSZip();
  const outStream = zip.createNodeStream();
  outStream.pipe(res);

  const reader = new ProgressReader(tempDir)

  for await (const path of reader) {
    zip.add(path, path);
  }
}
```

In worker thread

```js
import { ProgressWriter } from 'progressdir';

function generateOuputData(targetPath, files) {
  const writer = new ProgressWriter(targetPath);
  for (const pth of files) {
    writer.writeFile(createReadStream(pth));
  }
}
```

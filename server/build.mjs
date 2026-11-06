import {copyFile, mkdir} from 'node:fs/promises';
await mkdir('dist', {recursive: true});
for (const file of ['app.js','index.html','style.css','manifest.json']) {
  await copyFile(file, 'dist/' + file);
}

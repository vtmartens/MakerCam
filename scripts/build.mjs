import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const serve = process.argv.includes('--serve');

await mkdir(dist, { recursive: true });

await build({
  entryPoints: [join(root, 'src/main.ts')],
  bundle: true,
  outfile: join(dist, 'app.js'),
  format: 'iife',
  target: ['es2020'],
  sourcemap: true,
  loader: { '.ts': 'ts' },
  logLevel: 'info',
});

const html = await readFile(join(root, 'index.html'), 'utf8');
const builtHtml = html
  .replace('./src/styles.css', './styles.css')
  .replace('./dist/app.js', './app.js')
  .replace('./app.js', './app.js');
await writeFile(join(dist, 'index.html'), builtHtml, 'utf8');
await cp(join(root, 'src/styles.css'), join(dist, 'styles.css'));

await writeFile(
  join(dist, 'README.txt'),
  [
    'MakerCam Modern',
    '',
    'Open index.html in a modern browser. No server or internet connection is required.',
    'All drawings stay in your browser; files are uploaded nowhere.',
    '',
    'For development: npm run dev  (builds and serves on http://localhost:5173)',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`Built ${join(dist, 'app.js')}`);

if (serve) {
  const port = Number(process.env.PORT || 5173);
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8',
  };
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = normalize(join(dist, urlPath === '/' ? 'index.html' : urlPath));
      if (!filePath.startsWith(dist)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  server.listen(port, () => {
    console.log(`Serving ${dist} at http://localhost:${port}/`);
  });
}

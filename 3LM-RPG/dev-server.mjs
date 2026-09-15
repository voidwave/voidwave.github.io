// خادم تطوير صغير بدون أي تبعيات — run with:  node dev-server.mjs
// Tiny zero-dependency static dev server for the game.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
};

const server = createServer(async (req, res) => {
    try {
        let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        if (urlPath.endsWith('/')) urlPath += 'index.html';
        const filePath = normalize(join(ROOT, urlPath));
        if (!filePath.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
            res.writeHead(403).end('Forbidden');
            return;
        }
        const body = await readFile(filePath);
        res.writeHead(200, {
            'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store', // التطوير: لا تخزين مؤقت حتى تظهر التعديلات فورًا
        });
        res.end(body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — غير موجود');
    }
});

const BASE_PORT = Number(process.argv[2] || process.env.PORT || 8080);
let port = BASE_PORT;
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < BASE_PORT + 10) {
        console.log(`المنفذ ${port} مشغول، أحاول ${port + 1}…`);
        server.listen(++port);
    } else {
        console.error(err.message);
        process.exit(1);
    }
});

server.listen(port, () => {
    console.log('');
    console.log('  🕌  رحلة المعرفة — dev server');
    console.log(`  ➜  http://localhost:${port}/`);
    console.log(`  ➜  على الجوال (نفس الشبكة): http://<عنوان-الجهاز>:${port}/`);
    console.log('  أوقف الخادم بـ Ctrl+C');
    console.log('');
});

/**
 * Minimal static file server for local development.
 *
 * The app fetches its XML files, so it has to be served over HTTP; opening
 * index.html straight from the file system does not work in most browsers.
 *
 * Usage:
 *     node tools/serve.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 8123;

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.ttf': 'font/ttf',
    '.woff2': 'font/woff2'
};

http.createServer(function (request, response) {
    const urlPath = decodeURIComponent(request.url.split('?')[0]);
    const filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.stat(filePath, function (statError, stats) {
        if (statError || !stats.isFile()) {
            response.writeHead(404);
            response.end('Not found: ' + urlPath);
            return;
        }

        const headers = {
            'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache', // always pick up the latest files
            'Accept-Ranges': 'bytes'
        };

        // Media players ask for byte ranges; serving them keeps audio smooth.
        const range = request.headers.range;
        const rangeMatch = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
        if (rangeMatch) {
            const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
            const end = rangeMatch[2] ? Number(rangeMatch[2]) : stats.size - 1;
            if (start > end || end >= stats.size) {
                response.writeHead(416, { 'Content-Range': 'bytes */' + stats.size });
                response.end();
                return;
            }
            headers['Content-Length'] = end - start + 1;
            headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stats.size;
            response.writeHead(206, headers);
            if (request.method === 'HEAD') {
                response.end();
                return;
            }
            fs.createReadStream(filePath, { start: start, end: end }).pipe(response);
            return;
        }

        headers['Content-Length'] = stats.size;
        response.writeHead(200, headers);
        if (request.method === 'HEAD') {
            response.end();
            return;
        }
        fs.createReadStream(filePath).pipe(response);
    });
}).listen(port, function () {
    console.log('Serving ' + root + ' on http://localhost:' + port);
});

// Serveur HTTP (node:http, pas d'Express), sur 127.0.0.1 seulement. Port 7457, sinon le suivant libre.
//   GET  /health  → { name, root, origins, version, port, contextDir }
//   POST /locate  → fichier:ligne des templates, composants et règles CSS (lecture seule, 1,5 s max)
//   POST /save    → écrit le contexte, répond par son chemin relatif
// En-tête x-dtc-project (racine attendue) : un autre projet qui a repris ce port après un redémarrage répond
// 409, rien n'est écrit chez lui.
// Pas de CORS ouvert : seule l'extension (Origin chrome-extension://<id>) avec une requête signée est servie,
// et chaque réponse porte la preuve que ce bridge connaît le jeton (security.ts).
import { createServer } from 'node:http';
import { VERSION } from './config.js';
import { AUTH_HEADER, NONCE_HEADER, PORT_FIRST, PORT_LAST, PROJECT_HEADER, PROOF_HEADER, TS_HEADER } from './protocol.js';
import { HttpError, save } from './save.js';
import { Guard } from './security.js';
const BODY_MAX = 12 * 1024 * 1024;
export async function startServer(cfg, opts) {
    let port = 0;
    const guard = new Guard(opts.token, cfg.extensionIds, () => port);
    const server = createServer((req, res) => {
        handle(req, res).catch((e) => {
            const status = e instanceof HttpError ? e.status : 500;
            if (status === 500)
                opts.log?.(`erreur : ${e.stack || e}`);
            send(res, status, { error: e instanceof Error ? e.message : 'error' });
        });
    });
    server.headersTimeout = 10_000;
    server.requestTimeout = 30_000;
    async function handle(req, res) {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        const check = guard.check(req, url.pathname);
        // Pré-vol éventuel : seulement pour l'extension, rien pour les pages
        if (req.method === 'OPTIONS') {
            if (check.ok) {
                res.writeHead(204, {
                    'access-control-allow-origin': String(req.headers.origin || ''),
                    'access-control-allow-methods': 'GET, POST',
                    'access-control-allow-headers': ['content-type', TS_HEADER, NONCE_HEADER, AUTH_HEADER, PROJECT_HEADER].join(', '),
                    'access-control-expose-headers': PROOF_HEADER,
                    'access-control-max-age': '600',
                    vary: 'Origin',
                });
                res.end();
            }
            else
                send(res, check.status, { error: check.error });
            return;
        }
        if (!check.ok) {
            req.resume();
            send(res, check.status, { error: check.error });
            return;
        }
        const signed = { [PROOF_HEADER]: guard.proof(check.nonce) };
        const project = req.headers[PROJECT_HEADER];
        if (typeof project === 'string' && safeDecode(project) !== cfg.root) {
            req.resume();
            send(res, 409, { error: 'project' }, signed);
            return;
        }
        if (req.method === 'GET' && url.pathname === '/health') {
            const body = { name: cfg.name, root: cfg.root, origins: cfg.origins, version: VERSION, port, contextDir: cfg.contextDir };
            send(res, 200, body, signed);
            return;
        }
        if (req.method === 'POST' && url.pathname === '/save') {
            const body = await readJson(req);
            const out = save(cfg, body);
            opts.log?.(`wrote ${out.path}`);
            send(res, 200, out, signed);
            return;
        }
        if (req.method === 'POST' && url.pathname === '/locate') {
            const body = await readJson(req);
            send(res, 200, await opts.locator.locate(body), signed);
            return;
        }
        send(res, 404, { error: 'not found' });
    }
    const tryListen = (p) => new Promise((resolve, reject) => {
        const onError = (e) => {
            server.off('listening', onListening);
            if (e.code === 'EADDRINUSE')
                resolve(false);
            else
                reject(e);
        };
        const onListening = () => {
            server.off('error', onError);
            resolve(true);
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(p, '127.0.0.1');
    });
    const ports = opts.port ? [opts.port] : range(PORT_FIRST, PORT_LAST);
    for (const p of ports) {
        if (await tryListen(p)) {
            port = p;
            break;
        }
    }
    if (!port)
        throw new Error(opts.port ? `port ${opts.port} in use` : `no free port between ${PORT_FIRST} and ${PORT_LAST}`);
    return {
        server,
        port,
        close: () => new Promise((resolve) => {
            server.close(() => resolve());
            server.closeAllConnections();
        }),
    };
}
function safeDecode(v) {
    try {
        return decodeURIComponent(v);
    }
    catch {
        return '';
    }
}
function range(a, b) {
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}
function send(res, status, body, headers = {}) {
    const json = JSON.stringify(body);
    res.writeHead(status, {
        ...headers,
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(json),
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
    });
    res.end(json);
}
async function readJson(req) {
    const type = String(req.headers['content-type'] || '');
    if (!type.startsWith('application/json'))
        throw new HttpError(415, 'content-type');
    const declared = Number(req.headers['content-length'] || 0);
    if (declared > BODY_MAX) {
        req.resume();
        throw new HttpError(413, 'body too large');
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > BODY_MAX) {
            req.destroy();
            throw new HttpError(413, 'body too large');
        }
        chunks.push(chunk);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        throw new HttpError(400, 'json');
    }
}

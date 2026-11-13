// Sécurité (non négociable) :
//  - écoute sur 127.0.0.1 seulement (server.ts)
//  - jeton aléatoire, gardé dans ~/.config/aimkit/token (0600) : saisi une fois dans l'extension, le
//    même pour tous les projets. Il ne circule jamais : chaque requête est signée (HMAC-SHA256 du jeton sur
//    méthode, chemin, port, date et nonce) et le bridge signe sa réponse sur le nonce. Un autre processus
//    qui écoute sur un port de la plage ne reçoit donc ni le jeton ni de quoi se faire passer pour le bridge :
//    l'extension n'envoie rien tant que la réponse à /health n'est pas signée. Port signé : une signature
//    captée par un imposteur ne vaut pas auprès du vrai bridge ; nonce à usage unique, date à ±60 s.
//  - Origin : chrome-extension://<id de l'extension> seulement (les requêtes partent du service worker).
//    Chrome n'envoie pas Origin sur un GET du service worker (permission d'hôte, Sec-Fetch-Site: none) :
//    un GET sans Origin n'est accepté qu'avec Sec-Fetch-Site: none, valeur qu'une page ne peut pas produire
//    pour une sous-requête. Tout POST doit porter l'Origin de l'extension.
//  - Host : 127.0.0.1:<port> ou localhost:<port> (contre le DNS rebinding)
//  - chemins : jamais fournis par le client pour l'écriture ; en lecture, realpath sous la racine
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { AUTH_HEADER, NONCE_HEADER, TS_HEADER } from './protocol.js';
const TOKEN_RE = /^[\w-]{16,128}$/;
const NONCE_RE = /^[\w-]{16,64}$/;
const SKEW_MS = 60_000;
export function tokenPath() {
    const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    return join(base, 'aimkit', 'token');
}
export function assertToken(token) {
    if (!TOKEN_RE.test(token))
        throw new Error('invalid token: 16 to 128 characters [A-Za-z0-9_-]');
}
// Jeton : AIMKIT_TOKEN, sinon le fichier, sinon un nouveau (renew : toujours un nouveau).
// created : le jeton vient d'être tiré, l'extension ne le connaît pas encore (le lien d'appariement s'affiche).
export function loadToken(renew = false) {
    const env = process.env.AIMKIT_TOKEN;
    if (env && TOKEN_RE.test(env))
        return { token: env, created: false };
    const path = tokenPath();
    if (!renew && existsSync(path)) {
        const saved = readFileSync(path, 'utf8').trim();
        if (TOKEN_RE.test(saved)) {
            restrict(path);
            return { token: saved, created: false };
        }
    }
    const token = randomBytes(24).toString('base64url');
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, `${token}\n`, { mode: 0o600 });
    restrict(path);
    return { token, created: true };
}
// Fichier du jeton lisible par d'autres (copié, restauré d'une sauvegarde) : ramené à 0600.
function restrict(path) {
    if (process.platform === 'win32')
        return;
    try {
        if ((statSync(path).mode & 0o077) !== 0) {
            chmodSync(path, 0o600);
            process.stderr.write(`aimkit: ${path} was readable by other users, permissions reset to 600\n`);
        }
    }
    catch (e) {
        process.stderr.write(`aimkit: permissions of ${path} not checked (${e.message})\n`);
    }
}
// Signature HMAC-SHA256 (base64url) de lignes jointes par \n. Même calcul dans l'extension (Web Crypto).
export function sign(token, parts) {
    return createHmac('sha256', token).update(parts.join('\n')).digest('base64url');
}
export function requestParts(method, path, port, ts, nonce) {
    return ['dtc1', method, path, port, ts, nonce];
}
export function proofParts(port, nonce) {
    return ['dtc1-reply', port, nonce];
}
export class Guard {
    token;
    extensionIds;
    port;
    seen = new Map(); // nonce → expiration
    constructor(token, extensionIds, port) {
        this.token = token;
        this.extensionIds = extensionIds;
        this.port = port;
        assertToken(token);
    }
    // Host, Origin, puis signature. error 'auth' : l'appelant ne connaît pas le jeton (401).
    check(req, path) {
        const port = this.port();
        const host = String(req.headers.host || '');
        if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`)
            return { ok: false, status: 403, error: 'host' };
        const origin = req.headers.origin;
        if (origin === undefined) {
            if (req.method !== 'GET' || req.headers['sec-fetch-site'] !== 'none')
                return { ok: false, status: 403, error: 'origin' };
        }
        else {
            const m = /^chrome-extension:\/\/([a-p]{32})$/.exec(String(origin));
            if (!m || !this.extensionIds.includes(m[1]))
                return { ok: false, status: 403, error: 'origin' };
        }
        if (req.method === 'OPTIONS')
            return { ok: true, nonce: '' };
        const ts = String(req.headers[TS_HEADER] || '');
        const nonce = String(req.headers[NONCE_HEADER] || '');
        const auth = String(req.headers[AUTH_HEADER] || '');
        const now = Date.now();
        if (!NONCE_RE.test(nonce) || !/^\d{10,16}$/.test(ts) || Math.abs(now - Number(ts)) > SKEW_MS)
            return { ok: false, status: 401, error: 'auth' };
        if (!safeEqual(auth, sign(this.token, requestParts(String(req.method), path, port, ts, nonce))))
            return { ok: false, status: 401, error: 'auth' };
        for (const [n, until] of this.seen)
            if (until < now)
                this.seen.delete(n);
        if (this.seen.has(nonce))
            return { ok: false, status: 401, error: 'replay' };
        this.seen.set(nonce, now + 2 * SKEW_MS);
        return { ok: true, nonce };
    }
    proof(nonce) {
        return sign(this.token, proofParts(this.port(), nonce));
    }
}
export function safeEqual(a, b) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
}
// Fichier lisible sous la racine (realpath, pas de « .. », extension en liste blanche), sinon null.
export function readablePath(root, path, extensions) {
    if (!path || path.includes('\0'))
        return null;
    const abs = isAbsolute(path) ? path : resolve(root, path);
    let real;
    let realRoot;
    try {
        real = realpathSync(abs);
        realRoot = realpathSync(root);
    }
    catch {
        return null;
    }
    if (real !== realRoot && !real.startsWith(realRoot + sep))
        return null;
    if (relative(realRoot, real).split(sep).includes('..'))
        return null;
    if (extensions && !extensions.some((ext) => real.toLowerCase().endsWith(ext)))
        return null;
    return real;
}

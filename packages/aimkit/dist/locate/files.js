// Fichiers du projet : index des templates et des feuilles (dossiers ignorés et .gitignore exclus), refait
// s'il a plus de INDEX_TTL_MS, lignes en cache tant que le mtime ne change pas. Pas de watcher récursif :
// sous Linux il pose un inotify par dossier (node_modules compris) et, à court de watchers (ENOSPC), l'index
// ne se rafraîchissait plus jamais. Résolution d'un chemin vu dans la page (absolu, relatif, URL du
// serveur de dev, webpack://, /@fs/…) vers un fichier sous la racine.
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
export const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl', '.pcss', '.postcss'];
const FILES_MAX = 20_000;
const FILE_SIZE_MAX = 1_500_000;
const PUBLIC_DIRS = ['', 'public', 'static', 'src', 'web', 'www', 'htdocs', 'public_html', 'assets', 'app'];
const INDEX_TTL_MS = 3000;
export class ProjectFiles {
    cfg;
    index = null;
    indexedAt = 0;
    cache = new Map();
    ignores = [];
    root;
    constructor(cfg) {
        this.cfg = cfg;
        this.root = realpath(cfg.root) || cfg.root;
        this.ignores = gitignore(this.root);
    }
    close() {
        this.cache.clear();
    }
    ignored(rel) {
        const parts = rel.split(/[\\/]/);
        if (parts.some((p) => this.cfg.ignore.includes(p)))
            return true;
        const unix = parts.join('/');
        return this.ignores.some((re) => re.test(unix));
    }
    // Tous les fichiers utiles (templates et feuilles), chemins absolus.
    all() {
        if (this.index && Date.now() - this.indexedAt < INDEX_TTL_MS)
            return this.index;
        const out = [];
        const exts = [...this.cfg.extensions, ...STYLE_EXTENSIONS].map((e) => e.toLowerCase());
        const walk = (dir) => {
            if (out.length >= FILES_MAX)
                return;
            let entries;
            try {
                entries = readdirSync(dir, { withFileTypes: true });
            }
            catch {
                return;
            }
            for (const e of entries) {
                const abs = join(dir, e.name);
                const rel = relative(this.root, abs);
                if (this.ignored(rel))
                    continue;
                if (e.isDirectory())
                    walk(abs);
                else if (e.isFile() && exts.some((x) => e.name.toLowerCase().endsWith(x)))
                    out.push(abs);
                if (out.length >= FILES_MAX)
                    return;
            }
        };
        walk(this.root);
        this.index = out;
        this.indexedAt = Date.now();
        return out;
    }
    templates() {
        const exts = this.cfg.extensions.map((e) => e.toLowerCase());
        return this.all().filter((f) => exts.some((x) => f.toLowerCase().endsWith(x)));
    }
    read(abs) {
        let mtime = 0;
        try {
            const st = statSync(abs);
            if (st.size > FILE_SIZE_MAX)
                return { lines: [], text: '' };
            mtime = st.mtimeMs;
        }
        catch {
            return { lines: [], text: '' };
        }
        const hit = this.cache.get(abs);
        if (hit && hit.mtime === mtime)
            return hit;
        let text = '';
        try {
            text = readFileSync(abs, 'utf8');
        }
        catch { /* illisible */ }
        const entry = { mtime, text, lines: text.split(/\r?\n/) };
        this.cache.set(abs, entry);
        return entry;
    }
    rel(abs) {
        return relative(this.root, abs).split(sep).join('/');
    }
    inside(abs) {
        return abs === this.root || abs.startsWith(this.root + sep);
    }
    // Chemin vu dans la page → fichier sous la racine, ou null.
    resolve(raw, origin = '') {
        if (!raw)
            return null;
        let p = raw.trim();
        try {
            if (/^https?:\/\//.test(p)) {
                const u = new URL(p);
                if (origin && u.origin !== origin && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname))
                    return null;
                p = decodeURIComponent(u.pathname);
            }
            else if (p.startsWith('file://'))
                p = decodeURIComponent(new URL(p).pathname);
        }
        catch {
            return null;
        }
        p = p.replace(/[?#].*$/, '');
        p = p.replace(/^webpack:\/\/[^/]*\//, '').replace(/^\/?(_N_E|\.)\//, '').replace(/^\(app-pages-browser\)\//, '');
        if (p.startsWith('/@fs/'))
            p = p.slice(4);
        if (!p)
            return null;
        const tryPath = (candidate) => {
            const real = realpath(candidate);
            if (!real || !this.inside(real))
                return null;
            try {
                return statSync(real).isFile() ? real : null;
            }
            catch {
                return null;
            }
        };
        if (isAbsolute(p)) {
            const direct = tryPath(p);
            if (direct)
                return direct;
        }
        // Chemin relatif à la racine, ou chemin d'URL servi depuis un dossier public
        const clean = p.replace(/^\/+/, '');
        for (const dir of PUBLIC_DIRS) {
            const hit = tryPath(resolve(this.root, dir, clean));
            if (hit)
                return hit;
        }
        // Dernier recours : même fin de chemin dans l'index (le plus long suffixe commun gagne)
        const name = basename(clean);
        const candidates = this.all().filter((f) => basename(f) === name);
        if (!candidates.length)
            return null;
        const parts = clean.split('/').reverse();
        let best = null;
        let bestScore = 0;
        for (const c of candidates) {
            const cp = this.rel(c).split('/').reverse();
            let k = 0;
            while (k < parts.length && k < cp.length && parts[k] === cp[k])
                k++;
            if (k > bestScore) {
                best = c;
                bestScore = k;
            }
            else if (k === bestScore)
                best = null; // ambigu
        }
        return best;
    }
}
function realpath(p) {
    try {
        return realpathSync(p);
    }
    catch {
        return null;
    }
}
// .gitignore de la racine : motifs simples (*, **, dossier/, /ancré). Négations ignorées.
function gitignore(root) {
    let text = '';
    try {
        text = readFileSync(join(root, '.gitignore'), 'utf8');
    }
    catch {
        return [];
    }
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#') || line.startsWith('!'))
            continue;
        const anchored = line.startsWith('/') || line.slice(0, -1).includes('/');
        const body = line.replace(/^\//, '').replace(/\/$/, '');
        const re = body.split('**').map((seg) => seg.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*');
        out.push(new RegExp(anchored ? `^${re}(/|$)` : `(^|/)${re}(/|$)`));
    }
    return out;
}

// Source maps (v3) : décodage VLQ, recherche de la position d'origine. Sert à remonter une règle CSS
// compilée (SCSS, CSS modules, PostCSS) et une pile React 19 (_debugStack) au fichier source.
// Les cartes et les fichiers servis se téléchargent depuis le serveur de dev (local seulement).
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));
const FETCH_MAX = 8_000_000;
export class SourceMap {
    raw;
    url;
    lines = [];
    sources = []; // sources jointes à leur sourceRoot, toutes sections confondues
    constructor(raw, url) {
        this.raw = raw;
        this.url = url;
        // Carte indexée : chaque section est décalée de son offset (ligne, et colonne sur sa première ligne)
        const sections = raw.sections?.length ? raw.sections : [{ offset: { line: 0, column: 0 }, map: raw }];
        for (const { offset, map } of sections) {
            if (!map || map.sections)
                continue;
            const first = this.sources.length;
            const root = map.sourceRoot || '';
            for (const src of map.sources || [])
                this.sources.push(root && !/^[a-z]+:|^\//i.test(src) ? `${root.replace(/\/?$/, '/')}${src}` : src);
            decode(map.mappings || '').forEach((segs, i) => {
                const line = (offset?.line || 0) + i;
                const shift = i === 0 ? offset?.column || 0 : 0;
                const row = (this.lines[line] ??= []);
                for (const s of segs)
                    row.push([s[0] + shift, s[1] + first, s[2], s[3]]);
                row.sort((a, b) => a[0] - b[0]);
            });
        }
    }
    // line 0-based, column 0-based dans le fichier généré → position d'origine (line 1-based)
    original(line, column) {
        const segs = this.lines[line];
        if (!segs || !segs.length) {
            // Ligne sans correspondance : la plus proche au-dessus
            for (let l = line - 1; l >= Math.max(0, line - 5); l--) {
                const s = this.lines[l];
                if (s && s.length)
                    return this.at(s[s.length - 1]);
            }
            return null;
        }
        let best = null;
        for (const s of segs) {
            if (s[0] <= column)
                best = s;
            else
                break;
        }
        return this.at(best ?? segs[0]);
    }
    at(seg) {
        const joined = this.sources[seg[1]];
        if (joined === undefined)
            return null;
        let source = joined;
        try {
            if (!/^[a-z]+:\/\//i.test(joined) && !joined.startsWith('/') && /^https?:/.test(this.url))
                source = new URL(joined, this.url).href;
        }
        catch { /* garde tel quel */ }
        return { source, line: seg[2] + 1, column: seg[3] + 1 };
    }
}
function decode(mappings) {
    const out = [];
    let src = 0;
    let srcLine = 0;
    let srcCol = 0;
    for (const line of mappings.split(';')) {
        const segs = [];
        let genCol = 0;
        for (const part of line.split(',')) {
            if (!part)
                continue;
            const v = vlq(part);
            genCol += v[0];
            if (v.length >= 4) {
                src += v[1];
                srcLine += v[2];
                srcCol += v[3];
                segs.push([genCol, src, srcLine, srcCol]);
            }
        }
        segs.sort((a, b) => a[0] - b[0]);
        out.push(segs);
    }
    return out;
}
function vlq(s) {
    const out = [];
    let value = 0;
    let shift = 0;
    for (const c of s) {
        const d = B64_INDEX.get(c);
        if (d === undefined)
            break;
        value += (d & 31) << shift;
        if (d & 32)
            shift += 5;
        else {
            out.push(value & 1 ? -(value >>> 1) : value >>> 1);
            value = 0;
            shift = 0;
        }
    }
    return out;
}
// sourceMappingURL en fin de texte (CSS : /*# … */, JS : //# …)
export function mapComment(text) {
    const tail = text.slice(-6000);
    const m = /(?:\/\*|\/\/)[#@]\s*sourceMappingURL=([^\s*'"]+)\s*(?:\*\/)?\s*$/.exec(tail);
    return m ? m[1] : '';
}
export function parseDataUrl(url) {
    const m = /^data:application\/json(?:;charset=[\w-]+)?(;base64)?,(.*)$/s.exec(url);
    if (!m)
        return null;
    try {
        const json = m[1] ? Buffer.from(m[2], 'base64').toString('utf8') : decodeURIComponent(m[2]);
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
// Hôte local : localhost, 127.0.0.1, ::1, *.localhost, *.test.
function isLocal(url) {
    try {
        const u = new URL(url);
        return /^https?:$/.test(u.protocol) && (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname) || /\.(localhost|test)$/.test(u.hostname));
    }
    catch {
        return false;
    }
}
// Téléchargement pour une page locale seulement (le serveur de dev du projet), vers un hôte local : le
// bridge ne sert pas de relais vers les services de la machine à une page publique ou de préproduction.
export function fetchable(url, origin) {
    return isLocal(origin) && isLocal(url);
}
export class Fetcher {
    origin;
    deadline;
    cache = new Map();
    constructor(origin, deadline) {
        this.origin = origin;
        this.deadline = deadline;
    }
    async text(url) {
        if (!fetchable(url, this.origin))
            return null;
        const hit = this.cache.get(url);
        if (hit)
            return hit.text;
        const left = this.deadline - Date.now();
        if (left < 50)
            return null;
        let text = null;
        try {
            // Redirection non suivie : elle pourrait mener hors des hôtes vérifiés
            const res = await fetch(url, { signal: AbortSignal.timeout(Math.min(left, 1200)), headers: { accept: '*/*' }, redirect: 'manual' });
            if (res.ok) {
                const body = await res.text();
                text = body.length <= FETCH_MAX ? body : null;
            }
        }
        catch { /* serveur de dev muet */ }
        this.cache.set(url, { at: Date.now(), text });
        return text;
    }
    async map(mapUrl, base) {
        if (!mapUrl)
            return null;
        if (mapUrl.startsWith('data:')) {
            const raw = parseDataUrl(mapUrl);
            return raw ? new SourceMap(raw, base) : null;
        }
        let abs;
        try {
            abs = new URL(mapUrl, base).href;
        }
        catch {
            return null;
        }
        const text = await this.text(abs);
        if (!text)
            return null;
        try {
            return new SourceMap(JSON.parse(text), abs);
        }
        catch {
            return null;
        }
    }
}

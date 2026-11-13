// POST /save : un dossier par cas, <contextDir>/<outil>/<nom>/context.md + preview-<n>.png + meta.json.
// Le chemin n'est jamais fourni par le client : outil en liste blanche, nom [a-z0-9_-]{1,90}, PNG vérifié
// à la signature (10 au plus, 4 Mo chacun). On garde les KEEP cas les plus récents par outil.
// Nom déjà pris (deux onglets, même libellé, même seconde) : -2, -3… ; les chemins du texte suivent.
// Réponse : chemins relatifs à la racine du projet (la ligne « @chemin » que Claude Code ouvre).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { TOOLS } from './protocol.js';
const NAME_RE = /^[a-z0-9_-]{1,90}$/;
const TEXT_MAX = 400_000;
const IMAGES_MAX = 10;
const IMAGE_MAX = 4_000_000;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
export function save(cfg, body) {
    const b = (body && typeof body === 'object' ? body : {});
    const tool = b.tool;
    const name = b.name;
    const text = b.text;
    if (!TOOLS.includes(tool))
        throw new HttpError(400, 'tool');
    if (typeof name !== 'string' || !NAME_RE.test(name))
        throw new HttpError(400, 'name');
    if (typeof text !== 'string' || !text || text.length > TEXT_MAX)
        throw new HttpError(400, 'text');
    const images = Array.isArray(b.images) ? b.images.slice(0, IMAGES_MAX) : [];
    const base = join(cfg.root, cfg.contextDir);
    const toolDir = ensureToolDir(base, tool);
    const unique = freeName(toolDir, name);
    const dir = join(toolDir, unique);
    mkdirSync(dir);
    const rel = (p) => relative(cfg.root, p).split(sep).join('/');
    const written = [];
    images.forEach((b64, i) => {
        written[i] = '';
        if (typeof b64 !== 'string' || !b64 || b64.length > (IMAGE_MAX * 4) / 3 + 4)
            return;
        const png = Buffer.from(b64, 'base64');
        if (png.length < 8 || !png.subarray(0, 8).equals(PNG_SIG))
            return;
        const file = join(dir, `preview-${i + 1}.png`);
        writeFileSync(file, png);
        written[i] = rel(file);
    });
    const m = (b.meta && typeof b.meta === 'object' ? b.meta : {});
    const meta = {
        tool,
        name: unique,
        label: str(m.label, 300),
        note: str(m.note, 2000),
        url: str(m.url, 2000),
        origin: str(m.origin, 300),
        createdAt: new Date().toISOString(),
        images: written.filter(Boolean),
    };
    writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    const md = join(dir, 'context.md');
    // Le client a écrit les chemins des aperçus avec le nom qu'il avait choisi
    writeFileSync(md, unique === name ? text : text.split(`${cfg.contextDir}/${tool}/${name}/`).join(`${cfg.contextDir}/${tool}/${unique}/`));
    prune(toolDir, cfg.keep);
    return { path: rel(md), images: written };
}
// Dossier des contextes ignoré par git d'office (son propre .gitignore), même sans `aimkit init`. Le
// .gitignore « * » ne va que dans un dossier créé ici : un contextDir qui existait déjà (docs/…) n'est pas
// ignoré en entier, seul le dossier de l'outil l'est.
const IGNORE_TEXT = '# Contexts written by aimkit for Claude Code\n*\n';
function ensureToolDir(base, tool) {
    const toolDir = join(base, tool);
    if (!existsSync(base)) {
        mkdirSync(base, { recursive: true });
        writeFileSync(join(base, '.gitignore'), IGNORE_TEXT);
    }
    if (!existsSync(toolDir)) {
        mkdirSync(toolDir);
        if (!ownIgnore(base))
            writeFileSync(join(toolDir, '.gitignore'), IGNORE_TEXT);
    }
    return toolDir;
}
function ownIgnore(dir) {
    try {
        return readFileSync(join(dir, '.gitignore'), 'utf8') === IGNORE_TEXT;
    }
    catch {
        return false;
    }
}
function freeName(toolDir, name) {
    if (!existsSync(join(toolDir, name)))
        return name;
    for (let k = 2; k < 1000; k++) {
        const suffix = `-${k}`;
        const candidate = `${name.slice(0, 90 - suffix.length)}${suffix}`;
        if (!existsSync(join(toolDir, candidate)))
            return candidate;
    }
    throw new HttpError(409, 'name');
}
// Garde les keep cas les plus récents ; on ne retire que nos fichiers (.md, .png, meta.json), puis le dossier.
export function prune(toolDir, keep) {
    let cases;
    try {
        cases = readdirSync(toolDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && NAME_RE.test(d.name))
            .map((d) => ({ path: join(toolDir, d.name), mtime: statSync(join(toolDir, d.name)).mtimeMs }));
    }
    catch {
        return 0;
    }
    if (cases.length <= keep)
        return 0;
    cases.sort((a, b) => b.mtime - a.mtime || b.path.localeCompare(a.path));
    let removed = 0;
    for (const old of cases.slice(keep)) {
        for (const f of readdirSync(old.path)) {
            if (/^(context\.md|meta\.json|preview-\d+\.png)$/.test(f))
                unlinkSync(join(old.path, f));
        }
        try {
            rmdirSync(old.path);
            removed++;
        }
        catch { /* fichier étranger laissé : le dossier reste */ }
    }
    return removed;
}
function str(v, max) {
    return typeof v === 'string' ? v.slice(0, max) : '';
}

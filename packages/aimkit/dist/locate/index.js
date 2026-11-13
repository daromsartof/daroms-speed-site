// POST /locate : fichier:ligne des templates, composants et règles CSS. Lecture seule, 1,5 s max.
// Par ordre de fiabilité (le context.md dit laquelle a servi) :
//  1. source exacte trouvée dans la page (attribut de build, React ≤ 18, Svelte) : rendue relative
//  2. React 19 : _debugStack résolue par la source map du module servi
//  3. estimation sur la chaîne d'indices, d'abord dans les fichiers des composants connus, puis partout
// CSS : source map de la feuille servie si elle existe, sinon recherche du sélecteur dans le fichier source.
// Classe utilitaire (Tailwind) : pas de règle source, on renvoie la ligne du template qui porte la classe.
// Un indice « exact » venu de la page n'est gardé exact que s'il désigne un fichier du projet.
import { basename } from 'node:path';
import { findSelectorLine, isTailwindEntry, styleRegions } from './css.js';
import { locateElement } from './element.js';
import { ProjectFiles } from './files.js';
import { Fetcher, mapComment } from './sourcemap.js';
const BUDGET_MS = 1500;
const ITEMS_MAX = 10;
const CSS_MAX = 40;
const SHEETS_MAX = 80;
const SFC = /\.(vue|svelte|astro|html?|php|twig|njk|hbs|liquid|erb)$/i;
export class Locator {
    cfg;
    files;
    constructor(cfg) {
        this.cfg = cfg;
        this.files = new ProjectFiles(cfg);
    }
    close() {
        this.files.close();
    }
    async locate(body) {
        const started = Date.now();
        const deadline = started + BUDGET_MS;
        const req = parse(body);
        const fetcher = new Fetcher(req.origin, deadline);
        const items = [];
        for (const item of req.items)
            items.push(await this.item(item, req, fetcher, deadline));
        return { items, ms: Date.now() - started };
    }
    read = (abs) => this.files.read(abs).lines;
    async item(item, req, fetcher, deadline) {
        const fw = item.framework;
        const componentAbs = (fw?.files ?? []).map((f) => this.files.resolve(f, req.origin));
        const files = componentAbs.map((abs, i) => (abs ? this.files.rel(abs) : fw.files[i]));
        let template = null;
        let templateAbs = null;
        if (item.source) {
            templateAbs = this.files.resolve(item.source.file, req.origin);
            template = { file: templateAbs ? this.files.rel(templateAbs) : item.source.file, line: item.source.line, endLine: 0, depth: item.source.depth, ties: 0, exact: !!templateAbs, via: item.source.via };
        }
        else if (fw?.frame) {
            const pos = await this.resolveFrame(fw.frame, fetcher, req.origin);
            if (pos) {
                templateAbs = pos.abs;
                template = { file: this.files.rel(pos.abs), line: pos.line, endLine: 0, depth: fw.depth, ties: 0, exact: true, via: 'react-stack' };
            }
        }
        if (!template && item.chain.length && Date.now() < deadline) {
            const known = [...componentAbs].reverse().filter((f) => !!f);
            const byName = known.length ? [] : this.componentFiles(fw);
            const restrict = [...new Set([...known, ...byName])];
            let found = restrict.length ? locateElement(restrict, this.read, item.chain, deadline) : null;
            if (!found)
                found = locateElement(this.files.templates(), this.read, item.chain, deadline);
            if (found) {
                templateAbs = found.file;
                template = { file: this.files.rel(found.file), line: found.line, endLine: 0, depth: found.depth, ties: found.ties, exact: false, via: 'estimate' };
            }
        }
        const css = [];
        for (const ref of item.css) {
            const sheet = ref ? req.sheets[ref.sheet] : undefined;
            const loc = ref && sheet && Date.now() < deadline ? await this.css(ref, sheet, req.origin, fetcher, deadline) : null;
            // La classe est sur la balise de l'élément : seulement si la ligne trouvée est la sienne (depth 0)
            if (loc?.utility && ref && templateAbs && template?.depth === 0) {
                const line = classLine(this.read(templateAbs), template.line, ref.selector);
                if (line)
                    loc.classAt = { file: template.file, line };
            }
            css.push(loc);
        }
        return { template, files, css };
    }
    // Fichiers qui définissent un composant connu par son nom seulement (React 19 sans pile, Angular, Lit).
    componentFiles(fw) {
        const name = fw?.component;
        if (!name)
            return [];
        const bare = name.replace(/Component$/, '');
        const kebab = bare.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        const wanted = new Set([name.toLowerCase(), bare.toLowerCase(), kebab, `${kebab}.component`]);
        return this.files.templates().filter((f) => wanted.has(basename(f).replace(/\.[^.]+$/, '').toLowerCase()));
    }
    // React 19 : position du JSX dans le module servi → fichier source, via la source map du module.
    async resolveFrame(frame, fetcher, origin) {
        const js = await fetcher.text(frame.url);
        if (!js)
            return null;
        const map = await fetcher.map(mapComment(js), frame.url);
        const orig = map?.original(frame.line - 1, frame.column - 1);
        if (!orig)
            return null;
        const abs = this.files.resolve(orig.source, origin);
        return abs ? { abs, line: orig.line } : null;
    }
    async css(ref, sheet, origin, fetcher, deadline) {
        const sourceAbs = sheet.devId ? this.files.resolve(sheet.devId, origin) : sheet.url ? this.files.resolve(sheet.url, origin) : null;
        // 1. Source map : feuille compilée (SCSS, CSS modules, PostCSS…) → fichier et ligne d'origine
        const generated = sheet.text || (sheet.url && (sheet.map || !sourceAbs || !/\.css$/i.test(sourceAbs)) ? await fetcher.text(sheet.url) : null);
        const mapUrl = sheet.map || (generated ? mapComment(generated) : '');
        if (generated && mapUrl) {
            const map = await fetcher.map(mapUrl, sheet.url || `${origin}/`);
            const lines = generated.split(/\r?\n/);
            const hit = map ? findSelectorLine(lines, ref.selector, ref.media) : null;
            const orig = hit ? map.original(hit.line - 1, hit.column) : null;
            const abs = orig ? this.files.resolve(orig.source, origin) : null;
            if (abs && orig) {
                // La carte pointe le début de la règle ; on affine dans le fichier d'origine si le sélecteur y est
                const own = this.files.read(abs).lines;
                const refined = findSelectorLine(own, ref.selector, ref.media, SFC.test(abs) ? styleRegions(own) : undefined, true);
                const line = refined && Math.abs(refined.line - orig.line) <= 3 ? refined.line : orig.line;
                return { file: this.files.rel(abs), line, utility: false, mapped: true, classAt: null };
            }
        }
        // 2. <style> de la page sans fichier : on le cherche dans les blocs <style> des templates
        if (!sourceAbs) {
            if (sheet.url || sheet.devId)
                return null;
            for (const f of this.files.templates()) {
                if (Date.now() > deadline)
                    break;
                const lines = this.read(f);
                const regions = styleRegions(lines);
                if (!regions.length)
                    continue;
                const hit = findSelectorLine(lines, ref.selector, ref.media, regions);
                if (hit)
                    return { file: this.files.rel(f), line: hit.line, utility: false, mapped: false, classAt: null };
            }
            return null;
        }
        // 3. Recherche directe dans le fichier source
        const { lines, text } = this.files.read(sourceAbs);
        const hit = findSelectorLine(lines, ref.selector, ref.media, SFC.test(sourceAbs) ? styleRegions(lines) : undefined, true);
        const file = this.files.rel(sourceAbs);
        if (hit)
            return { file, line: hit.line, utility: false, mapped: false, classAt: null };
        // 4. Tailwind : classe utilitaire ou règle de base (preflight) générée, pas de règle dans le source
        if (isTailwindEntry(text))
            return { file, line: null, utility: true, mapped: false, classAt: null };
        return { file, line: null, utility: false, mapped: false, classAt: null };
    }
}
// Ligne de la balise ouvrante (dès `line`, 12 lignes au plus) qui porte la classe du sélecteur
// (« .hover\:bg-blue-700:hover » → hover:bg-blue-700), 0 sinon.
export function classLine(lines, line, selector) {
    const m = /^\.((?:\\.|[\w-])+)/.exec(selector.trim());
    if (!m)
        return 0;
    const cls = m[1].replace(/\\(.)/g, '$1');
    const re = new RegExp(`(^|[\\s"'\`{])${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s"'\`}])`);
    for (let i = Math.max(0, line - 1); i < Math.min(lines.length, line + 11); i++) {
        if (re.test(lines[i]))
            return i + 1;
        if (i > line - 1 && /^\s*<[a-z]/i.test(lines[i]))
            break; // balise suivante : on s'arrête
    }
    return 0;
}
// ------------------------------------------------------------------------------------------- VALIDATION
function parse(body) {
    const b = (body && typeof body === 'object' ? body : {});
    const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0);
    const strs = (v, n, max = 300) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, max)) : []);
    const sheets = (Array.isArray(b.sheets) ? b.sheets.slice(0, SHEETS_MAX) : []).map((x) => {
        const s = (x && typeof x === 'object' ? x : {});
        return { url: str(s.url), devId: str(s.devId), map: str(s.map, 4_000_000), text: str(s.text, 4_000_000) };
    });
    const items = (Array.isArray(b.items) ? b.items.slice(0, ITEMS_MAX) : []).map((x) => {
        const it = (x && typeof x === 'object' ? x : {});
        const chain = (Array.isArray(it.chain) ? it.chain.slice(0, 6) : []).map((t) => {
            const c = (t && typeof t === 'object' ? t : {});
            const attrs = {};
            if (c.attrs && typeof c.attrs === 'object') {
                for (const [k, v] of Object.entries(c.attrs).slice(0, 30))
                    if (/^[\w:.@-]{1,60}$/.test(k))
                        attrs[k] = str(v, 200);
            }
            return { label: str(c.label, 200), tag: str(c.tag, 60).toLowerCase(), id: str(c.id, 200), classes: strs(c.classes, 80, 200), attrs, text: str(c.text, 200) };
        });
        const s = it.source && typeof it.source === 'object' ? it.source : null;
        const source = s && str(s.file) && num(s.line) > 0
            ? { file: str(s.file), line: num(s.line), column: num(s.column), depth: num(s.depth), label: str(s.label, 200), via: (str(s.via, 20) || 'attr'), attr: str(s.attr, 60) }
            : null;
        const f = it.framework && typeof it.framework === 'object' ? it.framework : null;
        const fr = f?.frame && typeof f.frame === 'object' ? f.frame : null;
        const framework = f
            ? {
                name: str(f.name, 20), version: str(f.version, 40), component: str(f.component, 200), stack: strs(f.stack, 20, 200),
                file: str(f.file), line: num(f.line), column: num(f.column), files: strs(f.files, 20, 4000), depth: num(f.depth), label: str(f.label, 200),
                frame: fr && str(fr.url) ? { url: str(fr.url), line: num(fr.line), column: num(fr.column) } : null,
            }
            : null;
        const css = (Array.isArray(it.css) ? it.css.slice(0, CSS_MAX) : []).map((r) => {
            const c = r && typeof r === 'object' ? r : null;
            return c && num(c.sheet) >= 0 && num(c.sheet) < sheets.length ? { sheet: num(c.sheet), selector: str(c.selector, 2000), media: str(c.media, 1000) } : null;
        });
        return { chain, source, framework, css };
    });
    return { origin: str(b.origin, 300), sheets, items };
}

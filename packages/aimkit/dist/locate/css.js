// Ligne d'une règle CSS dans son fichier source. Le navigateur normalise selectorText (« a > b »,
// « ::before », guillemets d'attribut) : on normalise pareil des deux côtés. Marques de portée retirées
// ([data-v-…] de Vue, .svelte-… de Svelte, [data-astro-cid-…], [_ngcontent-…]) ; classes de CSS modules
// ramenées à leur nom local. Préférence à la ligne qui est dans le bon @media.
// Feuilles imbriquées (SCSS, Less, CSS natif) : « .card .btn » compilé se retrouve par sa dernière partie,
// dans un bloc dont les sélecteurs parents contiennent le reste (« &__title » sous « .card » compris).
export function normalizeSelector(s) {
    return s
        .replace(/::(before|after|first-line|first-letter)/g, ':$1')
        .replace(/\[\s*([\w-]+)\s*([~|^$*]?=)\s*["']?([^"'\]]*)["']?\s*(i|s)?\s*\]/g, '[$1$2$3]')
        .replace(/\s*([>+~,{}()])\s*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}
// Marques de portée ajoutées par les frameworks au sélecteur compilé, absentes du source.
export function unscope(selector) {
    return selector
        .replace(/\[data-v-[0-9a-f]{6,}\]/g, '')
        .replace(/\.svelte-[a-z0-9]{4,}/g, '')
        .replace(/\[data-astro-cid-[\w-]+\]/g, '')
        .replace(/\[_ng(content|host)-[\w-]+\]/g, '')
        .trim();
}
// Classes de CSS modules ramenées à leur nom local : postcss-modules (Vite) « _title_1n5j7_12 »,
// webpack / Next « Card_title__a1B2c ». Seulement côté navigateur : le source porte le nom local.
export function unscopeModules(selector) {
    return selector
        .replace(/\._([A-Za-z][\w-]*)_[a-z0-9]{5}_\d+(?![\w-])/g, '.$1')
        .replace(/\.[A-Z][A-Za-z0-9]*(?:-module)?_([A-Za-z][\w-]*)__[\w-]{5}(?![\w-])/g, '.$1');
}
// Une passe sur le texte : blocs ouverts par ligne (commentaires et chaînes ignorés).
export function structure(lines) {
    const stacks = [];
    const starts = new Map();
    const stack = [];
    let buf = '';
    let comment = false;
    for (let i = 0; i < lines.length; i++) {
        stacks.push(stack.slice());
        const line = lines[i];
        let quote = '';
        for (let k = 0; k < line.length; k++) {
            const c = line[k];
            if (comment) {
                if (c === '*' && line[k + 1] === '/') {
                    comment = false;
                    k++;
                }
                continue;
            }
            if (quote) {
                if (c === quote && line[k - 1] !== '\\')
                    quote = '';
                buf += c;
                continue;
            }
            if (c === '/' && line[k + 1] === '*') {
                comment = true;
                k++;
                continue;
            }
            if (c === '/' && line[k + 1] === '/' && !/url\($/.test(buf))
                break; // commentaire // (SCSS, Less)
            if (c === '"' || c === "'") {
                quote = c;
                buf += c;
                continue;
            }
            if (c === '{') {
                const prelude = normalizeSelector(unscope(buf.replace(/^[\s\S]*[;}]/, '')));
                stack.push({ prelude, start: i });
                const list = starts.get(i) ?? [];
                list.push(prelude);
                starts.set(i, list);
                buf = '';
            }
            else if (c === '}') {
                stack.pop();
                buf = '';
            }
            else if (c === ';')
                buf = '';
            else
                buf += c;
        }
        buf += ' ';
    }
    return { stacks, starts };
}
function mediaOf(stack) {
    for (let k = stack.length - 1; k >= 0; k--)
        if (stack[k].prelude.startsWith('@media'))
            return stack[k].prelude.replace(/^@media\s*/, '');
    return '';
}
// regions : plages de lignes où chercher (blocs <style> d'un .vue / .svelte / .astro / .html), sinon tout.
// modules : sélecteur du navigateur à ramener aux noms locaux (recherche dans le source d'un CSS module).
export function findSelectorLine(lines, selector, media, regions, modules = false) {
    const found = findLine(lines, selector, media, regions, modules);
    if (!found)
        return null;
    const first = normalizeSelector(unscope(modules ? unscopeModules(selector) : selector)).split(/[ >+~,{]/)[0];
    const raw = lines[found.line - 1] ?? '';
    const col = first ? raw.indexOf(first) : -1;
    return { ...found, column: col >= 0 ? col : Math.max(0, raw.search(/\S/)) };
}
function findLine(lines, selector, media, regions, modules) {
    const st = structure(lines);
    const wantMedia = normalizeSelector(media.replace(/^[\s\S]*@media\s*/, ''));
    const inRegion = (i) => !regions || regions.some(([a, b]) => i >= a && i <= b);
    const target = normalizeSelector(unscope(modules ? unscopeModules(selector) : selector));
    if (!target)
        return null;
    const parts = target.split(/(?=[ >+~])/).map((p) => p.replace(/^[ >+~]/, '')).filter(Boolean);
    // 1. Sélecteur entier, dans la liste d'un bloc ouvert sur la ligne
    const exact = [];
    for (const [i, preludes] of st.starts) {
        if (!inRegion(i))
            continue;
        if (preludes.some((p) => p.split(',').map((x) => x.trim()).includes(target)))
            exact.push(i);
    }
    // Sélecteur écrit sur plusieurs lignes : le bloc s'ouvre plus bas, on remonte à la ligne qui le contient
    const multi = [];
    if (!exact.length) {
        for (let i = 0; i < lines.length; i++) {
            if (!inRegion(i))
                continue;
            const norm = normalizeSelector(unscope(lines[i]));
            if (norm === target || norm === `${target},` || norm.startsWith(`${target}{`) || norm.startsWith(`${target},`))
                multi.push(i);
        }
    }
    const pick = (cands) => {
        if (!cands.length)
            return null;
        const inMedia = cands.find((i) => {
            const m = mediaOf(st.stacks[i + 1] ?? st.stacks[i]);
            return wantMedia ? m.includes(wantMedia) || wantMedia.includes(m) && !!m : !m;
        });
        return (inMedia ?? cands[0]) + 1;
    };
    const direct = pick(exact) ?? pick(multi);
    if (direct)
        return { line: lineOf(lines, direct - 1, target) + 1, exact: true };
    // 2. Imbrication : dernière partie (ou suffixe « &… ») dans un bloc dont les parents contiennent le reste
    const last = parts[parts.length - 1];
    const rest = parts.slice(0, -1);
    const nested = [];
    for (const [i, preludes] of st.starts) {
        if (!inRegion(i))
            continue;
        for (const p of preludes) {
            for (const sel of p.split(',').map((x) => x.trim())) {
                const parents = (st.stacks[i] ?? []).map((b) => b.prelude).filter((x) => !x.startsWith('@'));
                const resolved = resolveAmp(sel, parents);
                if (!resolved)
                    continue;
                const rParts = resolved.split(/(?=[ >+~])/).map((x) => x.replace(/^[ >+~]/, '')).filter(Boolean);
                if (rParts[rParts.length - 1] !== last)
                    continue;
                const ctx = rParts.slice(0, -1).join(' ');
                const hits = rest.filter((r) => ctx.includes(r)).length;
                nested.push({ line: i, score: hits * 10 - Math.abs(rParts.length - parts.length) });
            }
        }
    }
    if (nested.length) {
        nested.sort((a, b) => b.score - a.score || a.line - b.line);
        const best = nested.filter((n) => n.score === nested[0].score).map((n) => n.line);
        return { line: pick(best), exact: false };
    }
    return null;
}
// Liste de sélecteurs sur plusieurs lignes : le bloc s'ouvre sur la dernière, on remonte à celle du sélecteur.
function lineOf(lines, i, target) {
    for (let k = i; k >= 0 && k >= i - 12; k--) {
        const norm = normalizeSelector(unscope(lines[k].replace(/\/\*.*?\*\//g, '')));
        if (norm.split(/[,{]/).map((x) => x.trim()).includes(target))
            return k;
        if (k < i && /[;}]\s*$/.test(lines[k]))
            break;
    }
    return i;
}
// « &__title » sous « .card » → « .card__title » ; « & .x » → « .card .x » ; « .x » sous « .card » → « .card .x ».
function resolveAmp(sel, parents) {
    let out = sel;
    for (let k = parents.length - 1; k >= 0; k--) {
        const parent = parents[k].split(',')[0].trim();
        if (!parent || parent.startsWith('@'))
            continue;
        out = out.includes('&') ? out.replace(/&/g, parent) : `${parent} ${out}`;
    }
    return out.includes('&') ? null : normalizeSelector(out);
}
// Blocs <style> d'un composant (.vue, .svelte, .astro) ou d'une page (.html, .php…) : plages de lignes.
export function styleRegions(lines) {
    const out = [];
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
        if (start < 0 && /<style[\s>]/i.test(lines[i]))
            start = i;
        if (start >= 0 && /<\/style>/i.test(lines[i])) {
            out.push([start, i]);
            start = -1;
        }
    }
    return out;
}
// Feuille d'entrée de Tailwind (v3 : @tailwind ; v4 : @import "tailwindcss") : ses classes utilitaires n'ont
// pas de règle dans le source.
export function isTailwindEntry(text) {
    return /@tailwind\s+(base|components|utilities)|@import\s+["']tailwindcss|@import\s+url\(["']?tailwindcss|@plugin\s+["']@tailwindcss/.test(text);
}
export function isUtilitySelector(selector) {
    return /^\.(?:[\w-]|\\.)+(?::[\w-]+(?:\([^)]*\))?)*(?:::?[\w-]+)?$/.test(unscope(selector).trim());
}

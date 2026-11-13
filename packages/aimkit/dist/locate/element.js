// Estimation de la ligne d'un élément (heuristique de la toolbar Maestra, généralisée aux templates et JSX).
// Chaque balise ouvrante du bon nom reçoit un score :
//   base +1 ; id identique +6 ; classe du source présente dans le DOM +2, absente −1 (classes dynamiques
//   ignorées) ; class attendu mais absent −1 ; attribut même nom + même valeur +3, nom seul +1 ;
//   texte propre dans la balise ou les 3 lignes suivantes +3 ; une classe du parent dans les 20 lignes
//   au-dessus +1.
// Le meilleur score ≥ 4 gagne, « ties » compte les ex æquo. Rien pour l'élément : on essaie son parent.
export const SCORE_MIN = 4;
const TAG_LOOKAHEAD = 12;
export function locateElement(files, read, chain, deadline = Infinity) {
    for (let depth = 0; depth < chain.length; depth++) {
        const token = chain[depth];
        if (!token || !/^[a-z][a-z0-9-]*$/.test(token.tag))
            continue;
        const parent = chain[depth + 1] ?? null;
        let best = null;
        let ties = 0;
        for (const file of files) {
            if (Date.now() > deadline)
                return null;
            const lines = read(file);
            const needle = `<${token.tag}`;
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].toLowerCase().includes(needle))
                    continue;
                for (const score of scoreLine(lines, i, token, parent)) {
                    if (!best || score > best.score) {
                        best = { file, line: i + 1, score };
                        ties = 0;
                    }
                    else if (score === best.score && !(best.file === file && best.line === i + 1))
                        ties++;
                }
            }
        }
        if (best && best.score >= SCORE_MIN)
            return { file: best.file, line: best.line, depth, ties, score: best.score };
    }
    return null;
}
// Balises ouvrantes du nom voulu qui commencent sur la ligne i (plusieurs possibles : <li><li>).
export function* scoreLine(lines, i, token, parent) {
    const re = new RegExp(`<${escapeRe(token.tag)}(?=[\\s>/]|$)`, 'gi');
    let m;
    const line = lines[i];
    while ((m = re.exec(line))) {
        const tail = [line.slice(m.index + m[0].length), ...lines.slice(i + 1, i + 1 + TAG_LOOKAHEAD)].join('\n');
        const { attrs, after } = openingTag(tail);
        yield score(attrs, after, lines, i, token, parent);
    }
}
// Fin de la balise ouvrante : premier « > » hors guillemets et hors accolades (JSX : onClick={() => x}).
export function openingTag(text) {
    let quote = '';
    let depth = 0;
    for (let k = 0; k < text.length; k++) {
        const c = text[k];
        if (quote) {
            if (c === quote && text[k - 1] !== '\\')
                quote = '';
            continue;
        }
        if (c === '"' || c === "'" || (c === '`' && depth > 0)) {
            quote = c;
            continue;
        }
        if (c === '{')
            depth++;
        else if (c === '}')
            depth = Math.max(0, depth - 1);
        else if (c === '>' && depth === 0)
            return { attrs: text.slice(0, k), after: text.slice(k + 1) };
    }
    return { attrs: text, after: '' };
}
export function parseAttrs(attrs) {
    const out = [];
    const re = /([:@#*[(]?[\w:.\-[\]()@]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{)|([^\s"'>{}]+)))?/g;
    let m;
    let k = 0;
    while ((m = re.exec(attrs))) {
        // Sauter le contenu des accolades { … } (expression JSX / Svelte)
        if (m[4] === '{') {
            let depth = 1;
            let j = re.lastIndex;
            while (j < attrs.length && depth) {
                if (attrs[j] === '{')
                    depth++;
                else if (attrs[j] === '}')
                    depth--;
                j++;
            }
            re.lastIndex = j;
            out.push({ name: m[1], value: '{' });
        }
        else
            out.push({ name: m[1], value: m[2] ?? m[3] ?? m[5] ?? null });
        if (++k > 60)
            break;
    }
    return out;
}
const DYNAMIC = /[{}$]|<\?|\{\{|\{%|<%|@\(/;
function score(attrsText, after, lines, i, token, parent) {
    let s = 1;
    const attrs = parseAttrs(attrsText);
    const get = (name) => attrs.find((a) => a.name === name);
    // id
    const id = get('id');
    if (token.id && id && id.value === token.id)
        s += 6;
    // Classes : class / className statique ; :class, class={…}, className={…}, class:x={…} ignorés
    const cls = get('class') ?? get('className') ?? get('classname');
    const dom = new Set(token.classes);
    if (cls && cls.value !== null && cls.value !== '{') {
        for (const c of cls.value.split(/\s+/).filter(Boolean)) {
            if (DYNAMIC.test(c))
                continue;
            s += dom.has(c) ? 2 : -1;
        }
    }
    else if (!cls && dom.size > 0 && !attrs.some((a) => /^(:class|v-bind:class|\[class\]|\[ngClass\]|class:|\{\.\.\.)/.test(a.name) || a.name.startsWith('class:'))) {
        s -= 1;
    }
    // Attributs : même valeur +3, nom seul +1
    for (const [name, value] of Object.entries(token.attrs)) {
        const a = get(name) ?? get(`:${name}`) ?? get(`v-bind:${name}`) ?? get(`[${name}]`);
        if (!a)
            continue;
        s += a.value !== null && a.value !== '{' && value !== '' && a.value === value ? 3 : 1;
    }
    // Texte propre, dans la balise ou les 3 lignes suivantes
    const text = token.text.trim();
    if (text.length >= 3) {
        const window = `${after} ${lines.slice(i + 1, i + 4).join(' ')}`.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const needle = text.slice(0, 24).toLowerCase();
        if (window.toLowerCase().includes(needle))
            s += 3;
    }
    // Contexte : une classe du parent dans les 20 lignes au-dessus
    if (parent) {
        const above = lines.slice(Math.max(0, i - 20), i).join(' ');
        for (const c of parent.classes.slice(0, 3)) {
            if (c && new RegExp(`class(Name)?\\s*=\\s*["'{\`][^"'\`]*?(?<![\\w-])${escapeRe(c)}(?![\\w-])`).test(above)) {
                s += 1;
                break;
            }
        }
    }
    return s;
}
export function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

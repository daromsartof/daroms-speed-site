// Configuration du bridge : .aimkit.json à la racine du projet (facultatif), valeurs par défaut sinon.
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
export const VERSION = '0.3.0';
export const EXTENSION_ID = 'olpbojollpmemgbioknlhphggmmiegjl'; // clé publique du manifest : ID stable
export const CONFIG_FILE = '.aimkit.json';
export const DEFAULT_CONTEXT_DIR = '.claude-context';
export const DEFAULT_EXTENSIONS = ['.html', '.htm', '.php', '.twig', '.blade.php', '.vue', '.svelte', '.astro', '.jsx', '.tsx', '.erb', '.njk', '.hbs', '.liquid'];
export const DEFAULT_IGNORE = ['node_modules', 'dist', 'build', '.next', '.nuxt', '.git', 'vendor', '.svelte-kit', '.output', '.claude-context', 'coverage', '.turbo', '.cache', '.vercel', '.angular'];
export function loadConfig(rootArg) {
    const root = resolve(rootArg);
    let file = {};
    const path = join(root, CONFIG_FILE);
    if (existsSync(path)) {
        try {
            file = JSON.parse(readFileSync(path, 'utf8'));
        }
        catch (e) {
            throw new Error(`${CONFIG_FILE} illisible : ${e.message}`);
        }
    }
    const warnings = [];
    // ID d'extension en plus : variable d'environnement seulement (réglage de la machine, pas du dépôt)
    const envIds = (process.env.AIMKIT_EXTENSION_IDS || '').split(',').map((s) => s.trim()).filter((s) => /^[a-p]{32}$/.test(s));
    if (file.extensionIds !== undefined)
        warnings.push(`${CONFIG_FILE}: "extensionIds" ignored (use AIMKIT_EXTENSION_IDS for another extension ID)`);
    let contextDir = DEFAULT_CONTEXT_DIR;
    if (file.contextDir !== undefined) {
        if (validContextDir(file.contextDir))
            contextDir = file.contextDir.replace(/\/+$/, '');
        else
            warnings.push(`${CONFIG_FILE}: "contextDir" refused (${JSON.stringify(file.contextDir)}), using ${DEFAULT_CONTEXT_DIR}`);
    }
    return {
        root,
        name: file.name || packageName(root) || basename(root),
        origins: strings(file.origins).map((o) => o.replace(/\/+$/, '')),
        extensions: strings(file.extensions).length ? strings(file.extensions) : DEFAULT_EXTENSIONS,
        ignore: [...new Set([...DEFAULT_IGNORE, ...strings(file.ignore)])],
        extensionIds: [...new Set([EXTENSION_ID, ...envIds])],
        contextDir,
        keep: Number.isInteger(file.keep) && file.keep > 0 ? Math.min(file.keep, 500) : 40,
        warnings,
    };
}
// Dossier des contextes : relatif, sous la racine, ni la racine elle-même ni .git (« . », « .. », « /x » refusés).
export function validContextDir(v) {
    if (typeof v !== 'string')
        return false;
    const parts = v.replace(/\/+$/, '').split('/');
    return parts.length > 0 && parts.length <= 6
        && parts.every((p) => /^[\w.-]{1,60}$/.test(p) && p !== '.' && p !== '..')
        && parts[0] !== '.git';
}
function strings(v) {
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.length > 0) : [];
}
function packageName(root) {
    try {
        const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
        return typeof pkg.name === 'string' ? pkg.name : '';
    }
    catch {
        return '';
    }
}

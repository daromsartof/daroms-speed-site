// aimkit setup : copie l'extension Chrome livrée dans ce paquet (dossier extension/) vers ~/AimKit/extension, puis
// affiche les étapes dans Chrome et le lien d'appariement. Lancé par les scripts d'installation de daromsart.xyz, et
// relancé à chaque mise à jour (Chrome relit le dossier au clic sur ↻).
// Hors Chrome Web Store, Chrome stable n'installe que des extensions non empaquetées (mode développeur) : le
// chargement reste un geste à faire une fois dans chrome://extensions. Le manifest garde sa clé : même ID partout.
// Dossier visible (pas ~/.aimkit) : les fenêtres de choix de dossier masquent les dossiers cachés.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const EXTENSION_NAME = 'AimKit';
// Paquet publié : <paquet>/extension. Dépôt : le build de packages/extension, à côté.
export function bundledExtension() {
    const candidates = [
        fileURLToPath(new URL('../extension', import.meta.url)),
        fileURLToPath(new URL('../../extension/dist', import.meta.url)),
    ];
    const found = candidates.find((dir) => manifestOf(dir));
    if (!found)
        throw new Error('extension not found in the package: run the install command again');
    return found;
}
export function defaultDir() {
    return join(homedir(), 'AimKit', 'extension');
}
function manifestOf(dir) {
    try {
        return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    }
    catch {
        return null;
    }
}
// Remplace le dossier cible par l'extension. Garde-fou : un dossier non vide qui ne contient pas AimKit n'est
// jamais effacé (mauvais --dir).
export function installExtension(source, target) {
    const src = manifestOf(source);
    if (!src?.version)
        throw new Error(`pas d'extension dans ${source}`);
    const dir = resolve(target);
    let previous = null;
    if (existsSync(dir)) {
        const current = manifestOf(dir);
        if (readdirSync(dir).length && current?.name !== EXTENSION_NAME) {
            throw new Error(`${dir} is not empty and does not hold the ${EXTENSION_NAME} extension: nothing was deleted (other folder: --dir)`);
        }
        previous = current?.version ?? null;
        rmSync(dir, { recursive: true, force: true });
    }
    mkdirSync(dir, { recursive: true });
    cpSync(source, dir, { recursive: true });
    return { dir, version: src.version, previous };
}
// Raccourci pour coller un chemin dans la fenêtre de choix de dossier, selon le système.
function pathTip(platform) {
    if (platform === 'darwin')
        return 'in the file picker, press Cmd+Shift+G and paste the path';
    if (platform === 'win32')
        return 'in the file picker, paste the path in the address bar';
    return 'in the file picker, press Ctrl+L and paste the path';
}
export function setupMessage(done, link, platform = process.platform) {
    if (done.previous !== null) {
        return [
            `${EXTENSION_NAME} ${done.version} ${done.previous === done.version ? 'reinstalled' : `installed (was ${done.previous})`} in ${done.dir}`,
            '',
            `In chrome://extensions, click reload on ${EXTENSION_NAME} (or restart Chrome), then restart aimkit in your projects.`,
            ...(link ? ['', 'New token: open this link to pair the extension:', `  ${link}`] : []),
            '',
        ].join('\n');
    }
    return [
        `${EXTENSION_NAME} ${done.version}: extension copied to ${done.dir}`,
        '',
        'Dans Chrome, une seule fois :',
        '  1. Open chrome://extensions and turn on "Developer mode" (top right).',
        '  2. Click "Load unpacked" and choose this folder:',
        `       ${done.dir}`,
        `     (${pathTip(platform)})`,
        '  3. Open this link to pair the extension with aimkit:',
        `       ${link ?? 'aimkit token'}`,
        '',
        'Dans chaque projet :',
        '  aimkit init      une fois : .aimkit.json, .gitignore, skill Claude',
        '  aimkit           keep it running during development',
        '',
        'Optional, so Claude Code reads contexts without pasting a line:',
        '  claude mcp add aimkit -- aimkit mcp',
        '',
    ].join('\n');
}

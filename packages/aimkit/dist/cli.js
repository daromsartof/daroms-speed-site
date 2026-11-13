#!/usr/bin/env node
// aimkit [serve|mcp|init|token|setup] — lancé à la racine du projet (là où tourne Claude Code).
//   serve (défaut)  serveur HTTP local pour l'extension
//   mcp             serveur MCP sur stdio (claude mcp add aimkit -- aimkit mcp)
//   init            .aimkit.json, .gitignore, skill Claude, commande MCP à copier
//   setup           copie l'extension Chrome du paquet dans ~/AimKit/extension (scripts d'installation)
// Options : --root <dossier> --port <n> --origin <url> (répétable) --new-token --yes --quiet --dir <dossier>
import { EXTENSION_ID, VERSION, loadConfig } from './config.js';
import { Locator } from './locate/index.js';
import { loadToken, tokenPath } from './security.js';
import { startServer } from './server.js';
function parse(argv) {
    const a = { command: 'serve', root: process.cwd(), dir: '', port: 0, origins: [], newToken: false, yes: false, quiet: false };
    for (let i = 0; i < argv.length; i++) {
        const v = argv[i];
        const next = () => {
            const n = argv[++i];
            if (n === undefined)
                throw new Error(`missing value after ${v}`);
            return n;
        };
        if (v === 'serve' || v === 'mcp' || v === 'init' || v === 'token' || v === 'setup')
            a.command = v;
        else if (v === '-h' || v === '--help' || v === 'help')
            a.command = 'help';
        else if (v === '-v' || v === '--version')
            a.command = 'version';
        else if (v === '--root')
            a.root = next();
        else if (v === '--dir')
            a.dir = next();
        else if (v === '--port')
            a.port = Number(next());
        else if (v === '--origin')
            a.origins.push(next().replace(/\/+$/, ''));
        else if (v === '--new-token')
            a.newToken = true;
        else if (v === '--yes' || v === '-y')
            a.yes = true;
        else if (v === '--quiet' || v === '-q')
            a.quiet = true;
        else
            throw new Error(`argument inconnu : ${v}`);
    }
    if (a.port && (!Number.isInteger(a.port) || a.port < 1 || a.port > 65535))
        throw new Error('--port invalide');
    return a;
}
const HELP = `aimkit ${VERSION} — bridge between the AimKit Chrome extension and this project, for Claude Code

Usage:
  aimkit             start the bridge (root = current folder)
  aimkit init        prepare the project (.aimkit.json, .gitignore, Claude skill)
  aimkit mcp         stdio MCP server for Claude Code
  aimkit token       print the token and the pairing link
  aimkit setup       install the Chrome extension in ~/AimKit/extension (or --dir)

Options:
  --root <folder>    project root (default: current folder)
  --port <n>         fixed port (default: 7457, else the next free one up to 7466)
  --origin <url>     origin served by this project, e.g. http://localhost:5173 (repeatable)
  --new-token        generate a new token (to enter again in the extension)
  --yes              init: answer yes to everything
  --dir <folder>     setup: extension folder (default: ~/AimKit/extension)
  --quiet            less logging
`;
export function pairingLink(token) {
    return `chrome-extension://${EXTENSION_ID}/options.html#token=${token}`;
}
async function main() {
    const args = parse(process.argv.slice(2));
    if (args.command === 'help') {
        process.stdout.write(HELP);
        return;
    }
    if (args.command === 'version') {
        process.stdout.write(`${VERSION}\n`);
        return;
    }
    if (args.command === 'init') {
        const { init } = await import('./init.js');
        await init(args.root, { origins: args.origins, yes: args.yes });
        return;
    }
    if (args.command === 'setup') {
        const { bundledExtension, defaultDir, installExtension, setupMessage } = await import('./setup.js');
        const done = installExtension(bundledExtension(), args.dir || defaultDir());
        const { token, created } = loadToken();
        // Première installation : le lien fait partie des étapes ; mise à jour : seulement si le jeton est nouveau
        process.stdout.write(setupMessage(done, done.previous === null || created ? pairingLink(token) : null));
        return;
    }
    if (args.command === 'mcp') {
        const { runMcp } = await import('./mcp.js');
        await runMcp(loadConfig(args.root));
        return;
    }
    const { token, created } = loadToken(args.newToken);
    if (args.command === 'token') {
        process.stdout.write(`Jeton : ${token}\nFichier : ${tokenPath()}\nLier l'extension : ${pairingLink(token)}\n`);
        return;
    }
    const cfg = loadConfig(args.root);
    for (const w of cfg.warnings)
        process.stderr.write(`aimkit: ${w}\n`);
    if (args.origins.length)
        cfg.origins = [...new Set([...cfg.origins, ...args.origins])];
    const locator = new Locator(cfg);
    const log = args.quiet ? undefined : (line) => process.stdout.write(`[${new Date().toLocaleTimeString()}] ${line}\n`);
    const running = await startServer(cfg, { token, port: args.port || undefined, locator, log });
    process.stdout.write([
        `aimkit ${VERSION}`,
        `  Project  : ${cfg.name}`,
        `  Root     : ${cfg.root}`,
        `  Address  : http://127.0.0.1:${running.port}`,
        `  Origins  : ${cfg.origins.length ? cfg.origins.join(', ') : 'all (none configured: aimkit init, or --origin)'}`,
        `  Context  : ${cfg.contextDir}/`,
        // Le jeton ne s'affiche que s'il vient d'être tiré (journaux, partage d'écran) : sinon, sur demande
        created
            ? `  Pair the extension (once): ${pairingLink(token)}`
            : `  Token    : ${tokenPath()} (pairing link: aimkit token)`,
        '',
    ].join('\n'));
    const stop = async () => {
        locator.close();
        await running.close();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
main().catch((e) => {
    process.stderr.write(`aimkit: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
});

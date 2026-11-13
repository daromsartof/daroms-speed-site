export const PORT_FIRST = 7457;
export const PORT_LAST = 7466;
// Requête signée (voir security.ts) : date, nonce, signature ; réponse : preuve que le bridge connaît le jeton
export const TS_HEADER = 'x-dtc-ts';
export const NONCE_HEADER = 'x-dtc-nonce';
export const AUTH_HEADER = 'x-dtc-auth';
export const PROOF_HEADER = 'x-dtc-proof';
// Racine du projet visé (encodeURIComponent) : un autre projet qui a repris le port répond 409
export const PROJECT_HEADER = 'x-dtc-project';
export const TOOLS = ['element', 'multi', 'capture', 'console', 'annotate'];

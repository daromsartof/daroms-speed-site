// src/shared/settings.ts
var DOCK_POSITIONS = ["bottom-center", "bottom-right", "top-right", "top-center", "top-left", "bottom-left"];
var DEFAULTS = {
  lang: "fr",
  token: "",
  bridgeMap: {},
  origins: [],
  htmlDepth: 3,
  rulesMax: 24,
  multiMax: 5,
  sourceAttrs: [],
  dockPosition: "bottom-center",
  theme: "auto",
  captureMode: "simple"
};
var KEY = "settings";
async function getSettings() {
  try {
    const got = await chrome.storage.local.get(KEY);
    return normalize(got[KEY]);
  } catch {
    return { ...DEFAULTS };
  }
}
async function setSettings(patch) {
  const next = normalize({ ...await getSettings(), ...patch });
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}
var int = (v, min, max, def) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const map = {};
  if (r.bridgeMap && typeof r.bridgeMap === "object") {
    for (const [origin, root] of Object.entries(r.bridgeMap)) if (typeof root === "string" && root) map[origin] = root;
  }
  return {
    lang: r.lang === "en" ? "en" : "fr",
    token: typeof r.token === "string" ? r.token.trim() : "",
    bridgeMap: map,
    origins: Array.isArray(r.origins) ? r.origins.filter((o) => typeof o === "string") : [],
    htmlDepth: int(r.htmlDepth, 1, 8, DEFAULTS.htmlDepth),
    rulesMax: int(r.rulesMax, 4, 80, DEFAULTS.rulesMax),
    multiMax: int(r.multiMax, 1, 10, DEFAULTS.multiMax),
    sourceAttrs: Array.isArray(r.sourceAttrs) ? r.sourceAttrs.filter((a) => typeof a === "string" && /^[a-z][\w:.-]*$/i.test(a)) : [],
    dockPosition: DOCK_POSITIONS.includes(r.dockPosition) ? r.dockPosition : DEFAULTS.dockPosition,
    theme: r.theme === "light" || r.theme === "dark" ? r.theme : "auto",
    captureMode: r.captureMode === "context" ? "context" : "simple"
  };
}

// src/background/bridge.ts
var PORT_FIRST = false ? 17457 : 7457;
var PORT_LAST = PORT_FIRST + 9;
var TS_HEADER = "x-dtc-ts";
var NONCE_HEADER = "x-dtc-nonce";
var AUTH_HEADER = "x-dtc-auth";
var PROOF_HEADER = "x-dtc-proof";
var PROJECT_HEADER = "x-dtc-project";
var TTL = 1e4;
var ABSENT = { state: "absent", port: 0, name: "", root: "", contextDir: "" };
var encoder = new TextEncoder();
async function hmac(token, parts) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(parts.join("\n"))));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function signedFetch(port, method, path, token, init) {
  const headers = new Headers(init.headers);
  const nonce = crypto.randomUUID().replace(/-/g, "");
  if (token) {
    const ts = String(Date.now());
    headers.set(TS_HEADER, ts);
    headers.set(NONCE_HEADER, nonce);
    headers.set(AUTH_HEADER, await hmac(token, ["dtc1", method, path, port, ts, nonce]));
  }
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { ...init, method, headers, cache: "no-store", redirect: "error" });
  if (res.status === 401) return res;
  if (!token) return null;
  const proof = res.headers.get(PROOF_HEADER) || "";
  return proof && proof === await hmac(token, ["dtc1-reply", port, nonce]) ? res : null;
}
async function probe(port, token) {
  try {
    const res = await signedFetch(port, "GET", "/health", token, { signal: AbortSignal.timeout(800) });
    if (res?.status === 200) return { port, state: "ok", health: await res.json() };
    if (res?.status === 401) return { port, state: "token", health: null };
  } catch {
  }
  return { port, state: "none", health: null };
}
async function scan() {
  const { token } = await getSettings();
  const list = Array.from({ length: PORT_LAST - PORT_FIRST + 1 }, (_, i) => PORT_FIRST + i);
  return (await Promise.all(list.map((p) => probe(p, token)))).filter((p) => p.state !== "none");
}
async function statusFor(origin, refresh = false) {
  const key = `bridge:${origin}`;
  if (!refresh) {
    const cached = (await chrome.storage.session.get(key))[key];
    if (cached && Date.now() - cached.at < TTL) return cached.status;
  }
  const settings = await getSettings();
  const mapped = settings.bridgeMap[origin];
  const probes = await scan();
  const oks = probes.filter((p) => p.state === "ok" && p.health);
  const open = oks.filter((p) => !p.health.origins.length);
  const chosen = oks.find((p) => p.health.origins.includes(origin)) ?? (mapped ? oks.find((p) => p.health.root === mapped) : open.length === 1 ? open[0] : void 0);
  const status = chosen ? { state: "ok", port: chosen.port, name: chosen.health.name, root: chosen.health.root, contextDir: chosen.health.contextDir } : probes.some((p) => p.state === "token") ? { ...ABSENT, state: "token" } : ABSENT;
  await chrome.storage.session.set({ [key]: { status, at: Date.now() } });
  return status;
}
async function forgetStatus() {
  const all = await chrome.storage.session.get(null);
  await chrome.storage.session.remove(Object.keys(all).filter((k) => k.startsWith("bridge:")));
}
async function post(origin, path, body, timeout, retry = true) {
  const status = await statusFor(origin);
  if (status.state !== "ok") return { ok: false, reason: status.state === "token" ? "token" : "bridge" };
  const { token } = await getSettings();
  try {
    const res = await signedFetch(status.port, "POST", path, token, {
      headers: { "content-type": "application/json", [PROJECT_HEADER]: encodeURIComponent(status.root) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout)
    });
    if (res?.status === 409 && retry) {
      await forgetStatus();
      return post(origin, path, body, timeout, false);
    }
    if (!res) {
      await forgetStatus();
      return { ok: false, reason: "proof" };
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) await forgetStatus();
      return { ok: false, reason: err.error || `http ${res.status}` };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    await forgetStatus();
    return { ok: false, reason: e instanceof DOMException && e.name === "TimeoutError" ? "timeout" : "network" };
  }
}

// src/background/capture.ts
var MIN_GAP_MS = 550;
var PAD = 12;
var MIN_W = 320;
var MIN_H = 160;
var MAX_W = 1600;
var PAGE_MAX = 1568;
var EXACT_MAX = 1280;
var queue = Promise.resolve();
var last = 0;
function captureTab(windowId) {
  const run = async () => {
    const wait = last + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      return await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
    } catch (e) {
      if (!/MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/.test(String(e?.message || e))) throw e;
      await new Promise((r) => setTimeout(r, MIN_GAP_MS));
      return await chrome.tabs.captureVisibleTab(windowId, { format: "png" });
    } finally {
      last = Date.now();
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => {
  });
  return next;
}
async function crop(dataUrl, crops, vw, vh) {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const ratio = bitmap.width / vw;
  try {
    return await Promise.all(crops.map(async (c) => {
      if (c.mode === "page") {
        const scale = Math.min(1, PAGE_MAX / Math.max(bitmap.width, bitmap.height));
        return encode(bitmap, 0, 0, bitmap.width, bitmap.height, scale);
      }
      const b = c.box;
      if (b.w < 1 || b.h < 1) return "";
      if (c.mode === "exact") {
        const x02 = Math.max(0, b.x);
        const y02 = Math.max(0, b.y);
        const sw2 = Math.min(bitmap.width - x02 * ratio, (Math.min(vw, b.x + b.w) - x02) * ratio);
        const sh2 = Math.min(bitmap.height - y02 * ratio, (Math.min(vh, b.y + b.h) - y02) * ratio);
        if (sw2 < 4 || sh2 < 4) return "";
        return encode(bitmap, x02 * ratio, y02 * ratio, sw2, sh2, Math.min(1, EXACT_MAX / Math.max(sw2, sh2)));
      }
      const padX = Math.max(PAD, (MIN_W - b.w) / 2);
      const padY = Math.max(PAD, (MIN_H - b.h) / 2);
      const x0 = Math.max(0, Math.round(b.x - padX));
      const y0 = Math.max(0, Math.round(b.y - padY));
      const x1 = Math.min(vw, Math.round(b.x + b.w + padX));
      const y1 = Math.min(vh, Math.round(b.y + b.h + padY));
      if (x1 - x0 < 4 || y1 - y0 < 4) return "";
      const sw = Math.min(bitmap.width, (x1 - x0) * ratio);
      const sh = Math.min(bitmap.height, (y1 - y0) * ratio);
      return encode(bitmap, x0 * ratio, y0 * ratio, sw, sh, Math.min(1, MAX_W / sw));
    }));
  } finally {
    bitmap.close();
  }
}
async function encode(bitmap, sx, sy, sw, sh, scale) {
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  const png = await canvas.convertToBlob({ type: "image/png" });
  return base64(new Uint8Array(await png.arrayBuffer()));
}
function base64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(bin);
}

// src/background/index.ts
async function sendToTab(tabId, msg) {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
    return true;
  } catch {
    return false;
  }
}
async function ensureInjected(tabId) {
  if (await sendToTab(tabId, { type: "ping" })) return true;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["main-world.js"], world: "MAIN" });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  } catch {
    return false;
  }
  for (let i = 0; i < 40; i++) {
    if (await sendToTab(tabId, { type: "ping" })) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}
async function runCommand(tabId, name) {
  const already = await sendToTab(tabId, { type: "ping" });
  if (!await ensureInjected(tabId)) return;
  if (name === "toggle-dock" && !already) return;
  await sendToTab(tabId, { type: "cmd", name });
}
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== void 0) void runCommand(tab.id, "toggle-dock");
});
chrome.commands.onCommand.addListener((command, tab) => {
  const name = command;
  if (!["toggle-picker", "capture-context", "toggle-dock"].includes(name)) return;
  const go = (id) => {
    if (id !== void 0) void runCommand(id, name);
  };
  if (tab?.id !== void 0) go(tab.id);
  else void chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => go(t?.id));
});
async function ensureOffscreen() {
  const has = await chrome.offscreen.hasDocument?.().catch(() => false);
  if (has) return;
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Copier le contexte pour Claude Code quand la page ne peut pas écrire dans le presse-papier."
    });
  } catch (e) {
    if (!String(e).includes("single offscreen")) throw e;
  }
}
async function syncOrigins() {
  const { origins } = await getSettings();
  const granted = [];
  for (const o of origins) {
    const pattern = `${o}/*`;
    if (await chrome.permissions.contains({ origins: [pattern] }).catch(() => false)) granted.push(pattern);
  }
  await chrome.scripting.unregisterContentScripts({ ids: ["dtc-main", "dtc-content"] }).catch(() => {
  });
  if (!granted.length) return;
  await chrome.scripting.registerContentScripts([
    { id: "dtc-main", matches: granted, js: ["main-world.js"], runAt: "document_start", world: "MAIN", persistAcrossSessions: true },
    { id: "dtc-content", matches: granted, js: ["content.js"], runAt: "document_start", persistAcrossSessions: true }
  ]);
}
chrome.permissions.onAdded.addListener(() => {
  void syncOrigins();
});
chrome.permissions.onRemoved.addListener(() => {
  void syncOrigins();
});
chrome.runtime.onInstalled.addListener((details) => {
  void syncOrigins();
  if (details.reason === "install" && true) void chrome.runtime.openOptionsPage();
});
void chrome.storage.session.setAccessLevel?.({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" }).catch(() => {
});
var FRAMED_DOMAINS = [
  "pinterest.com",
  "pinterest.fr",
  "pinterest.ca",
  "pinterest.co.uk",
  "pinterest.de",
  "pinterest.es",
  "pinterest.it",
  "pinterest.pt",
  "pinterest.ch",
  "pinterest.at",
  "pinterest.ie",
  "pinterest.nz",
  "pinterest.com.au",
  "pinterest.com.mx",
  "pinterest.jp",
  "pinterest.co.kr",
  "pinterest.se",
  "pinterest.dk",
  "pinterest.cl",
  "pinterest.ph",
  "dribbble.com"
];
async function allowFraming(tabId) {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId],
    addRules: [{
      id: tabId,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: ["x-frame-options", "content-security-policy"].map((header) => ({ header, operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE }))
      },
      condition: { tabIds: [tabId], requestDomains: FRAMED_DOMAINS, resourceTypes: [chrome.declarativeNetRequest.ResourceType.SUB_FRAME] }
    }]
  });
}
var WAF_URL = "https://dribbble.com/";
var WAF_COOKIE = "aws-waf-token";
var WAF_WAIT_MS = 2e4;
async function wafToken() {
  let c = await chrome.cookies.get({ url: WAF_URL, name: WAF_COOKIE });
  if (!c) c = await fetchWafToken();
  if (!c) return false;
  if (c.sameSite !== "no_restriction") {
    await chrome.cookies.set({
      url: WAF_URL,
      name: c.name,
      value: c.value,
      domain: c.hostOnly ? void 0 : c.domain,
      path: c.path,
      secure: true,
      httpOnly: c.httpOnly,
      sameSite: "no_restriction",
      expirationDate: c.expirationDate
    });
  }
  return true;
}
async function fetchWafToken() {
  const tab = await chrome.tabs.create({ url: `${WAF_URL}shots/popular`, active: false });
  try {
    return await new Promise((resolve) => {
      const done = (c) => {
        clearTimeout(timer);
        chrome.cookies.onChanged.removeListener(seen);
        resolve(c);
      };
      const seen = (info) => {
        if (!info.removed && info.cookie.name === WAF_COOKIE && info.cookie.domain.endsWith("dribbble.com")) done(info.cookie);
      };
      const timer = setTimeout(() => done(null), WAF_WAIT_MS);
      chrome.cookies.onChanged.addListener(seen);
    });
  } finally {
    if (tab.id !== void 0) await chrome.tabs.remove(tab.id).catch(() => {
    });
  }
}
chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] }).catch(() => {
  });
});
var handlers = {
  "bridge:status": (msg) => statusFor(msg.origin, msg.refresh),
  "bridge:locate": async (msg) => {
    const res = await post(msg.origin, "/locate", msg.body, 1800);
    return res.ok ? res.data : null;
  },
  "bridge:save": async (msg) => {
    const res = await post(msg.origin, "/save", msg.body, 6e3);
    return res.ok ? { ok: true, ...res.data } : { ok: false, reason: res.reason };
  },
  "capture": async (msg, sender) => {
    const tab = sender.tab;
    if (!tab?.id || tab.windowId === void 0) return { error: "tab" };
    let dataUrl;
    try {
      dataUrl = await captureTab(tab.windowId);
    } catch (e) {
      const text = String(e.message || e);
      return { error: /activeTab|all_urls/.test(text) ? "permission" : text };
    } finally {
      void sendToTab(tab.id, { type: "capture:hide", hidden: false });
    }
    try {
      return { images: await crop(dataUrl, msg.crops, msg.vw, msg.vh) };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  },
  // Feuille cross-origin que la page cite mais ne peut pas lire (CDN). Le worker a des droits que la page
  // n'a pas : une page publique n'obtient pas par lui une adresse locale ou du réseau privé, et seule une
  // réponse text/css revient.
  "fetch-css": async (msg, sender) => {
    const page = sender.origin || (sender.tab?.url ? new URL(sender.tab.url).origin : "");
    if (!/^https?:\/\//.test(msg.url) || !page) return { error: "url" };
    if (isPrivate(msg.url) && !isPrivate(page)) return { error: "private" };
    try {
      const res = await fetch(msg.url, { credentials: "omit", cache: "force-cache", signal: AbortSignal.timeout(4e3) });
      if (!res.ok) return { error: `http ${res.status}` };
      if (isPrivate(res.url) && !isPrivate(page)) return { error: "private" };
      if (!/^text\/css\b/i.test(res.headers.get("content-type") || "")) return { error: "type" };
      const text = await res.text();
      return text.length > 3e6 ? { error: "size" } : { text };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  },
  "clipboard": async (msg) => {
    try {
      await ensureOffscreen();
      const res = await chrome.runtime.sendMessage({ target: "offscreen", type: "clipboard", text: msg.text });
      return { ok: !!res?.ok };
    } catch {
      return { ok: false };
    }
  },
  "set-token": async (msg) => {
    await setSettings({ token: msg.token });
    await forgetStatus();
    return { ok: true };
  },
  "bridge:list": async () => {
    await forgetStatus();
    return (await scan()).map((p) => ({ port: p.port, state: p.state === "ok" ? "ok" : "token", health: p.health }));
  },
  "sync-origins": async () => {
    await syncOrigins();
    await forgetStatus();
    return { ok: true };
  },
  "open-options": async (msg) => {
    if (msg.hash) await chrome.tabs.create({ url: chrome.runtime.getURL(`options.html#${msg.hash}`) });
    else await chrome.runtime.openOptionsPage();
    return { ok: true };
  },
  "open-shortcuts": async () => {
    await chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    return { ok: true };
  },
  "browse:open": async (msg, sender) => {
    const tabId = sender.tab?.id;
    if (tabId === void 0) return { error: "tab" };
    if (!await chrome.permissions.contains({ origins: ["<all_urls>"] }).catch(() => false)) return { error: "permission" };
    try {
      await allowFraming(tabId);
      if (msg.site === "dribbble" && !await wafToken()) return { error: "verify" };
      return { ok: true };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  },
  "browse:close": async (_msg, sender) => {
    const tabId = sender.tab?.id;
    if (tabId !== void 0) await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] }).catch(() => {
    });
    return { ok: true };
  }
};
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target === "offscreen") return false;
  const handler = handlers[msg.type];
  if (!handler) return false;
  handler(msg, sender).then(sendResponse, () => sendResponse(null));
  return true;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) void forgetStatus();
});
function isPrivate(url) {
  let host;
  try {
    host = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return true;
  }
  if (/^(localhost|0\.0\.0\.0|::1?)$/.test(host) || /\.(localhost|test|local|internal|lan|home\.arpa)$/.test(host)) return true;
  if (/^(127|10)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return /^f[cd][0-9a-f]{2}:/.test(host) || /^fe80:/.test(host);
}

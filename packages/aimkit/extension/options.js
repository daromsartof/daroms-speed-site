"use strict";
(() => {
  // src/shared/messages.ts
  async function ask(msg) {
    try {
      return await chrome.runtime.sendMessage(msg) ?? null;
    } catch {
      return null;
    }
  }

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

  // src/options/options.ts
  var $ = (id) => document.getElementById(id);
  var EN = {
    lead: "Pick an element of your dev page: its HTML, its CSS with file:line and its source are written into the project, and Claude Code reads them.",
    credit: "A tool by",
    setup: "Getting started",
    "step.bridge": "Run the bridge in the project",
    "step.bridge.help": "At the project root, where Claude Code runs:",
    scan: "Search for bridges",
    "step.token": "Link the extension to the bridge",
    "step.token.help": "Open the link printed when the bridge first starts (or by aimkit token), or paste its token. The token is the same for all your projects.",
    token: "Bridge token",
    show: "Show",
    "token.save": "Save the token",
    captures: "Allow screenshots",
    "captures.help": "Element previews need it. Chrome only lets an extension capture the tab with access to all sites, or right after a click on its icon.",
    "captures.allow": "Allow screenshots",
    "step.mcp": "Optional: Claude Code without pasting a line",
    "step.mcp.help": "In the project, once. Then: “look at the last element I picked”.",
    "mcp.copy": "Copy the command",
    settings: "Settings",
    lang: "Language",
    "lang.help": "Interface and context.md",
    theme: "Dock theme",
    "theme.auto": "Same as the system",
    "theme.light": "Light",
    "theme.dark": "Dark",
    position: "Dock position",
    "position.help": "Default; each site keeps its own",
    "pos.bc": "Bottom, centre",
    "pos.bl": "Bottom, left",
    "pos.br": "Bottom, right",
    "pos.tc": "Top, centre",
    "pos.tl": "Top, left",
    "pos.tr": "Top, right",
    htmlDepth: "Abbreviated HTML depth",
    "htmlDepth.help": "Levels of children shown, 1 to 8",
    rulesMax: "CSS rules shown",
    "rulesMax.help": "At most, per element",
    multiMax: "Elements in the basket",
    "multiMax.help": "1 to 10",
    attrs: "Extra source attributes",
    "attrs.help": "One per line, value file:line(:column). Already known: code-inspector-plugin, react-dev-inspector, vite-plugin-vue-inspector, Astro, solid-devtools, data-source.",
    keys: "Shortcuts",
    "key.pick": "pick",
    "key.capture": "capture with context",
    "key.dock": "show the dock",
    "keys.change": "Change shortcuts",
    origins: "Sites where the dock shows up",
    "origins.help": "By default on localhost, 127.0.0.1, *.localhost and *.test. For a staging site, add its origin: Chrome asks for permission. Elsewhere, a click on the extension icon shows it on the current tab.",
    origin: "Origin to add",
    "origin.add": "Add the origin",
    mapping: "Several projects open",
    "mapping.help": "Each project has its bridge. The extension picks the one whose “origins” list contains the site. Otherwise, map the site to a project here: the mapping holds even if the bridge port changes.",
    "map.origin": "Site",
    "map.project": "Project",
    "map.add": "Map"
  };
  var TEXT = {
    fr: {
      saved: "Enregistré",
      tokenSaved: "Jeton du bridge enregistré",
      copied: "Commande copiée",
      searching: "Recherche sur 127.0.0.1, ports 7457 à 7466…",
      noBridge: "Aucun bridge en marche. Lance-le, puis « Rechercher les bridges ».",
      bridgeOk: (n) => `${n} bridge${n > 1 ? "s" : ""} en marche`,
      tokenOk: (names) => `Lié à ${names}`,
      tokenWrong: "Jeton refusé : colle celui affiché par le bridge",
      tokenSet: "Jeton enregistré, vérifié dès qu'un bridge tourne",
      tokenNone: "Aucun jeton enregistré",
      capturesOk: "Autorisées : les aperçus partent avec chaque contexte",
      capturesNo: "Non autorisées : aperçus seulement après un clic sur l'icône de l'extension",
      allOrigins: "tous les sites",
      remove: "Retirer",
      removeLabel: (x) => `Retirer ${x}`,
      tokenLabel: "Refuse le jeton enregistré",
      portLabel: (p) => `Bridge sur le port ${p}`,
      noProject: "Aucun bridge vérifié en marche",
      notRunning: "bridge arrêté"
    },
    en: {
      saved: "Saved",
      tokenSaved: "Bridge token saved",
      copied: "Command copied",
      searching: "Searching 127.0.0.1, ports 7457 to 7466…",
      noBridge: "No bridge running. Start it, then “Search for bridges”.",
      bridgeOk: (n) => `${n} bridge${n > 1 ? "s" : ""} running`,
      tokenOk: (names) => `Linked to ${names}`,
      tokenWrong: "Token refused: paste the one printed by the bridge",
      tokenSet: "Token saved, checked as soon as a bridge runs",
      tokenNone: "No token saved",
      capturesOk: "Allowed: previews go with every context",
      capturesNo: "Not allowed: previews only after a click on the extension icon",
      allOrigins: "all sites",
      remove: "Remove",
      removeLabel: (x) => `Remove ${x}`,
      tokenLabel: "Refuses the saved token",
      portLabel: (p) => `Bridge on port ${p}`,
      noProject: "No verified bridge running",
      notRunning: "bridge stopped"
    }
  };
  var settings;
  var tx = () => TEXT[settings?.lang === "en" ? "en" : "fr"];
  function translate() {
    document.documentElement.lang = settings.lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.dataset.fr === void 0) el.dataset.fr = el.innerHTML;
      if (settings.lang === "en" && EN[el.dataset.i18n]) el.textContent = EN[el.dataset.i18n];
      else el.innerHTML = el.dataset.fr;
    });
  }
  var savedTimer = 0;
  function flash(text) {
    const el = $("saved");
    el.textContent = text;
    clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => {
      el.textContent = "";
    }, 2600);
  }
  async function update(patch, message = tx().saved) {
    settings = await setSettings(patch);
    flash(message);
  }
  function setStep(id, state, text, textId = `${id}-state`) {
    $(id).setAttribute("data-state", state);
    $(textId).textContent = text;
  }
  async function renderBridges() {
    const ul = $("bridges");
    ul.innerHTML = "";
    $("step-bridge-state").textContent = tx().searching;
    const list = await ask({ type: "bridge:list" }) ?? [];
    const ok = list.filter((b) => b.state === "ok" && b.health);
    const refused = list.filter((b) => b.state === "token");
    for (const b of list) {
      const li = document.createElement("li");
      li.className = "item";
      const left = document.createElement("div");
      const name = document.createElement("div");
      name.className = "bridge-name";
      const dot = document.createElement("span");
      dot.className = `dot${b.state === "token" ? " token" : ""}`;
      dot.setAttribute("aria-hidden", "true");
      name.append(dot, b.health ? b.health.name : tx().portLabel(b.port));
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = b.health ? `127.0.0.1:${b.port}, ${b.health.root}, ${b.health.origins.length ? b.health.origins.join(", ") : tx().allOrigins}` : tx().tokenLabel;
      left.append(name, meta);
      li.append(left);
      ul.append(li);
    }
    if (!list.length) setStep("step-bridge", "todo", tx().noBridge);
    else setStep("step-bridge", "done", tx().bridgeOk(list.length));
    if (ok.length) setStep("step-token", "done", tx().tokenOk(ok.map((b) => b.health.name).join(", ")));
    else if (refused.length) setStep("step-token", "warn", tx().tokenWrong);
    else setStep("step-token", "todo", settings.token ? tx().tokenSet : tx().tokenNone);
    projects = new Map(ok.map((b) => [b.health.root, b.health.name]));
    const select = $("map-project");
    select.textContent = "";
    for (const [root, name] of projects) select.add(new Option(`${name} (${root})`, root));
    if (!projects.size) select.add(new Option(tx().noProject, ""));
    select.disabled = !projects.size;
    renderMaps();
  }
  var projects = /* @__PURE__ */ new Map();
  function renderMaps() {
    const ul = $("maps");
    ul.textContent = "";
    for (const [origin, root] of Object.entries(settings.bridgeMap)) {
      const li = document.createElement("li");
      li.className = "item";
      const span = document.createElement("span");
      const code = document.createElement("code");
      code.textContent = origin;
      const name = projects.get(root);
      span.append(code, ` → ${name ? `${name} (${root})` : `${root}, ${tx().notRunning}`}`);
      li.append(span, removeButton(origin, () => {
        const map = { ...settings.bridgeMap };
        delete map[origin];
        void update({ bridgeMap: map }).then(renderMaps);
      }));
      ul.append(li);
    }
  }
  function removeButton(what, run) {
    const del = document.createElement("button");
    del.type = "button";
    del.className = "link";
    del.textContent = tx().remove;
    del.setAttribute("aria-label", tx().removeLabel(what));
    del.addEventListener("click", run);
    return del;
  }
  function originOf(raw) {
    try {
      const u = new URL(raw.trim());
      return /^https?:$/.test(u.protocol) ? u.origin : null;
    } catch {
      return null;
    }
  }
  function renderOrigins() {
    const ul = $("origin-list");
    ul.textContent = "";
    for (const origin of settings.origins) {
      const li = document.createElement("li");
      li.className = "item";
      const code = document.createElement("code");
      code.textContent = origin;
      li.append(code, removeButton(origin, async () => {
        await chrome.permissions.remove({ origins: [`${origin}/*`] }).catch(() => false);
        await update({ origins: settings.origins.filter((o) => o !== origin) });
        await ask({ type: "sync-origins" });
        renderOrigins();
      }));
      ul.append(li);
    }
  }
  async function renderCaptures() {
    const granted = await chrome.permissions.contains({ origins: ["<all_urls>"] }).catch(() => false);
    setStep("captures", granted ? "done" : "todo", granted ? tx().capturesOk : tx().capturesNo, "captures-state");
    $("captures-allow").hidden = granted;
  }
  async function init() {
    settings = await getSettings();
    const m = /token=([\w-]{16,128})/.exec(location.hash);
    if (m) {
      await ask({ type: "set-token", token: m[1] });
      settings = await getSettings();
      history.replaceState(null, "", location.pathname);
      flash(tx().tokenSaved);
    }
    translate();
    const token = $("token");
    token.value = settings.token;
    $("token-show").addEventListener("click", () => {
      token.type = token.type === "password" ? "text" : "password";
    });
    const saveToken = async () => {
      await ask({ type: "set-token", token: token.value.trim() });
      settings = await getSettings();
      flash(tx().tokenSaved);
      void renderBridges();
    };
    $("token-save").addEventListener("click", () => void saveToken());
    token.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void saveToken();
    });
    $("scan").addEventListener("click", () => void renderBridges());
    $("mcp-copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText($("mcp-command").textContent || "").catch(() => {
      });
      flash(tx().copied);
    });
    $("map-add").addEventListener("click", () => {
      const origin = originOf($("map-origin").value);
      const root = $("map-project").value;
      if (!origin || !root) return;
      void update({ bridgeMap: { ...settings.bridgeMap, [origin]: root } }).then(renderMaps);
    });
    $("origin-add").addEventListener("click", async () => {
      const origin = originOf($("origin").value);
      if (!origin) return;
      const granted = await chrome.permissions.request({ origins: [`${origin}/*`] }).catch(() => false);
      if (!granted) return;
      await update({ origins: [.../* @__PURE__ */ new Set([...settings.origins, origin])] });
      await ask({ type: "sync-origins" });
      $("origin").value = "";
      renderOrigins();
    });
    for (const id of ["lang", "theme", "dockPosition"]) {
      const sel = $(id);
      sel.value = String(settings[id]);
      sel.addEventListener("change", async () => {
        await update({ [id]: sel.value });
        if (id === "lang") {
          translate();
          renderMaps();
          renderOrigins();
          void renderBridges();
          void renderCaptures();
        }
      });
    }
    for (const id of ["htmlDepth", "rulesMax", "multiMax"]) {
      const input = $(id);
      input.value = String(settings[id]);
      input.addEventListener("change", async () => {
        await update({ [id]: Number(input.value) });
        input.value = String(settings[id]);
      });
    }
    const attrs = $("sourceAttrs");
    attrs.value = settings.sourceAttrs.join("\n");
    attrs.addEventListener("change", () => void update({ sourceAttrs: attrs.value.split(/\s+/).filter(Boolean) }));
    $("shortcuts").addEventListener("click", () => void ask({ type: "open-shortcuts" }));
    $("captures-allow").addEventListener("click", async () => {
      await chrome.permissions.request({ origins: ["<all_urls>"] }).catch(() => false);
      void renderCaptures();
    });
    if (location.hash === "#captures") $("captures").scrollIntoView({ block: "center" });
    renderMaps();
    renderOrigins();
    void renderCaptures();
    void renderBridges();
  }
  void init();
})();

"use strict";
(() => {
  // src/shared/text.ts
  function clip(text, max, more = "…") {
    return text.length > max ? `${text.slice(0, max - more.length)}${more}` : text;
  }

  // src/main-world/console.ts
  var MAX = 200;
  var ARG_MAX = 500;
  var TEXT_MAX = 4e3;
  var DEPTH_MAX = 3;
  var entries = [];
  var dropped = 0;
  var listener = null;
  var timer = 0;
  var early = true;
  function onConsoleChange(fn) {
    listener = fn;
  }
  function consoleDump() {
    return { entries: entries.slice(), dropped, max: MAX, early, loadedAt: performance.timeOrigin };
  }
  function counts() {
    const c = { errors: 0, warnings: 0, logs: 0 };
    for (const e of entries) {
      if (e.level === "error") c.errors++;
      else if (e.level === "warn") c.warnings++;
      else c.logs++;
    }
    return c;
  }
  function notify() {
    if (!listener || timer) return;
    timer = window.setTimeout(() => {
      timer = 0;
      try {
        listener?.(counts());
      } catch {
      }
    }, 300);
  }
  function push(e) {
    const text = clip(e.text, TEXT_MAX, " […]");
    const last = entries[entries.length - 1];
    if (last && last.level === e.level && last.kind === e.kind && last.text === text && last.where === e.where) {
      last.count++;
      last.time = Date.now();
    } else {
      if (entries.length >= MAX) {
        entries.shift();
        dropped++;
      }
      entries.push({ ...e, text, time: Date.now(), count: 1, href: location.href });
    }
    notify();
  }
  function installConsole(isEarly) {
    early = isEarly;
    for (const level of ["log", "info", "warn", "error", "debug"]) wrapConsole(level);
    bindErrors();
    wrapFetch();
    wrapXhr();
  }
  function wrapConsole(level) {
    const original = console[level];
    if (typeof original !== "function") return;
    const wrapped = function(...args) {
      try {
        const err = args.find((a) => a instanceof Error);
        push({
          level,
          kind: "console",
          text: format(args),
          where: "",
          stack: level === "error" || level === "warn" ? err?.stack ? String(err.stack) : cleanStack(new Error().stack) : ""
        });
      } catch {
      }
      return original.apply(this, args);
    };
    try {
      Object.defineProperty(wrapped, "name", { value: original.name });
    } catch {
    }
    console[level] = wrapped;
  }
  function bindErrors() {
    window.addEventListener("error", (e) => {
      try {
        const t = e.target;
        if (t && t !== window && t.tagName) {
          const url = t.currentSrc || t.src || t.href || "";
          if (!url) return;
          push({ level: "error", kind: "resource", text: `Failed to load: ${t.tagName.toLowerCase()} ${url}`, where: "", stack: "" });
          return;
        }
        const err = e.error;
        push({
          level: "error",
          kind: "js",
          text: e.message || (err ? String(err) : "Unknown error"),
          where: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : "",
          stack: err?.stack ? String(err.stack) : ""
        });
      } catch {
      }
    }, true);
    window.addEventListener("unhandledrejection", (e) => {
      try {
        const r = e.reason;
        const isErr = r instanceof Error;
        push({
          level: "error",
          kind: "promise",
          text: `Uncaught (in promise) ${isErr ? `${r.name}: ${r.message}` : serialize(r, 0)}`,
          where: "",
          stack: isErr && r.stack ? String(r.stack) : ""
        });
      } catch {
      }
    });
    document.addEventListener("securitypolicyviolation", (e) => {
      try {
        push({
          level: "error",
          kind: "csp",
          text: `CSP: "${e.violatedDirective}" blocked ${e.blockedURI || "an inline script"}${e.sample ? ` (${e.sample})` : ""}`,
          where: e.sourceFile ? `${e.sourceFile}:${e.lineNumber}:${e.columnNumber}` : "",
          stack: ""
        });
      } catch {
      }
    });
  }
  function wrapFetch() {
    const original = window.fetch;
    if (typeof original !== "function") return;
    const wrapped = function(input, init) {
      const promise = original.call(this, input, init);
      try {
        const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        promise.then(
          (res) => {
            if (!res.ok && res.type !== "opaque") network(method, url, res.status, "");
          },
          (err) => {
            if (err instanceof DOMException && err.name === "AbortError") return;
            network(method, url, 0, err instanceof Error ? err.message : String(err));
          }
        );
      } catch {
      }
      return promise;
    };
    try {
      Object.defineProperty(wrapped, "name", { value: "fetch" });
    } catch {
    }
    window.fetch = wrapped;
  }
  var XHR_INFO = /* @__PURE__ */ new WeakMap();
  function wrapXhr() {
    const proto = XMLHttpRequest.prototype;
    const open = proto.open;
    const send = proto.send;
    proto.open = function(method, url, ...rest) {
      try {
        XHR_INFO.set(this, { method: String(method).toUpperCase(), url: String(url) });
      } catch {
      }
      return open.call(this, method, url, ...rest);
    };
    proto.send = function(body) {
      try {
        this.addEventListener("loadend", () => {
          const info = XHR_INFO.get(this);
          if (!info) return;
          if (this.status >= 400) network(info.method, info.url, this.status, "");
          else if (this.status === 0 && this.readyState === 4) network(info.method, info.url, 0, "network error");
        });
      } catch {
      }
      return send.call(this, body);
    };
  }
  function network(method, url, status, reason) {
    let short = url;
    try {
      const u = new URL(url, location.href);
      short = u.origin === location.origin ? `${u.pathname}${u.search}` : u.href;
    } catch {
    }
    push({
      level: "error",
      kind: "network",
      text: status ? `[network] ${method} ${short} → ${status}` : `[network] ${method} ${short} → failed (${reason})`,
      where: "",
      stack: ""
    });
  }
  function format(args) {
    const parts = [];
    let i = 0;
    if (typeof args[0] === "string" && args[0].includes("%")) {
      i = 1;
      parts.push(args[0].replace(/%[sdifoOc%]/g, (token) => {
        if (token === "%%") return "%";
        if (i >= args.length) return token;
        const v = args[i++];
        if (token === "%c") return "";
        if (token === "%d" || token === "%i") return String(parseInt(String(v), 10));
        if (token === "%f") return String(parseFloat(String(v)));
        return serialize(v, 0);
      }));
    }
    for (; i < args.length; i++) parts.push(serialize(args[i], 0));
    return parts.join(" ");
  }
  function serialize(v, depth, seen = /* @__PURE__ */ new WeakSet()) {
    if (typeof v === "string") return depth ? JSON.stringify(clip(v, ARG_MAX, " […]")) : clip(v, ARG_MAX, " […]");
    if (typeof v === "function") return `ƒ ${v.name || "anonymous"}()`;
    if (typeof v === "symbol" || typeof v === "bigint") return String(v);
    if (v === null || v === void 0 || typeof v !== "object") return String(v);
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v.nodeType === 1) return tag(v);
    if (seen.has(v)) return "[Circular]";
    if (depth >= DEPTH_MAX) return Array.isArray(v) ? `Array(${v.length})` : "{…}";
    seen.add(v);
    try {
      let out;
      if (Array.isArray(v)) {
        const items = v.slice(0, 20).map((x) => serialize(x, depth + 1, seen));
        if (v.length > 20) items.push(`… +${v.length - 20}`);
        out = `[${items.join(", ")}]`;
      } else if (v instanceof Map) {
        out = `Map(${v.size}) {${[...v.entries()].slice(0, 10).map(([k, x]) => `${serialize(k, depth + 1, seen)} => ${serialize(x, depth + 1, seen)}`).join(", ")}}`;
      } else if (v instanceof Set) {
        out = `Set(${v.size}) {${[...v].slice(0, 10).map((x) => serialize(x, depth + 1, seen)).join(", ")}}`;
      } else {
        const keys = Object.keys(v).slice(0, 20);
        const name = v.constructor && v.constructor !== Object ? `${v.constructor.name} ` : "";
        out = `${name}{${keys.map((k) => {
          let val;
          try {
            val = v[k];
          } catch {
            val = "[getter]";
          }
          return `${k}: ${serialize(val, depth + 1, seen)}`;
        }).join(", ")}${Object.keys(v).length > 20 ? ", …" : ""}}`;
      }
      return clip(out, ARG_MAX, " […]");
    } catch {
      return Object.prototype.toString.call(v);
    }
  }
  function tag(el) {
    const html = el.outerHTML || "";
    const end = html.indexOf(">");
    return clip(end > 0 ? html.slice(0, end + 1) : `<${el.tagName.toLowerCase()}>`, 300);
  }
  function cleanStack(stack) {
    return String(stack || "").split("\n").slice(2).filter((l) => !l.includes("chrome-extension://")).join("\n");
  }

  // src/shared/dom.ts
  function classesOf(el) {
    return Array.from(el.classList).filter((c) => c && !c.startsWith("dtc-"));
  }
  function shortLabel(el) {
    const tag2 = el.localName;
    if (el.id) return `${tag2}#${el.id}`;
    const classes = classesOf(el).slice(0, 2);
    return classes.length ? `${tag2}.${classes.join(".")}` : tag2;
  }
  function ancestor(el) {
    if (el.parentElement) return el.parentElement;
    const root = el.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
  }

  // src/main-world/frameworks.ts
  var UP_MAX = 25;
  var STACK_MAX = 12;
  var FIBER_MAX = 400;
  function inspect(el) {
    const started = performance.now();
    let cur = el;
    for (let depth = 0; cur && depth < UP_MAX; depth++) {
      for (const read of READERS) {
        try {
          const info = read(cur);
          if (info) return { ...info, depth, label: shortLabel(cur) };
        } catch {
        }
        if (performance.now() - started > 100) return null;
      }
      cur = ancestor(cur);
    }
    return null;
  }
  function blank(name) {
    return { name, version: "", component: "", stack: [], file: "", line: 0, column: 0, frame: null, files: [] };
  }
  function readReact(el) {
    const node = el;
    const key = Object.keys(node).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    if (!key) return null;
    const fiber = node[key];
    if (!fiber) return null;
    const info = blank("react");
    info.version = reactVersion();
    const src = fiber._debugSource;
    if (src && src.fileName) {
      info.file = src.fileName;
      info.line = Number(src.lineNumber) || 0;
      info.column = Number(src.columnNumber) || 0;
    } else if (fiber._debugStack) {
      info.frame = firstAppFrame(String(fiber._debugStack.stack || ""));
    }
    const names = [];
    let f = fiber.return;
    for (let i = 0; f && i < FIBER_MAX && names.length < STACK_MAX * 2; i++, f = f.return) {
      const name = componentName(f.type);
      if (name && names[names.length - 1] !== name) names.push(name);
    }
    info.stack = names.slice(0, STACK_MAX).reverse();
    info.component = info.stack[info.stack.length - 1] || "";
    return info;
  }
  function componentName(type) {
    if (!type || typeof type === "string") return "";
    const t = type;
    if (typeof type === "function") return cleanName(String(t.displayName || t.name || ""));
    if (typeof t === "object") {
      if (t.displayName) return cleanName(t.displayName);
      if (t.render) return componentName(t.render);
      if (t.type) return componentName(t.type);
    }
    return "";
  }
  function cleanName(name) {
    return /^[A-Z_$][\w$.]*$/.test(name) && !/^(Fragment|StrictMode|Suspense|Profiler|Provider|Consumer)$/.test(name) ? name : "";
  }
  function reactVersion() {
    try {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const renderers = hook?.renderers;
      if (renderers && renderers.size) return String([...renderers.values()][0]?.version || "");
    } catch {
    }
    return "";
  }
  function firstAppFrame(stack) {
    for (const raw of stack.split("\n")) {
      const line = raw.trim();
      if (!line.startsWith("at ")) continue;
      const m = /^at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line);
      if (!m) continue;
      const url = m[2];
      if (/node_modules|\/\.vite\/deps\/|\/@react-refresh|react-dom|jsx-dev-runtime|jsx-runtime|chrome-extension:|<anonymous>|^native/.test(url)) continue;
      if (!/^(https?|file|webpack|rsc):/.test(url) && !url.startsWith("/")) continue;
      return { url, line: Number(m[3]), column: Number(m[4]) };
    }
    return null;
  }
  function readVue(el) {
    const node = el;
    let inst = node.__vueParentComponent;
    if (inst) {
      const info = blank("vue");
      const app = inst.appContext?.app;
      info.version = String(app?.version || "");
      const names = [];
      const files = [];
      for (let i = 0; inst && i < 60 && names.length < STACK_MAX; i++, inst = inst.parent) {
        const type = inst.type;
        const file = String(type?.__file || "");
        const name = String(type?.__name || type?.name || (file ? basename(file) : ""));
        if (!name) continue;
        names.push(name);
        files.push(file);
      }
      info.stack = names.reverse();
      info.files = files.reverse();
      info.component = info.stack[info.stack.length - 1] || "";
      info.file = info.files[info.files.length - 1] || "";
      return info;
    }
    let vm = node.__vue__;
    if (vm) {
      const info = blank("vue");
      info.version = "2";
      const names = [];
      const files = [];
      for (let i = 0; vm && i < 60 && names.length < STACK_MAX; i++, vm = vm.$parent) {
        const o = vm.$options;
        const file = String(o?.__file || "");
        const name = String(o?.name || o?._componentTag || (file ? basename(file) : ""));
        if (!name) continue;
        names.push(name);
        files.push(file);
      }
      info.stack = names.reverse();
      info.files = files.reverse();
      info.component = info.stack[info.stack.length - 1] || "";
      info.file = info.files[info.files.length - 1] || "";
      return info;
    }
    return null;
  }
  function readSvelte(el) {
    const meta = el.__svelte_meta;
    if (!meta || !meta.loc) return null;
    const info = blank("svelte");
    const v5 = "parent" in meta;
    info.version = v5 ? "5" : "4";
    info.file = String(meta.loc.file || "");
    info.line = Number(meta.loc.line || 0) + (v5 ? 0 : 1);
    info.column = Number(meta.loc.column || 0) + 1;
    const names = [];
    const files = [];
    if (info.file) {
      names.push(basename(info.file));
      files.push(info.file);
    }
    let p = meta.parent;
    for (let i = 0; p && i < 60 && names.length < STACK_MAX; i++, p = p.parent) {
      if (p.type !== "component" && !p.componentTag) continue;
      const file = String(p.file || "");
      if (file && files[files.length - 1] !== file) {
        names.push(basename(file));
        files.push(file);
      }
    }
    info.stack = names.reverse();
    info.files = files.reverse();
    info.component = info.stack[info.stack.length - 1] || "";
    return info;
  }
  function readAngular(el) {
    const ng = window.ng;
    if (!ng || typeof ng.getOwningComponent !== "function") return null;
    let comp = ng.getComponent?.(el) || ng.getOwningComponent(el);
    if (!comp) return null;
    const info = blank("angular");
    info.version = document.querySelector("[ng-version]")?.getAttribute("ng-version") || "";
    const names = [];
    for (let i = 0; comp && i < 40 && names.length < STACK_MAX; i++) {
      names.push(String(comp.constructor?.name || "").replace(/^_+/, ""));
      const host = ng.getHostElement?.(comp);
      const up = host ? ancestor(host) : null;
      comp = up ? ng.getOwningComponent(up) : null;
    }
    info.stack = names.filter(Boolean).reverse();
    info.component = info.stack[info.stack.length - 1] || "";
    return info;
  }
  function readLit(el) {
    const root = el.getRootNode();
    if (!(root instanceof ShadowRoot)) return null;
    const host = root.host;
    if (!host || !("renderRoot" in host) || !host.constructor) return null;
    const info = blank("lit");
    info.component = String(host.constructor.name || host.tagName?.toLowerCase() || "");
    info.stack = [info.component];
    return info;
  }
  var VNODES_MAX = 5e3;
  function readPreact(el) {
    let root = null;
    for (let n = el; n && !root; n = n.parentNode) {
      const k = n.__k;
      if (k && typeof k === "object" && "type" in k && "__e" in k && k.constructor === void 0) root = k;
    }
    if (!root) return null;
    let vnode = null;
    const todo = [root];
    for (let seen = 0; todo.length && seen < VNODES_MAX && !vnode; seen++) {
      const v = todo.pop();
      if (v.__e === el && typeof v.type === "string") vnode = v;
      else if (Array.isArray(v.__k)) {
        for (const c of v.__k) if (c && typeof c === "object") todo.push(c);
      }
    }
    if (!vnode) return null;
    const info = blank("preact");
    const src = vnode.__source;
    if (src?.fileName) {
      info.file = src.fileName;
      info.line = Number(src.lineNumber) || 0;
      info.column = Number(src.columnNumber) || 0;
    }
    const names = [];
    for (let v = vnode.__, i = 0; v && i < FIBER_MAX && names.length < STACK_MAX; v = v.__, i++) {
      const name = typeof v.type === "function" ? cleanName(String(v.type.displayName || v.type.name || "")) : "";
      if (name && names[names.length - 1] !== name) names.push(name);
    }
    info.stack = names.reverse();
    info.component = info.stack[info.stack.length - 1] || "";
    return info;
  }
  var READERS = [readReact, readVue, readSvelte, readAngular, readLit, readPreact];
  function basename(file) {
    return (file.split(/[\\/]/).pop() || file).replace(/\?.*$/, "");
  }

  // src/main-world/index.ts
  function visibleComponents(points) {
    const out = [];
    const started = performance.now();
    const seen = /* @__PURE__ */ new Set();
    for (const p of points.slice(0, 200)) {
      if (performance.now() - started > 100) break;
      const el = document.elementsFromPoint(p.x, p.y).find((e) => !e.closest("[data-dtc-host]") && e !== document.documentElement);
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const info = inspect(el);
      if (!info) continue;
      out.push({ framework: info.name, component: info.component, file: info.file || info.files[info.files.length - 1] || "", line: info.line, label: info.label });
    }
    return out;
  }
  (() => {
    const secret = crypto.randomUUID().replace(/-/g, "");
    const REQ = `dtc:${secret}:req`;
    const RES = `dtc:${secret}:res`;
    const ACK = `dtc:${secret}:ack`;
    const CONSOLE = `dtc:${secret}:console`;
    let acked = false;
    const hello = () => window.dispatchEvent(new CustomEvent("dtc:hello", { detail: secret }));
    const onPing = () => {
      if (!acked) hello();
    };
    window.addEventListener("dtc:ping", onPing);
    window.addEventListener(ACK, () => {
      acked = true;
    }, { once: false });
    const reply = (payload) => {
      window.dispatchEvent(new CustomEvent(RES, { detail: JSON.stringify(payload) }));
    };
    window.addEventListener(REQ, (e) => {
      let req;
      try {
        req = JSON.parse(String(e.detail));
      } catch {
        return;
      }
      try {
        if (req.op === "inspect") {
          const target = e.composedPath()[0];
          reply(target instanceof Element ? inspect(target) : null);
        } else if (req.op === "visible") reply(visibleComponents(req.points));
        else if (req.op === "console") reply(consoleDump());
      } catch {
        reply(null);
      }
    }, true);
    onConsoleChange((counts2) => {
      window.dispatchEvent(new CustomEvent(CONSOLE, { detail: JSON.stringify(counts2) }));
    });
    installConsole(document.readyState === "loading");
    hello();
  })();
})();

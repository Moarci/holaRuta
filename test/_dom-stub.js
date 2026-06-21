/*
 * _dom-stub.js – Minimaler, dependency-freier DOM-/window-Stub für Node.
 *
 * Zweck (Lane L0): app.js + alle Abhängigkeits-Module sind Browser-IIFEs, die
 * sich an window.SC hängen und beim Laden sofort booten (app.js ruft am Ende
 * render() auf und verdrahtet Event-Listener). Damit das in `node --test` ohne
 * echtes DOM läuft, stellt diese Datei ein ausreichend großes document/window-
 * Shim bereit – KEINE Dependencies, kein jsdom.
 *
 * Umfang bewusst klein, aber „echt genug“:
 *   - Ein winziger HTML-Parser baut aus innerHTML einen abfragbaren Elementbaum.
 *   - Element bietet die von app.js/ui.js genutzten APIs: classList, dataset,
 *     get/set/has/removeAttribute, querySelector(All), getElementById, closest,
 *     matches, addEventListener/dispatchEvent (mit Bubbling für Klicks),
 *     appendChild/remove, getBoundingClientRect, focus, value, scrollIntoView …
 *   - localStorage als In-Memory-Map.
 *   - location/history/navigator/matchMedia/requestAnimationFrame als Stubs.
 *
 * Aufruf: in den Tests VOR dem Laden von app.js `require("./_dom-stub.js")`
 * und danach `installModules()` (lädt alle Quelldateien in index.html-Reihenfolge).
 */
"use strict";
const path = require("path");

// ----------------------------------------------------------------------------
// Mini-HTML-Parser: erzeugt einen Elementbaum aus den (gut geformten, doppelt
// gequoteten) Markup-Strings, die ui.js liefert. Kein voller Spec-Parser –
// genug für Tags, Attribute, Text und Selbstschließer.
// ----------------------------------------------------------------------------
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

// Attribute eines Start-Tags parsen: name, name="wert", name='wert', name=wert.
function parseAttrs(str) {
  const attrs = {};
  const re = /([:\w-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(str))) {
    const name = m[1];
    if (!name) continue;
    let val = m[3] != null ? m[3] : m[4] != null ? m[4] : m[5] != null ? m[5] : "";
    attrs[name.toLowerCase()] = decodeEntities(val);
  }
  return attrs;
}

// Liefert eine flache Folge von Tokens.
function tokenize(html) {
  const tokens = [];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[0];
    if (raw.startsWith("<!--") || raw.startsWith("<![")) continue; // Kommentare ignorieren
    if (raw[0] === "<") {
      if (raw[1] === "/") {
        tokens.push({ type: "close", name: raw.slice(2, -1).trim().toLowerCase() });
      } else {
        const inner = raw.slice(1, raw.endsWith("/>") ? -2 : -1);
        const sp = inner.search(/[\s/>]/);
        const name = (sp === -1 ? inner : inner.slice(0, sp)).toLowerCase();
        const attrStr = sp === -1 ? "" : inner.slice(sp);
        tokens.push({
          type: "open", name, attrs: parseAttrs(attrStr),
          selfClose: raw.endsWith("/>") || VOID.has(name),
        });
      }
    } else {
      tokens.push({ type: "text", text: decodeEntities(raw) });
    }
  }
  return tokens;
}

// Tokens -> Kinder-Liste (Element/Textknoten) für ein Eltern-Element.
function parseChildren(html, doc) {
  const tokens = tokenize(html);
  const rootChildren = [];
  const stack = [{ el: null, children: rootChildren }];
  for (const tok of tokens) {
    const top = stack[stack.length - 1];
    if (tok.type === "text") {
      const tn = new TextNode(tok.text, doc);
      tn.parentNode = top.el; // null auf oberster Ebene (Eltern setzt der Aufrufer)
      top.children.push(tn);
    } else if (tok.type === "open") {
      const el = new Element(tok.name, doc);
      for (const k in tok.attrs) el.setAttribute(k, tok.attrs[k]);
      el.parentNode = top.el; // verschachtelte Knoten korrekt verketten (Bubbling!)
      top.children.push(el);
      if (!tok.selfClose) stack.push({ el, children: el.childNodes });
    } else if (tok.type === "close") {
      // bis zum passenden offenen Tag zurückspulen (toleriert fehlerhafte Nesting)
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].el && stack[i].el.tagName.toLowerCase() === tok.name) {
          stack.length = i; // pop bis einschließlich
          break;
        }
      }
    }
  }
  return rootChildren;
}

// ----------------------------------------------------------------------------
// Knoten-Klassen
// ----------------------------------------------------------------------------
class TextNode {
  constructor(text, doc) {
    this.nodeType = 3;
    this.textContent = text;
    this.ownerDocument = doc;
    this.parentNode = null;
  }
  get nodeName() { return "#text"; }
}

class ClassList {
  constructor(el) { this.el = el; }
  _set() { return new Set((this.el._attrs["class"] || "").split(/\s+/).filter(Boolean)); }
  _write(set) { this.el._attrs["class"] = Array.from(set).join(" "); }
  add(...cs) { const s = this._set(); cs.forEach((c) => s.add(c)); this._write(s); }
  remove(...cs) { const s = this._set(); cs.forEach((c) => s.delete(c)); this._write(s); }
  contains(c) { return this._set().has(c); }
  toggle(c, force) {
    const s = this._set();
    const has = s.has(c);
    const on = force === undefined ? !has : !!force;
    if (on) s.add(c); else s.delete(c);
    this._write(s);
    return on;
  }
  get value() { return this.el._attrs["class"] || ""; }
}

let NODE_SEQ = 0;

class Element {
  constructor(tagName, doc) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.ownerDocument = doc;
    this.childNodes = [];
    this.parentNode = null;
    this._attrs = {};
    this._listeners = {};
    this._seq = ++NODE_SEQ;
    this.classList = new ClassList(this);
    this.style = makeStyle();
    this.value = "";
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this._focused = false;
    // dataset als Proxy auf data-* Attribute
    this.dataset = makeDataset(this);
  }

  get nodeType() { return 1; }
  get nodeName() { return this.tagName; }

  // ---- Attribute ----
  setAttribute(name, value) { this._attrs[String(name).toLowerCase()] = String(value); }
  getAttribute(name) {
    const v = this._attrs[String(name).toLowerCase()];
    return v === undefined ? null : v;
  }
  hasAttribute(name) { return this._attrs[String(name).toLowerCase()] !== undefined; }
  removeAttribute(name) { delete this._attrs[String(name).toLowerCase()]; }
  toggleAttribute(name, force) {
    const has = this.hasAttribute(name);
    const on = force === undefined ? !has : !!force;
    if (on) this.setAttribute(name, ""); else this.removeAttribute(name);
    return on;
  }

  get id() { return this._attrs["id"] || ""; }
  set id(v) { this._attrs["id"] = String(v); }
  get className() { return this._attrs["class"] || ""; }
  set className(v) { this._attrs["class"] = String(v); }

  get type() { return this._attrs["type"] || (this.tagName === "INPUT" ? "text" : ""); }

  // ---- Baum ----
  get children() { return this.childNodes.filter((n) => n.nodeType === 1); }
  get firstElementChild() { return this.children[0] || null; }
  get lastElementChild() { const c = this.children; return c[c.length - 1] || null; }

  appendChild(node) {
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i >= 0) this.childNodes.splice(i, 1);
    node.parentNode = null;
    return node;
  }
  insertBefore(node, ref) {
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i >= 0) this.childNodes.splice(i, 0, node); else this.childNodes.push(node);
    node.parentNode = this;
    return node;
  }
  contains(node) {
    let n = node;
    while (n) { if (n === this) return true; n = n.parentNode; }
    return false;
  }
  hasChildNodes() { return this.childNodes.length > 0; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }

  // ---- innerHTML / textContent ----
  set innerHTML(html) {
    this.childNodes = [];
    const kids = parseChildren(String(html), this.ownerDocument);
    for (const k of kids) { k.parentNode = this; this.childNodes.push(k); }
  }
  get innerHTML() { return this.childNodes.map(serialize).join(""); }

  set textContent(text) {
    this.childNodes = [new TextNode(String(text), this.ownerDocument)];
    this.childNodes[0].parentNode = this;
  }
  get textContent() {
    return this.childNodes.map((n) =>
      n.nodeType === 3 ? n.textContent : n.textContent).join("");
  }
  set innerText(text) { this.textContent = text; }
  get innerText() { return this.textContent; }

  insertAdjacentHTML(position, html) {
    const kids = parseChildren(String(html), this.ownerDocument);
    if (position === "afterbegin") {
      for (let i = kids.length - 1; i >= 0; i--) { kids[i].parentNode = this; this.childNodes.unshift(kids[i]); }
    } else if (position === "beforeend") {
      for (const k of kids) { k.parentNode = this; this.childNodes.push(k); }
    } else if (position === "beforebegin" && this.parentNode) {
      const idx = this.parentNode.childNodes.indexOf(this);
      this.parentNode.childNodes.splice(idx, 0, ...kids);
      kids.forEach((k) => (k.parentNode = this.parentNode));
    } else if (position === "afterend" && this.parentNode) {
      const idx = this.parentNode.childNodes.indexOf(this);
      this.parentNode.childNodes.splice(idx + 1, 0, ...kids);
      kids.forEach((k) => (k.parentNode = this.parentNode));
    } else {
      for (const k of kids) { k.parentNode = this; this.childNodes.push(k); }
    }
  }

  // ---- Selektoren ----
  matches(sel) { return matchesSelector(this, sel); }
  closest(sel) {
    let el = this;
    while (el && el.nodeType === 1) {
      if (el.matches(sel)) return el;
      el = el.parentNode;
    }
    return null;
  }
  querySelector(sel) { return queryAll(this, sel, true)[0] || null; }
  querySelectorAll(sel) {
    const list = queryAll(this, sel, false);
    list.forEach = Array.prototype.forEach.bind(list);
    return list;
  }

  // ---- DOM-Effekte (No-Ops bzw. minimal) ----
  focus() { this._focused = true; if (this.ownerDocument) this.ownerDocument._activeElement = this; }
  blur() { this._focused = false; }
  click() { this.dispatchEvent({ type: "click", target: this }); }
  scrollIntoView() { /* no-op */ }
  setSelectionRange() { /* no-op */ }
  select() { /* no-op */ }
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  }
  getContext() { return null; } // <canvas> – Module behandeln null robust
  setProperty() { /* style.setProperty Fallback */ }

  // ---- Events ----
  addEventListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = [])).push(fn);
  }
  removeEventListener(type, fn) {
    const arr = this._listeners[type];
    if (arr) { const i = arr.indexOf(fn); if (i >= 0) arr.splice(i, 1); }
  }
  // Bubbling-Dispatch: vom Ziel bis zur Wurzel.
  dispatchEvent(event) {
    event = event || {};
    if (!event.type) return true;
    event.target = event.target || this;
    let defaultPrevented = false;
    event.preventDefault = event.preventDefault || function () { defaultPrevented = true; };
    event.stopPropagation = event.stopPropagation || function () {};
    let node = this;
    while (node) {
      event.currentTarget = node;
      const arr = node._listeners && node._listeners[event.type];
      if (arr) for (const fn of arr.slice()) { try { fn.call(node, event); } catch (e) { throw e; } }
      node = node.parentNode;
    }
    return !defaultPrevented;
  }
}

function makeStyle() {
  const store = {};
  return new Proxy({
    setProperty(k, v) { store[k] = v; },
    getPropertyValue(k) { return store[k] || ""; },
    removeProperty(k) { delete store[k]; },
  }, {
    get(t, p) { if (p in t) return t[p]; return store[p] || ""; },
    set(t, p, v) { store[p] = v; return true; },
  });
}

function makeDataset(el) {
  return new Proxy({}, {
    get(_t, prop) {
      if (typeof prop !== "string") return undefined;
      const attr = "data-" + prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      const v = el._attrs[attr];
      return v === undefined ? undefined : v;
    },
    set(_t, prop, value) {
      const attr = "data-" + String(prop).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      el._attrs[attr] = String(value);
      return true;
    },
    has(_t, prop) {
      const attr = "data-" + String(prop).replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return el._attrs[attr] !== undefined;
    },
  });
}

// ----------------------------------------------------------------------------
// Serialisierung (innerHTML-Getter)
// ----------------------------------------------------------------------------
function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function serialize(node) {
  if (node.nodeType === 3) {
    return String(node.textContent)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const tag = node.tagName.toLowerCase();
  let attrs = "";
  for (const k in node._attrs) attrs += ` ${k}="${escAttr(node._attrs[k])}"`;
  if (VOID.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${node.childNodes.map(serialize).join("")}</${tag}>`;
}

// ----------------------------------------------------------------------------
// Selektor-Engine (Untermenge: tag, #id, .class, [attr], [attr="v"], Kombis,
// Kommalisten, Nachfahren-Kombinator " "). Reicht für die in app.js genutzten
// Selektoren (z.B. "[data-action]", ".hist-w.is-open", "h2, [data-action='x']").
// ----------------------------------------------------------------------------
function parseSimple(sel) {
  // Ein zusammengesetzter Einzelselektor wie div#a.b[c="d"]
  const out = { tag: null, id: null, classes: [], attrs: [] };
  const re = /([.#]?[\w-]+)|\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(sel))) {
    if (m[2] !== undefined) {
      const am = m[2].match(/^\s*([:\w-]+)\s*(?:([*^$~|]?=)\s*("([^"]*)"|'([^']*)'|([^\]]+)))?\s*$/);
      if (am) {
        const name = am[1].toLowerCase();
        const val = am[4] != null ? am[4] : am[5] != null ? am[5] : am[6] != null ? am[6] : null;
        out.attrs.push({ name, op: am[2] || null, val });
      }
    } else {
      const tok = m[1];
      if (tok[0] === "#") out.id = tok.slice(1);
      else if (tok[0] === ".") out.classes.push(tok.slice(1));
      else out.tag = tok.toLowerCase();
    }
  }
  return out;
}

function matchesSimple(el, simple) {
  if (el.nodeType !== 1) return false;
  if (simple.tag && simple.tag !== "*" && el.tagName.toLowerCase() !== simple.tag) return false;
  if (simple.id && el.getAttribute("id") !== simple.id) return false;
  for (const c of simple.classes) if (!el.classList.contains(c)) return false;
  for (const a of simple.attrs) {
    if (!el.hasAttribute(a.name)) return false;
    if (a.op) {
      const actual = el.getAttribute(a.name) || "";
      if (a.op === "=") { if (actual !== a.val) return false; }
      else if (a.op === "~=") { if (!actual.split(/\s+/).includes(a.val)) return false; }
      else if (a.op === "^=") { if (!actual.startsWith(a.val)) return false; }
      else if (a.op === "$=") { if (!actual.endsWith(a.val)) return false; }
      else if (a.op === "*=") { if (actual.indexOf(a.val) === -1) return false; }
      else if (a.op === "|=") { if (actual !== a.val && !actual.startsWith(a.val + "-")) return false; }
    }
  }
  return true;
}

// Ein Selektor mit Nachfahren-Kombinator (" "). Prüft den letzten Teil gegen el
// und jeden vorherigen Teil gegen einen beliebigen Vorfahren (rechts->links).
function matchesComplex(el, parts) {
  if (!matchesSimple(el, parts[parts.length - 1])) return false;
  let i = parts.length - 2;
  let node = el.parentNode;
  while (i >= 0) {
    let found = false;
    while (node && node.nodeType === 1) {
      if (matchesSimple(node, parts[i])) { found = true; node = node.parentNode; break; }
      node = node.parentNode;
    }
    if (!found) return false;
    i--;
  }
  return true;
}

function matchesSelector(el, selector) {
  for (const part of String(selector).split(",")) {
    const segs = part.trim().split(/\s+/).filter(Boolean);
    if (!segs.length) continue;
    const parts = segs.map(parseSimple);
    if (matchesComplex(el, parts)) return true;
  }
  return false;
}

function descendants(el, acc) {
  for (const c of el.childNodes) {
    if (c.nodeType === 1) { acc.push(c); descendants(c, acc); }
  }
  return acc;
}

function queryAll(root, selector, first) {
  const all = descendants(root, []);
  const out = [];
  for (const el of all) {
    if (matchesSelector(el, selector)) {
      out.push(el);
      if (first) break;
    }
  }
  return out;
}

// ----------------------------------------------------------------------------
// Document
// ----------------------------------------------------------------------------
class Document {
  constructor() {
    this._activeElement = null;
    this.documentElement = new Element("html", this);
    this.body = new Element("body", this);
    this.head = new Element("head", this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this._listeners = {};
    this.title = "";
    this.hidden = false;
    this.visibilityState = "visible";
  }
  get activeElement() { return this._activeElement || this.body; }

  createElement(tag) { return new Element(tag, this); }
  createTextNode(text) { return new TextNode(text, this); }
  createDocumentFragment() { return new Element("#fragment", this); }

  getElementById(id) {
    const all = descendants(this.documentElement, []);
    for (const el of all) if (el.getAttribute("id") === id) return el;
    return null;
  }
  querySelector(sel) {
    return queryAll(this.documentElement, sel, true)[0] || null;
  }
  querySelectorAll(sel) {
    const list = queryAll(this.documentElement, sel, false);
    list.forEach = Array.prototype.forEach.bind(list);
    return list;
  }
  getElementsByTagName(tag) {
    const want = String(tag).toLowerCase();
    return descendants(this.documentElement, []).filter(
      (e) => want === "*" || e.tagName.toLowerCase() === want);
  }

  addEventListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = [])).push(fn);
  }
  removeEventListener(type, fn) {
    const arr = this._listeners[type];
    if (arr) { const i = arr.indexOf(fn); if (i >= 0) arr.splice(i, 1); }
  }
  dispatchEvent(event) {
    const arr = this._listeners[event.type];
    if (arr) for (const fn of arr.slice()) fn.call(this, event);
    return true;
  }
}

// ----------------------------------------------------------------------------
// localStorage (In-Memory-Map)
// ----------------------------------------------------------------------------
function makeLocalStorage() {
  const map = new Map();
  return {
    getItem(k) { return map.has(String(k)) ? map.get(String(k)) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(String(k)); },
    clear() { map.clear(); },
    key(i) { return Array.from(map.keys())[i] || null; },
    get length() { return map.size; },
  };
}

// ----------------------------------------------------------------------------
// window/global-Stubs zusammenbauen und installieren
// ----------------------------------------------------------------------------
function makeMatchMedia() {
  return function (query) {
    return {
      media: query,
      matches: false,
      addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {},
      onchange: null,
    };
  };
}

function install() {
  const document = new Document();
  // Appshell wie in index.html: #app (Controller-Mountpunkt) + Wortmarke.
  const appbarName = document.createElement("div");
  appbarName.className = "appbar__name";
  const main = document.createElement("main");
  main.setAttribute("id", "app");
  document.body.appendChild(appbarName);
  document.body.appendChild(main);
  // theme-color-Meta (applyTheme sucht danach).
  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.setAttribute("content", "#241510");
  document.head.appendChild(meta);

  const location = {
    href: "http://localhost/", protocol: "http:", host: "localhost",
    hostname: "localhost", port: "", pathname: "/", search: "", hash: "",
    origin: "http://localhost", reload() {}, assign() {}, replace() {},
    toString() { return this.href; },
  };

  const history = {
    state: null, length: 1,
    pushState(s) { this.state = s; this.length++; },
    replaceState(s) { this.state = s; },
    back() {}, forward() {}, go() {},
  };

  const navigator = {
    userAgent: "node-test", language: "de-DE", languages: ["de-DE", "de"],
    maxTouchPoints: 0, onLine: true,
    vibrate() { return true; },
    clipboard: { writeText() { return Promise.resolve(); }, readText() { return Promise.resolve(""); } },
    storage: { persist() { return Promise.resolve(true); }, persisted() { return Promise.resolve(true); } },
    // serviceWorker bewusst NICHT vorhanden -> registerServiceWorker() bricht früh ab
    getInstalledRelatedApps: undefined,
  };

  const win = globalThis.window || {};
  Object.assign(win, {
    document, location, history, navigator,
    localStorage: makeLocalStorage(),
    sessionStorage: makeLocalStorage(),
    matchMedia: makeMatchMedia(),
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    scrollTo() {}, scroll() {}, scrollBy() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    requestAnimationFrame(fn) { return setTimeout(() => fn(Date.now()), 0); },
    cancelAnimationFrame(id) { clearTimeout(id); },
    getComputedStyle() { return { getPropertyValue() { return ""; } }; },
    visualViewport: null,
    speechSynthesis: null, // speech.js erkennt fehlende TTS und schaltet zurück
    SpeechSynthesisUtterance: undefined,
    AudioContext: undefined, webkitAudioContext: undefined,
    IntersectionObserver: undefined, // app.js hat Fallback (reine Anker-Sprünge)
    URL: typeof URL !== "undefined" ? URL : undefined,
    URLSearchParams: typeof URLSearchParams !== "undefined" ? URLSearchParams : undefined,
    setTimeout, clearTimeout, setInterval, clearInterval,
    console,
  });
  win.window = win;
  win.globalThis = win;
  win.self = win;

  // Im Browser legt `window.SC = …` zugleich das Global `SC` an; app.js liest
  // teils bare `SC.xyz`. Wir spiegeln dasselbe Objekt nach globalThis.SC, damit
  // bare-Referenzen in den Modulen aufgehen.
  if (!win.SC) win.SC = {};

  // Manche Globals (navigator, location) sind in Node nur Getter -> per
  // defineProperty robust überschreiben. Bare-Referenzen in den App-Modulen
  // (z.B. `navigator.vibrate`) lösen so gegen unsere Stubs auf.
  function setGlobal(name, value) {
    try { globalThis[name] = value; }
    catch (e) {
      try { Object.defineProperty(globalThis, name, { value, writable: true, configurable: true }); }
      catch (e2) { /* unveränderbar – Modul nutzt im Zweifel typeof-Guards */ }
    }
  }
  setGlobal("window", win);
  setGlobal("document", document);
  setGlobal("location", location);
  setGlobal("history", history);
  setGlobal("navigator", navigator);
  setGlobal("localStorage", win.localStorage);
  setGlobal("sessionStorage", win.sessionStorage);
  setGlobal("matchMedia", win.matchMedia);
  setGlobal("SC", win.SC);
  if (typeof globalThis.requestAnimationFrame !== "function") {
    setGlobal("requestAnimationFrame", win.requestAnimationFrame);
    setGlobal("cancelAnimationFrame", win.cancelAnimationFrame);
  }
  if (typeof globalThis.getComputedStyle !== "function") setGlobal("getComputedStyle", win.getComputedStyle);

  return win;
}

// Lädt alle App-Module in der Reihenfolge von index.html (Zeilen 171-216).
// app.js bootet beim Laden (verdrahtet Listener, ruft render()).
function installModules() {
  const SRC = path.join(__dirname, "..");
  const order = [
    "editions/registry.js", "config.js", "i18n.js", "i18n.strings.js",
    "contextdata.js", "data.js", "numbers.js", "context.js", "countries.js",
    "historia.js", "historiaCentro.js", "knigge.js", "frases.js", "dialogos.js",
    "conjug.js", "regatear.js", "logistica.js", "salud.js", "fotografia.js",
    "flirt.js", "bailar.js", "musica.js", "bebidas.js", "yesto.js", "srs.js",
    "store.js", "net.js", "sync.js", "social.js", "usercards.js", "matcher.js",
    "placement.js", "assessment.js", "search.js", "stats.js", "badges.js",
    "speech.js", "share.js", "qr.js", "install.js", "changelog.js",
    "celebrate.js", "view-helpers.js", "ui.js", "features/spickzettel.js", "features/definiciones.js", "features/precios.js", "features/yesto-game.js", "features/frases-game.js", "features/conjugador.js", "features/tiempos.js", "features/regateo.js", "features/cuerpo.js", "features/compras.js", "app.js",
  ];
  for (const rel of order) {
    require(path.join(SRC, rel));
    // i18n.js legt `window.t` an (im Browser zugleich Global `t`); app.js ruft
    // bare `t(...)` schon beim Boot. Nach jedem Modul spiegeln, sobald vorhanden.
    if (typeof globalThis.window.t === "function" && globalThis.t !== globalThis.window.t) {
      try { globalThis.t = globalThis.window.t; }
      catch (e) { Object.defineProperty(globalThis, "t", { value: globalThis.window.t, writable: true, configurable: true }); }
    }
  }
  return globalThis.window.SC;
}

// Markiert die App als „onboarded“ (+ Modus), damit installModules() direkt ins
// Dashboard bootet statt ins Onboarding. VOR installModules() aufrufen.
function seedOnboarded(extra) {
  const settings = Object.assign({ onboarded: true, mode: "flip" }, extra || {});
  globalThis.window.localStorage.setItem(
    "spanischcard.settings.v1", JSON.stringify(settings));
}

module.exports = { install, installModules, seedOnboarded, Element, Document };

// Beim ersten require automatisch das DOM-Shim setzen (vor dem Modul-Laden).
install();

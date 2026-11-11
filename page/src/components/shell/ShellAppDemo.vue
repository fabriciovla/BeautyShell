<script setup>

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { agents, fonts, getShellApp, prompt, shells } from "./ShellAppData.js";

const props = defineProps({ lang: { type: String, required: true } });
const D = getShellApp(props.lang);
const say = D.say;

const icons = {
  terminal: "m4 17 6-6-6-6M12 19h8",
  sparkle: "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.4 3.7 5.4 3.7 9s-1.2 6.6-3.7 9c-2.5-2.4-3.7-5.4-3.7-9S9.5 5.4 12 3z",
  folder: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  chevron: "m9 18 6-6-6-6",
  plus: "M5 12h14M12 5v14",
  close: "M18 6 6 18M6 6l12 12",
  gear: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  sidebar: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18",
  back: "m15 18-6-6 6-6",
  forward: "m9 18 6-6-6-6",
  reload: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5",
  palette: "M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22zM7.5 11.5h.01M10.5 7.5h.01M15.5 8.5h.01",
  bot: "M12 8V4H8M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM2 14h2M20 14h2M9 13v2M15 13v2",
  keyboard: "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  check: "M20 6 9 17l-5-5",
  minus: "M5 12h14",
};

const look = reactive({ theme: "light", windowBg: "acrylic", termBg: "pure", font: "JetBrains Mono", size: 13, shell: "pwsh", cursor: "bar", blink: true, suggest: true });
const ui = reactive({ pinned: true, peek: false, settings: false, section: "appearance", palette: false });
const shellName = (id) => shells.find((s) => s.id === id)?.name ?? "PowerShell";
const shortShell = (id) => ({ pwsh: "PowerShell", powershell: "PowerShell", cmd: "cmd", bash: "Git Bash", wsl: "Ubuntu" })[id];

let nextId = 1;
const history = [...D.history];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function makePane(folder, shell = look.shell) {
  return reactive({ id: nextId++, kind: "term", folder, shell, lines: [], typed: "", state: "prompt", mode: "shell", hist: -1, title: shortShell(shell) });
}
function makeTab(folder, opts = {}) {
  return reactive({ id: nextId++, title: opts.title ?? shortShell(look.shell), icon: opts.icon ?? "terminal", sub: "", status: "idle", dir: "row", panes: [makePane(folder)] });
}

const tabs = reactive([]);
const activeId = ref(0);
const focusedId = ref(0);
const collapsed = reactive(new Set());
const active = computed(() => tabs.find((t) => t.id === activeId.value));
const focused = computed(() => active.value?.panes.find((p) => p.id === focusedId.value) ?? active.value?.panes[0]);
const tabFolder = (tab) => tab.panes[0]?.folder ?? "~";
const folders = computed(() => [...new Set(tabs.map(tabFolder))]);
const tabsIn = (folder) => tabs.filter((t) => tabFolder(t) === folder);
const ordered = computed(() => folders.value.flatMap(tabsIn));
const isShut = (folder) => collapsed.has(folder);

const line = (pane, html) => {
  pane.lines.push({ id: nextId++, html });
  if (pane.lines.length > 200) pane.lines.splice(0, pane.lines.length - 200);
  scrollDown(pane);
};
const lines = (pane, list) => list.forEach((h) => line(pane, h));
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
const termEls = new Map();
const setTerm = (id) => (el) => (el ? termEls.set(id, el) : termEls.delete(id));
function scrollDown(pane) {
  nextTick(() => {
    const el = termEls.get(pane.id);
    if (el) el.scrollTop = el.scrollHeight;
  });
}
const tabOf = (pane) => tabs.find((t) => t.panes.includes(pane));

function activate(tab, pane) {
  if (!tab) return;
  activeId.value = tab.id;
  focusedId.value = (pane ?? tab.panes.find((p) => p.kind === "term") ?? tab.panes[0]).id;
  if (tab.status === "done") tab.status = "idle";
  ui.peek = false;
  focusKeys();
}

function newTab(folder = active.value ? tabFolder(active.value) : D.folders[0]) {
  const tab = makeTab(folder);
  const last = tabs.findLastIndex((t) => tabFolder(t) === folder);
  tabs.splice(last < 0 ? tabs.length : last + 1, 0, tab);
  collapsed.delete(folder);
  activate(tab);
}

function closeTab(tab) {
  const i = ordered.value.indexOf(tab);
  tabs.splice(tabs.indexOf(tab), 1);
  if (!tabs.length) return newTab(D.folders[0]);
  if (tab.id === activeId.value) activate(ordered.value[Math.min(i, ordered.value.length - 1)]);
}

function closePane(pane) {
  const tab = tabOf(pane);
  if (!tab) return;
  if (tab.panes.length === 1) return closeTab(tab);
  tab.panes.splice(tab.panes.indexOf(pane), 1);
  if (focusedId.value === pane.id) focusedId.value = tab.panes[0].id;
  refreshTab(tab);
}

function split(dir) {
  const tab = active.value;
  if (!tab || tab.panes.length >= 3) return;
  tab.dir = tab.panes.length === 1 ? dir : tab.dir;
  const pane = makePane(focused.value?.folder ?? tabFolder(tab));
  tab.panes.push(pane);
  focusedId.value = pane.id;
  focusKeys();
}

function refreshTab(tab) {
  const main = tab.panes.find((p) => p.kind === "term") ?? tab.panes[0];
  if (main.mode === "claude") {
    tab.icon = "sparkle";
    tab.title = "Claude Code";
    tab.status = main.state === "busy" ? "busy" : "waiting";
    tab.sub = main.state === "busy" ? say.working : say.waiting;
  } else if (main.kind === "browser") {
    tab.icon = "globe";
    tab.title = main.url;
    tab.status = "idle";
    tab.sub = "";
  } else {
    tab.icon = "terminal";
    tab.title = main.title;
    tab.status = main.state === "busy" ? "busy" : main.state === "running" ? "busy" : tab.status === "done" ? "done" : "idle";
    tab.sub = main.state === "running" ? main.running : "";
  }
}

async function run(pane, text) {
  const cmd = text.trim();
  line(pane, `<span class="ps">${prompt(pane.shell, pane.folder)}</span> ${esc(cmd)}`);
  pane.typed = "";
  pane.hist = -1;
  if (cmd && history[history.length - 1] !== cmd) history.push(cmd);
  if (!cmd) return;
  const tab = tabOf(pane);
  const [name, ...args] = cmd.split(/\s+/);
  const word = name.toLowerCase();

  if (word === "clear" || word === "cls") pane.lines.splice(0);
  else if (word === "help" || word === "ayuda") lines(pane, D.help);
  else if (word === "ls" || word === "dir" || word === "get-childitem") lines(pane, D.ls(pane.folder, pane.shell));
  else if (word === "echo" || word === "write-host") line(pane, esc(args.join(" ")));
  else if (word === "whoami") line(pane, pane.shell === "pwsh" || pane.shell === "powershell" || pane.shell === "cmd" ? "pc\\ana" : "ana");
  else if (word === "pwd") line(pane, pane.shell === "bash" || pane.shell === "wsl" ? `/home/ana/${pane.folder}` : `C:\\Users\\ana\\${esc(pane.folder)}`);
  else if (word === "date" || word === "get-date") line(pane, esc(new Date().toLocaleString(props.lang === "es" ? "es-AR" : "en-US", { dateStyle: "full", timeStyle: "short" })));
  else if (word === "exit") return closePane(pane);
  else if (word === "cd" || word === "set-location") {
    const to = (args[0] ?? "").replace(/[\\/]+$/, "");
    if (!to || to === "~") return;
    pane.folder = to === ".." ? "~" : to.split(/[\\/]/).pop();

    if (tab) collapsed.delete(tabFolder(tab));
  } else if (word === "git" && args[0] === "status") lines(pane, D.gitStatus);
  else if (word === "git" && args[0] === "log") lines(pane, D.gitLog);
  else if (word === "npm" || word === "pnpm" || word === "yarn") {
    if (args[0] === "run" || args[0] === "dev" || args[0] === "start") {
      pane.state = "running";
      pane.running = cmd;
      if (tab) refreshTab(tab);
      for (const h of D.devServer(pane.folder)) {
        line(pane, h);
        await wait(70);
      }
      return;
    }
    line(pane, '<span class="c-faint">up to date, audited 214 packages in 1s</span>');
  } else if (word === "claude") {
    pane.mode = "claude";
    pane.state = "prompt";
    line(pane, `<span class="cc-box"><span class="c-accent">✻</span> ${props.lang === "es" ? "¡Te damos la bienvenida a" : "Welcome to"} <span class="c-bold">Claude Code</span>!<br><br><span class="c-faint">  /help ${props.lang === "es" ? "para ayuda" : "for help"} · cwd: ~\\${esc(pane.folder)}</span></span>`);
    line(pane, "");
  } else line(pane, D.notFound(esc(name), pane.shell));
  if (tab) refreshTab(tab);
}

async function ask(pane, text) {
  const q = text.trim();
  pane.typed = "";
  if (!q) return;
  if (q === "/exit" || q === "exit") {
    pane.mode = "shell";
    line(pane, `<span class="c-faint">&gt; ${esc(q)}</span>`);
    return refreshTab(tabOf(pane));
  }
  line(pane, `<span class="cc-you">&gt; ${esc(q)}</span>`);
  pane.state = "busy";
  refreshTab(tabOf(pane));
  for (const tool of D.claudeTools) {
    await wait(520);
    line(pane, `<span class="c-green">●</span> <span class="c-bold">${tool.split("(")[0]}</span>(${tool.split("(")[1]}`);
  }
  await wait(600);
  line(pane, `<span class="c-accent">●</span> ${esc(D.claudeAnswer(q))}`);
  line(pane, "");
  pane.state = "prompt";
  const tab = tabOf(pane);
  if (tab) {
    refreshTab(tab);
    if (tab !== active.value) tab.status = "waiting";
  }
}

function openLink(pane, url) {
  const tab = tabOf(pane);
  if (!tab) return;
  const open = tab.panes.find((p) => p.kind === "browser");
  if (open) {
    open.url = url;
    focusedId.value = open.id;
    return;
  }
  if (tab.panes.length >= 3) return;
  const browser = reactive({ id: nextId++, kind: "browser", url, folder: pane.folder, title: url });
  tab.dir = tab.panes.length === 1 ? "row" : tab.dir;
  tab.panes.push(browser);
  focusedId.value = browser.id;
}
function onTermClick(pane, e) {
  const link = e.target.closest?.(".link");
  if (link) return openLink(pane, link.dataset.url);
  focusedId.value = pane.id;
  focusKeys();
}

const keys = ref();
const typing = ref(false);
function focusKeys() {
  nextTick(() => keys.value?.focus({ preventScroll: true }));
}
const ghost = computed(() => {
  const pane = focused.value;
  if (!look.suggest || !pane || pane.kind !== "term" || pane.mode !== "shell" || pane.state !== "prompt" || !pane.typed) return "";
  const hit = [...history].reverse().find((h) => h.startsWith(pane.typed) && h !== pane.typed);
  return hit ? hit.slice(pane.typed.length) : "";
});
function onInput() {
  const pane = focused.value;
  if (!pane || pane.kind !== "term" || pane.state !== "prompt") {
    keys.value.value = "";
    return;
  }
  pane.typed = keys.value.value;
}
function setTyped(pane, text) {
  pane.typed = text;
  keys.value.value = text;
}

function onKey(e) {
  const k = e.key.toLowerCase();

  if (e.ctrlKey && e.shiftKey && k === "p") return stop(e, togglePalette());
  if (e.ctrlKey && e.shiftKey && k === "d") return stop(e, split("row"));
  if (e.ctrlKey && e.shiftKey && k === "e") return stop(e, split("col"));
  if (e.ctrlKey && e.shiftKey && k === "b") return stop(e, (ui.pinned = !ui.pinned));
  if (e.ctrlKey && e.shiftKey && k === "w") return stop(e, active.value && closeTab(active.value));
  if (e.ctrlKey && k === ",") return stop(e, (ui.settings = !ui.settings));
  if (e.altKey && /^[1-8]$/.test(e.key)) return stop(e, activate(ordered.value[+e.key - 1]));
  if (e.key === "Escape" && (ui.settings || ui.palette)) return stop(e, (ui.palette = false), (ui.settings = false));
  if (e.target !== keys.value) return;

  const pane = focused.value;
  if (!pane || pane.kind !== "term") return;
  if (e.ctrlKey && k === "c") {
    e.preventDefault();
    if (pane.state === "running") {
      line(pane, "^C");
      pane.state = "prompt";
      refreshTab(tabOf(pane));
    } else if (pane.state === "prompt") {
      line(pane, `<span class="ps">${prompt(pane.shell, pane.folder)}</span> ${esc(pane.typed)}<span class="c-faint">^C</span>`);
      setTyped(pane, "");
    }
    return;
  }
  if (e.ctrlKey && k === "l") {
    e.preventDefault();
    pane.lines.splice(0);
    return;
  }
  if (pane.state !== "prompt") return;
  if (e.key === "Enter") {
    e.preventDefault();
    const text = pane.typed;
    keys.value.value = "";
    if (pane.mode === "claude") ask(pane, text);
    else run(pane, text);
  } else if ((e.key === "ArrowRight" || e.key === "End" || e.key === "Tab") && ghost.value && keys.value.selectionStart === pane.typed.length) {
    e.preventDefault();
    setTyped(pane, pane.typed + ghost.value);
  } else if (e.key === "Tab") {
    e.preventDefault();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const n = history.length;
    pane.hist = e.key === "ArrowUp" ? (pane.hist < 0 ? n - 1 : Math.max(0, pane.hist - 1)) : pane.hist < 0 ? -1 : pane.hist + 1;
    if (pane.hist >= n) pane.hist = -1;
    setTyped(pane, pane.hist < 0 ? "" : history[pane.hist]);
  }
}
function stop(e) {
  e.preventDefault();
  e.stopPropagation();
}

const stageEl = ref();
const drag = reactive({ tab: null, on: false, x: 0, y: 0, side: null });
let dragStart = null;
function onTabDown(tab, e) {
  if (e.button !== 0 || e.target.closest("button")) return;
  dragStart = { tab, x: e.clientX, y: e.clientY };
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd, { once: true });
}
function onDragMove(e) {
  if (!dragStart) return;
  if (!drag.on && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) < 6) return;
  drag.on = true;
  drag.tab = dragStart.tab;
  const root = win.value.getBoundingClientRect();
  drag.x = e.clientX - root.left;
  drag.y = e.clientY - root.top;
  const r = stageEl.value.getBoundingClientRect();
  const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
  if (!inside || drag.tab === active.value) return (drag.side = null);
  const dx = (e.clientX - r.left) / r.width, dy = (e.clientY - r.top) / r.height;
  const near = [["left", dx], ["right", 1 - dx], ["top", dy], ["bottom", 1 - dy]].sort((a, b) => a[1] - b[1])[0][0];
  drag.side = near;
}
function onDragEnd() {
  window.removeEventListener("pointermove", onDragMove);
  const { tab, side, on } = drag;
  const target = active.value;
  if (on && side && tab && target && tab !== target && target.panes.length + tab.panes.length <= 3) {
    target.dir = side === "left" || side === "right" ? "row" : "col";
    const moving = [...tab.panes];
    tabs.splice(tabs.indexOf(tab), 1);
    if (side === "left" || side === "top") target.panes.unshift(...moving);
    else target.panes.push(...moving);
    focusedId.value = moving[0].id;
    refreshTab(target);
  } else if (!on && dragStart) activate(dragStart.tab);
  Object.assign(drag, { tab: null, on: false, side: null });
  dragStart = null;
}

const pal = reactive({ q: "", i: 0 });
const palInput = ref();
const paletteItems = computed(() => {
  const a = say.actions;
  const list = [
    { label: a.newTerminal, hint: "Ctrl T", run: () => newTab() },
    { label: a.splitRight, hint: "Ctrl Shift D", run: () => split("row") },
    { label: a.splitDown, hint: "Ctrl Shift E", run: () => split("col") },
    { label: a.toggleSidebar, hint: "Ctrl Shift B", run: () => (ui.pinned = !ui.pinned) },
    { label: look.theme === "light" ? a.dark : a.light, run: () => (look.theme = look.theme === "light" ? "dark" : "light") },
    { label: a.clear, hint: "Ctrl L", run: () => focused.value?.lines?.splice(0) },
    { label: a.settings, hint: "Ctrl ,", run: () => (ui.settings = true) },
    ...ordered.value.map((t) => ({ label: t.title, detail: `~\\${tabFolder(t)}`, run: () => activate(t) })),
  ];
  const q = pal.q.trim().toLowerCase();
  return q ? list.filter((x) => `${x.label} ${x.detail ?? ""}`.toLowerCase().includes(q)) : list;
});
function togglePalette() {
  ui.palette = !ui.palette;
  pal.q = "";
  pal.i = 0;
  if (ui.palette) nextTick(() => palInput.value?.focus());
  else focusKeys();
}
function onPaletteKey(e) {
  if (e.key === "ArrowDown") stop(e, (pal.i = Math.min(pal.i + 1, paletteItems.value.length - 1)));
  else if (e.key === "ArrowUp") stop(e, (pal.i = Math.max(pal.i - 1, 0)));
  else if (e.key === "Enter") stop(e, choose(paletteItems.value[pal.i]));
  else if (e.key === "Escape") stop(e, togglePalette());
}
function choose(item) {
  if (!item) return;
  ui.palette = false;
  item.run();
  focusKeys();
}

const dotIndex = computed(() => ordered.value.indexOf(active.value));

const win = ref();
let seen;
async function type(pane, text) {
  for (const ch of text) {
    pane.typed += ch;
    await wait(45 + Math.random() * 40);
  }
  await wait(250);
}
async function intro() {
  const first = tabs[0].panes[0];
  await wait(500);
  await type(first, "npm run dev");
  run(first, first.typed);
}
onMounted(() => {
  const a = makeTab("beauty-shell");
  const c = makeTab("beauty-shell");
  const g = makeTab("beauty-shell");
  const s = makeTab("sitio-web");
  tabs.push(a, c, g, s);

  const cp = c.panes[0];
  cp.mode = "claude";
  line(cp, `<span class="cc-box"><span class="c-accent">✻</span> ${props.lang === "es" ? "¡Te damos la bienvenida a" : "Welcome to"} <span class="c-bold">Claude Code</span>!<br><br><span class="c-faint">  /help ${props.lang === "es" ? "para ayuda" : "for help"} · cwd: ~\\beauty-shell</span></span>`);
  line(cp, "");
  line(cp, `<span class="cc-you">&gt; ${props.lang === "es" ? "Hacé que la demo de la web sea interactiva" : "Make the website demo interactive"}</span>`);
  line(cp, '<span class="c-green">●</span> <span class="c-bold">Edit</span>(page/src/components/shell/ShellAppDemo.vue)');
  line(cp, `<span class="c-accent">●</span> ${esc(D.claudeAnswer("demo"))}`);
  line(cp, "");
  refreshTab(c);
  const gp = g.panes[0];
  line(gp, `<span class="ps">${prompt("pwsh", "beauty-shell")}</span> git log --oneline -5`);
  lines(gp, D.gitLog);
  const sp = s.panes[0];
  line(sp, `<span class="ps">${prompt("pwsh", "sitio-web")}</span> pnpm dev`);
  sp.state = "running";
  sp.running = "pnpm dev";
  lines(sp, D.devServer("sitio-web"));
  refreshTab(s);
  activeId.value = a.id;
  focusedId.value = a.panes[0].id;

  seen = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      seen.disconnect();
      intro();
    }
  }, { threshold: 0.35 });
  seen.observe(win.value);
});
onBeforeUnmount(() => {
  seen?.disconnect();
  window.removeEventListener("pointermove", onDragMove);
});

const sectionIds = ["appearance", "terminal", "agents", "shortcuts", "about"];
const sectionIcon = { appearance: icons.palette, terminal: icons.terminal, agents: icons.bot, shortcuts: icons.keyboard, about: icons.info };
const comboKeys = (combo) => combo.split(" / ").map((alt) => alt.split(" "));
</script>

<template>
  <div
    ref="win"
    class="shell"
    :class="[`bg-${look.windowBg}`, `term-${look.termBg}`, { unpinned: !ui.pinned, peek: ui.peek, settings: ui.settings, dragging: drag.on }]"
    :data-theme="look.theme"
    :style="{ '--mono': `'${look.font}', 'Cascadia Code', Consolas, monospace`, '--term-size': `${look.size}px`, '--dots-w': `${ordered.length * 29 + 6}px` }"
    role="region"
    :aria-label="say.region"
    @keydown="onKey"
  >

    <template v-if="ui.settings">
      <nav class="settings-nav">
        <div class="aj-top">
          <button class="aj-back" type="button" :title="say.back" @click="ui.settings = false; focusKeys()"><svg viewBox="0 0 24 24"><path :d="icons.back" /></svg></button>
          <span class="aj-name">{{ say.settings }}</span>
        </div>
        <div class="aj-list">
          <i class="aj-mark" :style="{ translate: `0 ${sectionIds.indexOf(ui.section) * 36}px` }"></i>
          <button v-for="id in sectionIds" :key="id" class="aj-item" :class="{ on: ui.section === id }" type="button" @click="ui.section = id">
            <svg viewBox="0 0 24 24"><path :d="sectionIcon[id]" /></svg>{{ say.sections[id][0] }}
          </button>
        </div>
      </nav>
      <section class="settings-panel">
        <Transition name="aj" mode="out-in">
          <div :key="ui.section" class="aj-page">
            <header v-if="ui.section !== 'about'" class="aj-hero">
              <span class="aj-tile"><svg viewBox="0 0 24 24"><path :d="sectionIcon[ui.section]" /></svg></span>
              <div><h3>{{ say.sections[ui.section][0] }}</h3><p>{{ say.sections[ui.section][1] }}</p></div>
            </header>

            <template v-if="ui.section === 'appearance'">
              <section class="aj-group">
                <h4>{{ say.theme }}</h4>
                <div class="aj-card aj-block">
                  <div class="minis">
                    <button v-for="th in ['light', 'dark']" :key="th" class="mini" :class="{ on: look.theme === th }" type="button" @click="look.theme = th">
                      <span class="mini-frame" :class="th"><i class="m-side"><b></b><b></b><b></b></i><i class="m-main"><b></b><b></b></i><span v-if="look.theme === th" class="mini-check"><svg viewBox="0 0 24 24"><path :d="icons.check" /></svg></span></span>
                      <span>{{ th === "light" ? say.light : say.dark }}</span>
                    </button>
                  </div>
                </div>
              </section>
              <section class="aj-group">
                <h4>{{ say.background }}</h4>
                <div class="aj-card">
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.windowBg }}</span>
                    <div class="seg"><button v-for="v in ['acrylic', 'mica', 'solid']" :key="v" type="button" :class="{ on: look.windowBg === v }" @click="look.windowBg = v">{{ say[v] }}</button></div>
                  </div>
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.terminalBg }}</span>
                    <div class="seg"><button v-for="v in ['pure', 'gray', 'glass']" :key="v" type="button" :class="{ on: look.termBg === v }" @click="look.termBg = v">{{ say[v] }}</button></div>
                  </div>
                </div>
              </section>
              <section class="aj-group">
                <h4>{{ say.text }}</h4>
                <p class="aj-desc">{{ say.textDesc }}</p>
                <div class="aj-card">
                  <div class="aj-block"><div class="sample"><span class="ps">PS C:\Users\ana&gt;</span> {{ say.sample }}<i class="cursor" :class="look.cursor"></i></div></div>
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.font }}</span>
                    <select v-model="look.font" class="select"><option v-for="f in fonts" :key="f" :value="f">{{ f }}</option></select>
                  </div>
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.fontSize }}</span>
                    <div class="stepper">
                      <button type="button" @click="look.size = Math.max(10, look.size - 1)"><svg viewBox="0 0 24 24"><path :d="icons.minus" /></svg></button>
                      <span>{{ look.size }}</span>
                      <button type="button" @click="look.size = Math.min(18, look.size + 1)"><svg viewBox="0 0 24 24"><path :d="icons.plus" /></svg></button>
                    </div>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="ui.section === 'terminal'">
              <section class="aj-group">
                <h4>{{ say.shell }}</h4>
                <p class="aj-desc">{{ say.shellDesc }}</p>
                <div class="aj-card">
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.defaultShell }}</span>
                    <select v-model="look.shell" class="select"><option v-for="sh in shells" :key="sh.id" :value="sh.id">{{ sh.name }}</option></select>
                  </div>
                </div>
              </section>
              <section class="aj-group">
                <h4>{{ say.cursor }}</h4>
                <div class="aj-card">
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.shape }}</span>
                    <div class="seg"><button v-for="v in ['bar', 'block', 'underline']" :key="v" type="button" :title="say[v]" :class="{ on: look.cursor === v }" @click="look.cursor = v"><i class="glyph" :class="v"></i></button></div>
                  </div>
                  <div class="aj-row">
                    <span class="aj-row-name">{{ say.blink }}</span>
                    <button class="toggle" type="button" :class="{ on: look.blink }" @click="look.blink = !look.blink"><i></i></button>
                  </div>
                </div>
              </section>
              <section class="aj-group">
                <h4>{{ say.typing }}</h4>
                <div class="aj-card">
                  <div class="aj-row">
                    <div class="aj-row-text"><span class="aj-row-name">{{ say.suggest }}</span><span class="aj-row-desc">{{ say.suggestDesc }}</span></div>
                    <button class="toggle" type="button" :class="{ on: look.suggest }" @click="look.suggest = !look.suggest"><i></i></button>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="ui.section === 'agents'">
              <section class="aj-group">
                <div class="aj-card">
                  <div v-for="agent in agents" :key="agent.name" class="aj-row">
                    <span class="aj-row-name agent"><svg viewBox="0 0 24 24"><path :d="icons.bot" /></svg>{{ agent.name }}</span>
                    <span class="badge" :class="{ on: agent.installed }">{{ agent.installed ? say.installed : say.notInstalled }}</span>
                  </div>
                </div>
              </section>
              <section class="aj-group">
                <div class="aj-card">
                  <div class="aj-row">
                    <div class="aj-row-text"><span class="aj-row-name">{{ say.connect }}</span><span class="aj-row-desc">{{ say.connectDesc }}</span></div>
                    <span class="badge on"><svg viewBox="0 0 24 24"><path :d="icons.check" /></svg>{{ say.connected }}</span>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="ui.section === 'shortcuts'">
              <section v-for="[title, items] in D.shortcuts" :key="title" class="aj-group">
                <h4>{{ title }}</h4>
                <div class="aj-card">
                  <div v-for="[what, combo] in items" :key="what" class="aj-row">
                    <span class="aj-row-name">{{ what }}</span>
                    <span class="keys">
                      <template v-for="(alt, i) in comboKeys(combo)" :key="i"><span v-if="i" class="or">{{ say.or }}</span><span class="combo"><kbd v-for="k in alt" :key="k">{{ k }}</kbd></span></template>
                    </span>
                  </div>
                </div>
              </section>
            </template>

            <section v-else class="about">
              <img src="/BeautyShellLogo.png" alt="" />
              <h3>Beauty Shell</h3>
              <span>{{ say.version }} 0.1.2</span>
            </section>
          </div>
        </Transition>
      </section>
    </template>

    <template v-else>

      <div class="peek-zone" @mouseenter="ui.peek = true"></div>
      <aside class="sidebar" @mouseleave="ui.peek = false">
        <div class="sb-list">
          <div v-for="folder in folders" :key="folder" class="group" :class="{ collapsed: isShut(folder) }">
            <div class="group-head" @click="collapsed.has(folder) ? collapsed.delete(folder) : collapsed.add(folder)">
              <span class="group-icon">
                <span class="group-folder"><svg viewBox="0 0 24 24"><path :d="icons.folder" /></svg></span>
                <span class="group-chev"><svg viewBox="0 0 24 24"><path :d="icons.chevron" /></svg></span>
              </span>
              <span class="group-name">{{ folder }}</span>
              <span class="group-count">{{ tabsIn(folder).length }}</span>
              <button class="icon-btn" type="button" :title="say.newHere" @click.stop="newTab(folder)"><svg viewBox="0 0 24 24"><path :d="icons.plus" /></svg></button>
            </div>
            <div class="group-items">
              <div
                v-for="tab in tabsIn(folder)"
                :key="tab.id"
                class="tab"
                :class="{ active: tab === active, waiting: tab.status === 'waiting', dragged: drag.on && drag.tab === tab }"
                @pointerdown="onTabDown(tab, $event)"
                @mouseup.middle="closeTab(tab)"
              >
                <span class="tab-icon">
                  <i v-if="tab.status === 'busy'" class="spinner"></i>
                  <svg v-else viewBox="0 0 24 24"><path :d="icons[tab.icon]" /></svg>
                  <i v-if="tab.status === 'waiting' || tab.status === 'done'" class="dot"></i>
                </span>
                <span class="tab-text">
                  <span class="tab-title">{{ tab.title }}<span v-if="tab.panes.length > 1" class="tab-panes">{{ tab.panes.length }}</span></span>
                  <span v-if="tab.sub" class="tab-sub">{{ tab.sub }}</span>
                </span>
                <button class="close" type="button" :title="say.closeTab" @click.stop="closeTab(tab)"><svg viewBox="0 0 24 24"><path :d="icons.close" /></svg></button>
              </div>
            </div>
          </div>
          <button class="sb-add" type="button" @click="newTab()">
            <span class="sb-add-icon"><svg viewBox="0 0 24 24"><path :d="icons.plus" /></svg></span>
            <span class="sb-add-label">{{ say.newTerminal }}</span>
            <span class="sb-add-key">Ctrl T</span>
          </button>
        </div>
        <footer class="sb-foot">
          <button class="sb-foot-btn" type="button" title="Ctrl+," @click="ui.settings = true"><svg viewBox="0 0 24 24"><path :d="icons.gear" /></svg>{{ say.settings }}</button>
          <button class="icon-btn pin" type="button" :title="say.pin" @click="ui.pinned = !ui.pinned"><svg viewBox="0 0 24 24"><path :d="icons.sidebar" /></svg></button>
        </footer>
      </aside>

      <main ref="stageEl" class="stage">
        <nav v-if="!ui.pinned" class="tab-dots">
          <span class="dots-thumb" :style="{ translate: `${Math.max(dotIndex, 0) * 29}px 0` }"></span>
          <button v-for="(tab, i) in ordered" :key="tab.id" type="button" :class="{ active: tab === active }" :title="tab.title" @click="activate(tab)">{{ i + 1 }}</button>
        </nav>

        <div v-if="active" class="panes" :class="[active.dir, { split: active.panes.length > 1 }]">
          <section
            v-for="pane in active.panes"
            :key="pane.id"
            class="pane"
            :class="{ focused: pane === focused && active.panes.length > 1 }"
            @pointerdown="focusedId = pane.id"
          >
            <div v-if="active.panes.length > 1 && pane.kind === 'term'" class="pane-head">
              <span class="pane-head-title">{{ pane.mode === "claude" ? "Claude Code" : pane.title }}</span>
              <span class="pane-path">~\{{ pane.folder }}</span>
              <button class="icon-btn" type="button" :title="say.closePane" @click.stop="closePane(pane)"><svg viewBox="0 0 24 24"><path :d="icons.close" /></svg></button>
            </div>

            <template v-if="pane.kind === 'browser'">
              <div class="browser-bar">
                <button class="icon-btn" type="button"><svg viewBox="0 0 24 24"><path :d="icons.back" /></svg></button>
                <button class="icon-btn" type="button"><svg viewBox="0 0 24 24"><path :d="icons.reload" /></svg></button>
                <span class="browser-url">{{ pane.url }}</span>
                <button class="icon-btn" type="button" :title="say.closePane" @click.stop="closePane(pane)"><svg viewBox="0 0 24 24"><path :d="icons.close" /></svg></button>
              </div>
              <div class="browser-page" :class="pane.url.includes('4321') ? 'astro' : 'vite'">
                <template v-if="pane.url.includes('4321')">
                  <p class="site-kicker">sitio-web</p>
                  <p class="site-big">{{ lang === "es" ? "Hola, soy Ana." : "Hi, I'm Ana." }}</p>
                  <p class="site-small">{{ lang === "es" ? "Diseño y programo cosas lindas." : "I design and build nice things." }}</p>
                </template>
                <template v-else>
                  <img src="/BeautyShellLogo.png" alt="" />
                  <p class="site-big">Beauty Shell</p>
                  <p class="site-small">Vite + Tauri · {{ lang === "es" ? "editá" : "edit" }} <code>src/main.ts</code></p>
                </template>
              </div>
            </template>

            <div v-else :ref="setTerm(pane.id)" class="term" @click="onTermClick(pane, $event)">
              <p v-for="l in pane.lines" :key="l.id" class="line" v-html="l.html || '&nbsp;'"></p>
              <p v-if="pane.state === 'prompt'" class="line live">
                <template v-if="pane.mode === 'claude'"><span class="cc-input"><span class="c-faint">&gt;</span> {{ pane.typed }}<i class="cursor" :class="[look.cursor, { blink: look.blink && typing && pane === focused, off: pane !== focused || !typing }]"></i></span></template>
                <template v-else><span class="ps" v-html="prompt(pane.shell, pane.folder)"></span> {{ pane.typed }}<i class="cursor" :class="[look.cursor, { blink: look.blink && typing && pane === focused, off: pane !== focused || !typing }]"></i><span class="ghost">{{ pane === focused ? ghost : "" }}</span></template>
              </p>
              <p v-else-if="pane.state === 'busy'" class="line c-faint"><i class="spinner inline"></i> {{ say.working }}</p>
            </div>
          </section>
        </div>

        <div v-if="drag.on && drag.side" class="drop-hint" :class="drag.side"></div>
      </main>

      <div v-if="drag.on" class="drag-ghost" :style="{ left: `${drag.x + 12}px`, top: `${drag.y + 8}px` }">
        <svg viewBox="0 0 24 24"><path :d="icons[drag.tab.icon]" /></svg>{{ drag.tab.title }}
      </div>
    </template>

    <Transition name="palette">
      <div v-if="ui.palette" class="palette" @keydown="onPaletteKey">
        <input ref="palInput" v-model="pal.q" :placeholder="say.palettePlaceholder" spellcheck="false" @input="pal.i = 0" />
        <div class="palette-list">
          <div v-for="(item, i) in paletteItems" :key="item.label + (item.detail ?? '')" class="palette-row" :class="{ selected: i === pal.i }" @mousemove="pal.i = i" @click="choose(item)">
            <span class="palette-label">{{ item.label }}</span>
            <span class="palette-detail">{{ item.detail }}</span>
            <span v-if="item.hint" class="hint">{{ item.hint }}</span>
          </div>
          <p v-if="!paletteItems.length" class="palette-empty">{{ say.paletteEmpty }}</p>
        </div>
      </div>
    </Transition>

    <input
      ref="keys"
      class="keys-input"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      tabindex="-1"
      :aria-label="say.region"
      @input="onInput"
      @focus="typing = true"
      @blur="typing = false"
    />
  </div>
</template>

<style scoped>

.shell {
  --radius: 11px;
  --sb-w: 260px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --spring: cubic-bezier(0.3, 1.32, 0.5, 1);
  --panel-rgb: 255, 255, 255;
  --text: #141414;
  --text-2: #525252;
  --text-3: #8a8a8a;
  --row-idle: rgba(0, 0, 0, 0.04);
  --row-hover: rgba(0, 0, 0, 0.06);
  --hairline: rgba(0, 0, 0, 0.07);
  --edge: rgba(255, 255, 255, 0.55);
  --glass-rim: rgba(255, 255, 255, 0.38);
  --card-bg: rgba(0, 0, 0, 0.03);
  --track: rgba(0, 0, 0, 0.055);
  --chip: #ffffff;
  --accent: #e2763f;
  --waiting: #3263d4;
  --shadow-lg: 0 18px 50px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08);
  --term-bg: #ffffff;
  --term-fg: #000000;
  --c-red: #c93b3b;
  --c-green: #2b8448;
  --c-yellow: #a87708;
  --c-blue: #3263d4;
  --c-magenta: #8650d0;
  --c-cyan: #10808f;
  --c-faint: #6f6b66;
  --frame: rgba(236, 236, 240, 0.62);

  position: relative;
  display: grid;
  grid-template-columns: var(--sb-w) minmax(0, 1fr);
  gap: 6px;
  height: 100%;
  padding: 6px;
  overflow: hidden;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, transparent 45%),
    var(--frame);
  backdrop-filter: blur(30px) saturate(1.4);
  box-shadow:
    0 24px 60px rgb(20 20 45 / 16%),
    0 0 0 1px rgb(20 20 45 / 10%),
    inset 0 1px 0 var(--glass-rim);
  font: 13px/1.4 "Geist", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  color: var(--text);
  text-align: left;
  user-select: none;
  isolation: isolate;
}
.shell.bg-mica {
  --frame: rgba(232, 230, 242, 0.95);
}
.shell.bg-solid {
  --frame: #f3f3f3;
}
.shell[data-theme="dark"] {
  --panel-rgb: 0, 0, 0;
  --text: #ededed;
  --text-2: #c4c4c4;
  --text-3: #9c9c9c;
  --row-idle: rgba(255, 255, 255, 0.04);
  --row-hover: rgba(255, 255, 255, 0.06);
  --hairline: rgba(255, 255, 255, 0.07);
  --edge: rgba(255, 255, 255, 0.07);
  --glass-rim: rgba(255, 255, 255, 0.12);
  --card-bg: rgba(255, 255, 255, 0.035);
  --track: rgba(255, 255, 255, 0.06);
  --chip: rgba(255, 255, 255, 0.13);
  --accent: #f08a54;
  --waiting: #6aa2ff;
  --term-bg: #000000;
  --term-fg: #ececec;
  --c-red: #ff6b6b;
  --c-green: #5fd38d;
  --c-yellow: #f2c55c;
  --c-blue: #6aa2ff;
  --c-magenta: #c49bff;
  --c-cyan: #4fd1e0;
  --c-faint: #8a8a8a;
  --frame: rgba(24, 24, 28, 0.78);
}
.shell[data-theme="dark"].bg-mica {
  --frame: rgba(28, 26, 34, 0.96);
}
.shell[data-theme="dark"].bg-solid {
  --frame: #161616;
}
.shell.term-gray {
  --term-bg: #f9f9f9;
}
.shell[data-theme="dark"].term-gray {
  --term-bg: #202020;
}
.shell.term-glass {
  --term-bg: rgba(255, 255, 255, 0.62);
}
.shell[data-theme="dark"].term-glass {
  --term-bg: rgba(0, 0, 0, 0.55);
}

button {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
svg {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
p,
h3,
h4 {
  margin: 0;
}
.keys-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  opacity: 0;
  font-size: 16px;
  pointer-events: none;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--text-2);
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover {
  background: rgba(var(--panel-rgb), 0.45);
  color: var(--text);
}

.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid transparent;
  border-radius: var(--radius);
}
.unpinned {
  grid-template-columns: minmax(0, 1fr);
}
.unpinned .sidebar {
  position: absolute;
  z-index: 30;
  top: 6px;
  bottom: 6px;
  left: 6px;
  width: var(--sb-w);
  background: rgba(var(--panel-rgb), 0.82);
  backdrop-filter: blur(28px) saturate(1.5);
  box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--edge);
  translate: calc(-100% - 24px) 0;
  visibility: hidden;
  transition: translate 180ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s linear 180ms;
}
.unpinned.peek .sidebar {
  translate: 0 0;
  visibility: visible;
  transition: translate 260ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s;
}
.peek-zone {
  display: none;
}
.unpinned .peek-zone {
  display: block;
  position: absolute;
  z-index: 29;
  top: 0;
  bottom: 0;
  left: 0;
  width: 12px;
}
.sb-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 6px 9px;
  scrollbar-width: none;
}
.unpinned .sb-list {
  padding-top: 6px;
}

.group {
  padding: 4px;
  border: 1px solid rgba(var(--panel-rgb), 0.4);
  border-radius: 14px;
  background: rgba(var(--panel-rgb), 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 var(--glass-rim);
}
.group + .group {
  margin-top: 8px;
}
.shell[data-theme="dark"] .group {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}
.unpinned .group {
  border-color: color-mix(in oklab, var(--text) 10%, transparent);
  background: color-mix(in oklab, var(--text) 4%, transparent);
  box-shadow: none;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  margin-bottom: 2px;
  padding: 0 4px 0 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-3);
  cursor: pointer;
  transition: color 0.15s, margin-bottom 0.24s var(--ease);
}
.group.collapsed .group-head {
  margin-bottom: 0;
}
.group-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 14px;
  height: 14px;
}
.group-icon > span {
  display: grid;
  grid-area: 1 / 1;
  place-items: center;
  transition: opacity 0.15s, scale 0.15s;
}
.group-icon svg {
  width: 13px;
  height: 13px;
}
.group-chev {
  opacity: 0;
  scale: 0.8;
}
.group-chev svg {
  width: 12px;
  height: 12px;
  rotate: 90deg;
  transition: rotate 0.22s var(--ease);
}
.group.collapsed .group-chev svg {
  rotate: 0deg;
}
.group-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.group-count {
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--row-hover);
  font-size: 10.5px;
  opacity: 0;
  scale: 0.8;
  transition: opacity 0.15s, scale 0.15s;
}
.group.collapsed .group-count {
  opacity: 1;
  scale: 1;
}
.group-head .icon-btn {
  width: 22px;
  height: 22px;
  margin-left: auto;
  opacity: 0;
}
.group-head .icon-btn svg {
  width: 12px;
  height: 12px;
}
.group-head:hover {
  color: var(--text-2);
}
.group-head:hover .group-folder {
  opacity: 0;
  scale: 0.8;
}
.group-head:hover .group-chev {
  opacity: 1;
  scale: 1;
}
.group-head:hover .icon-btn {
  opacity: 1;
}
.group-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: clip;
  interpolate-size: allow-keywords;
  transition: height 0.24s var(--ease), opacity 0.18s;
}
.group.collapsed .group-items {
  height: 0;
  opacity: 0;
  visibility: hidden;
}

.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 5px 6px 5px 12px;
  border-radius: 10px;
  color: color-mix(in oklab, var(--text) 72%, transparent);
  cursor: default;
  transition: background-color 0.15s, box-shadow 0.15s, color 0.15s, opacity 0.15s;
}
.tab:not(.active):hover {
  background: color-mix(in oklab, var(--text) 4%, transparent);
  color: var(--text);
}
.tab.active {
  background: rgb(var(--panel-rgb));
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--hairline);
}
.shell[data-theme="dark"] .tab.active {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.tab.dragged {
  opacity: 0.4;
}
.tab-icon {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 16px;
  height: 16px;
}
.tab-icon .dot {
  position: absolute;
  top: -3px;
  right: -4px;
  width: 7px;
  height: 7px;
  border: 1.5px solid rgb(var(--panel-rgb));
  border-radius: 50%;
  background: var(--waiting);
}
.tab-text {
  display: grid;
  flex: 1;
  min-width: 0;
  line-height: 1.25;
}
.tab-title,
.tab-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tab-title {
  font-weight: 500;
}
.tab-panes {
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--row-hover);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-3);
}
.tab-sub {
  font-size: 11.5px;
  color: var(--text-3);
}
.tab.waiting .tab-sub {
  color: var(--waiting);
}
.tab .close {
  display: none;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: var(--text-3);
}
.tab:hover .close {
  display: grid;
}
.tab .close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text);
}
.tab .close svg {
  width: 12px;
  height: 12px;
}
.spinner {
  width: 12px;
  height: 12px;
  border: 1.6px solid color-mix(in oklab, var(--text) 18%, transparent);
  border-top-color: var(--text-2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner.inline {
  display: inline-block;
  vertical-align: -1px;
}

.sb-add {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  margin-top: 4px;
  padding: 0 10px 0 17px;
  border-radius: 10px;
  font-weight: 500;
  color: var(--text-2);
  text-align: left;
  transition: background-color 0.15s, color 0.15s;
}
.sb-add:hover {
  background: rgba(var(--panel-rgb), 0.45);
  color: var(--text);
}
.sb-add-icon {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
}
.sb-add-label {
  flex: 1;
}
.sb-add-key {
  font-size: 11px;
  color: var(--text-3);
  opacity: 0;
  transition: opacity 0.15s;
}
.sb-add:hover .sb-add-key {
  opacity: 1;
}
.sb-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 8px;
  padding: 8px 0 6px;
  border-top: 1px solid var(--hairline);
}
.sb-foot-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px 0 8px;
  border-radius: 8px;
  font-weight: 500;
  color: var(--text-2);
  transition: background-color 0.15s, color 0.15s;
}
.sb-foot-btn:hover {
  background: rgba(var(--panel-rgb), 0.45);
  color: var(--text);
}

.stage {
  position: relative;
  min-width: 0;
  min-height: 0;
}
.panes {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 6px;
}
.panes.col {
  flex-direction: column;
}
.pane {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: var(--term-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: pane-in 0.2s var(--ease);
}
.term-glass .pane {
  backdrop-filter: blur(20px);
}
.pane-head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  flex: none;
  padding: 0 6px 0 16px;
  border-bottom: 1px solid var(--hairline);
}
.pane-head-title {
  font-weight: 600;
  color: var(--text-3);
  white-space: nowrap;
  transition: color 0.15s;
}
.pane-head-title::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 8px 1px 0;
  border-radius: 50%;
  background: currentColor;
  vertical-align: middle;
  opacity: 0;
  scale: 0.25;
  transition: opacity 0.3s, scale 0.3s;
}
.pane.focused .pane-head-title {
  color: var(--text);
}
.pane.focused .pane-head-title::before {
  opacity: 1;
  scale: 1;
}
.pane-path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-3);
}
.pane-head .icon-btn {
  width: 24px;
  height: 24px;
}
.pane-head .icon-btn svg {
  width: 12px;
  height: 12px;
}

.term {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 26px 4px 8px 18px;
  font-family: var(--mono);
  font-size: var(--term-size);
  line-height: 1.45;
  color: var(--term-fg);
  cursor: text;
  scrollbar-width: none;
  user-select: text;
}
.split .term {
  padding-top: 10px;
}
.line {
  min-height: 1.45em;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.term :deep(.c-faint) {
  color: var(--c-faint);
}
.term :deep(.c-bold) {
  font-weight: 700;
}
.term :deep(.c-red) {
  color: var(--c-red);
}
.term :deep(.c-green) {
  color: var(--c-green);
}
.term :deep(.c-yellow) {
  color: var(--c-yellow);
}
.term :deep(.c-blue) {
  color: var(--c-blue);
}
.term :deep(.c-magenta) {
  color: var(--c-magenta);
}
.term :deep(.c-cyan) {
  color: var(--c-cyan);
}
.term :deep(.c-accent) {
  color: var(--accent);
}
.term :deep(.link) {
  color: var(--c-cyan);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
.term :deep(.cc-box) {
  display: inline-block;
  padding: 2px 14px 4px 10px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  line-height: 1.35;
}
.term :deep(.cc-you) {
  color: var(--c-faint);
}
.cc-input {
  display: block;
  padding: 2px 10px;
  border: 1px solid color-mix(in oklab, var(--term-fg) 25%, transparent);
  border-radius: 6px;
}
.ghost {
  color: color-mix(in oklab, var(--term-fg) 38%, transparent);
}
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.15em;
  margin-left: 1px;
  vertical-align: -0.2em;
  background: var(--term-fg);
}
.cursor.block {
  width: 0.6em;
  opacity: 0.85;
}
.cursor.underline {
  width: 0.6em;
  height: 2px;
  vertical-align: -0.05em;
}
.cursor.blink {
  animation: blink 1s step-end infinite;
}
.cursor.off {
  opacity: 0.3;
}

.browser-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  flex: none;
  padding: 0 6px;
  border-bottom: 1px solid var(--hairline);
}
.browser-url {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--row-idle);
  line-height: 28px;
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.browser-page {
  flex: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  padding: 20px;
  background: #fff;
  color: #141414;
  text-align: center;
}
.browser-page img {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin-bottom: 8px;
}
.browser-page.astro {
  justify-items: start;
  text-align: left;
  background: linear-gradient(160deg, #fff7ed, #fde4cf);
}
.site-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c2410c;
}
.site-big {
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.site-small {
  color: #6b6b6b;
}
.site-small code {
  font-family: var(--mono);
  font-size: 0.9em;
}

.unpinned .panes.row .pane:last-child :is(.pane-head, .browser-bar),
.unpinned .panes.col .pane:first-child :is(.pane-head, .browser-bar) {
  padding-right: calc(var(--dots-w) + 14px);
}
.unpinned .panes:not(.split) .term {
  padding-top: 44px;
}
.tab-dots {
  position: absolute;
  z-index: 6;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 3px;
  padding: 3px;
  border-radius: 999px;
  background: var(--row-idle);
  box-shadow: inset 0 0 0 1px var(--hairline);
  isolation: isolate;
}
.dots-thumb {
  position: absolute;
  z-index: -1;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--chip);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: translate 420ms var(--spring);
}
.tab-dots button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
}
.tab-dots button.active {
  color: var(--text);
}

.drop-hint {
  position: absolute;
  z-index: 5;
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--text) 8%, transparent);
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--text) 30%, transparent);
  pointer-events: none;
  transition: all 0.16s var(--ease);
}
.drop-hint.left {
  inset: 0 50% 0 0;
}
.drop-hint.right {
  inset: 0 0 0 50%;
}
.drop-hint.top {
  inset: 0 0 50% 0;
}
.drop-hint.bottom {
  inset: 50% 0 0 0;
}
.drag-ghost {
  position: absolute;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px 0 12px;
  border-radius: 10px;
  background: rgba(var(--panel-rgb), 0.85);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--edge);
  font-weight: 500;
  pointer-events: none;
}
.dragging {
  cursor: grabbing;
}

.palette {
  position: absolute;
  z-index: 70;
  top: 64px;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: min(560px, calc(100% - 32px));
  padding: 6px;
  border-radius: 13px;
  background: rgba(var(--panel-rgb), 0.86);
  backdrop-filter: blur(30px) saturate(1.4);
  box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--edge);
  translate: -50% 0;
}
.shell[data-theme="dark"] .palette {
  background: rgba(24, 24, 24, 0.9);
}
.palette input {
  height: 38px;
  margin-bottom: 4px;
  padding: 0 12px;
  border: none;
  border-bottom: 1px solid var(--hairline);
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--text);
}
.palette-list {
  max-height: min(380px, 55vh);
  overflow-y: auto;
  scrollbar-width: none;
}
.palette-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
}
.palette-row.selected {
  background: var(--row-hover);
}
.palette-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.palette-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--text-3);
}
.palette-row .hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-3);
}
.palette-empty {
  padding: 14px 10px;
  color: var(--text-3);
}

.settings {
  grid-template-columns: var(--sb-w) minmax(0, 1fr);
}
.settings-nav {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius);
  background: rgba(var(--panel-rgb), 0.55);
  box-shadow: inset 0 0 0 1px var(--edge);
}
.aj-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 10px;
}
.aj-back {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--track);
  color: var(--text-2);
}
.aj-back:hover {
  color: var(--text);
}
.aj-name {
  font-size: 14px;
  font-weight: 600;
}
.aj-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px 10px;
}
.aj-mark {
  position: absolute;
  top: 4px;
  right: 8px;
  left: 8px;
  height: 34px;
  border-radius: 10px;
  background: rgb(var(--panel-rgb));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--hairline);
  transition: translate 460ms var(--spring);
}
.shell[data-theme="dark"] .aj-mark {
  background: rgba(255, 255, 255, 0.1);
}
.aj-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 10px 0 12px;
  border-radius: 10px;
  font-weight: 500;
  color: color-mix(in oklab, var(--text) 72%, transparent);
  text-align: left;
}
.aj-item.on {
  color: var(--text);
}
.aj-item:not(.on):hover {
  background: rgba(var(--panel-rgb), 0.45);
}
.aj-item svg {
  width: 16px;
  height: 16px;
}
.settings-panel {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  border-radius: var(--radius);
  background: rgb(var(--panel-rgb));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  scrollbar-width: none;
}
.shell[data-theme="dark"] .settings-panel {
  background: #0b0b0b;
}
.aj-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 24px 40px;
}
.aj-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.aj-hero h3 {
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.015em;
}
.aj-hero p {
  margin-top: 3px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-2);
}
.aj-tile {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--text);
  color: rgb(var(--panel-rgb));
}
.aj-tile svg {
  width: 22px;
  height: 22px;
}
.aj-group h4 {
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
}
.aj-desc {
  margin: 2px 4px 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-3);
}
.aj-card {
  margin-top: 8px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.aj-block {
  padding: 14px;
}
.aj-card > * + * {
  box-shadow: inset 0 1px 0 var(--hairline);
}
.aj-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 24px;
  min-height: 50px;
  padding: 9px 14px;
}
.aj-row-text {
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: 2px;
}
.aj-row-name {
  font-size: 13px;
  font-weight: 500;
}
.aj-row-name.agent {
  display: flex;
  align-items: center;
  gap: 10px;
}
.aj-row-desc {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--text-3);
}
.seg {
  display: flex;
  padding: 2px;
  border-radius: 9px;
  background: var(--track);
}
.seg button {
  display: grid;
  place-items: center;
  min-width: 38px;
  height: 28px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  transition: background 0.2s, color 0.2s;
}
.seg button.on {
  background: var(--chip);
  color: var(--text);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.06);
}
.glyph {
  display: block;
  background: currentColor;
}
.glyph.bar {
  width: 2px;
  height: 14px;
}
.glyph.block {
  width: 8px;
  height: 14px;
}
.glyph.underline {
  width: 10px;
  height: 2px;
  margin-top: 12px;
}
.toggle {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--track);
  box-shadow: inset 0 0 0 1px var(--hairline);
  transition: background 0.2s;
}
.toggle i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: translate 0.3s var(--spring);
}
.toggle.on {
  background: var(--text);
}
.toggle.on i {
  translate: 18px 0;
  background: rgb(var(--panel-rgb));
}
.select {
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: var(--chip);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 2px rgba(0, 0, 0, 0.06);
  font: inherit;
  color: var(--text);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stepper span {
  width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.stepper button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--track);
}
.stepper svg {
  width: 13px;
  height: 13px;
}
.sample {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--term-bg);
  box-shadow: inset 0 0 0 1px var(--hairline);
  font-family: var(--mono);
  font-size: var(--term-size);
  color: var(--term-fg);
}
.minis {
  display: flex;
  gap: 14px;
}
.mini {
  display: grid;
  justify-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
}
.mini.on {
  color: var(--text);
}
.mini-frame {
  position: relative;
  display: flex;
  gap: 4px;
  width: 116px;
  height: 74px;
  padding: 5px;
  border-radius: 10px;
  background: #e9e9ee;
  box-shadow: 0 0 0 1px var(--hairline);
}
.mini.on .mini-frame {
  box-shadow: 0 0 0 2px var(--text);
}
.mini-frame.dark {
  background: #1d1d1f;
}
.m-side,
.m-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.m-side {
  width: 30%;
  padding-top: 2px;
}
.m-side b {
  height: 7px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.1);
}
.m-side b:first-child {
  background: #fff;
}
.m-main {
  flex: 1;
  padding: 6px;
  border-radius: 6px;
  background: #fff;
}
.m-main b {
  height: 4px;
  width: 70%;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.16);
}
.dark .m-side b {
  background: rgba(255, 255, 255, 0.1);
}
.dark .m-side b:first-child {
  background: rgba(255, 255, 255, 0.22);
}
.dark .m-main {
  background: #000;
}
.dark .m-main b {
  background: rgba(255, 255, 255, 0.3);
}
.mini-check {
  position: absolute;
  right: -6px;
  bottom: -6px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--text);
  color: rgb(var(--panel-rgb));
  animation: pop 0.3s cubic-bezier(0.34, 1.7, 0.6, 1);
}
.mini-check svg {
  width: 12px;
  height: 12px;
  stroke-width: 2.6;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--track);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-3);
}
.badge.on {
  background: color-mix(in oklab, var(--c-green) 14%, transparent);
  color: var(--c-green);
}
.badge svg {
  width: 12px;
  height: 12px;
}
.keys {
  display: flex;
  align-items: center;
  gap: 6px;
}
.combo {
  display: flex;
  gap: 3px;
}
.or {
  font-size: 11px;
  color: var(--text-3);
}
kbd {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--chip);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14), 0 1px 1px rgba(0, 0, 0, 0.08);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 22px;
  text-align: center;
}
.about {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 60px 0;
  text-align: center;
}
.about img {
  width: 72px;
  height: 72px;
  border-radius: 18px;
}
.about h3 {
  font-size: 22px;
  font-weight: 650;
}
.about span {
  color: var(--text-3);
}

@keyframes spin {
  to {
    rotate: 1turn;
  }
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
@keyframes pane-in {
  from {
    opacity: 0;
  }
}
@keyframes pop {
  from {
    scale: 0.4;
    opacity: 0;
  }
}
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.2s, translate 0.25s var(--ease);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
  translate: -50% -8px;
}
.aj-enter-active,
.aj-leave-active {
  transition: opacity 0.16s, translate 0.2s var(--ease);
}
.aj-enter-from {
  opacity: 0;
  translate: 0 8px;
}
.aj-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .shell,
  .settings {
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar,
  .settings-nav {
    display: none;
  }
}
</style>

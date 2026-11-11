import { nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from "vue";

const MAX_TABS = 7;

export function useShellDemo(data, { input, win }) {
  const { lang, ui, commands, tabs: seed } = data;
  const MAX_LINES = 60;

  const live = ref(false);
  const typing = ref(false);
  const hintGone = ref(false);
  const terms = new Map();

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let still = false;
  const wait = (ms) => new Promise((done) => setTimeout(done, still ? 0 : ms));

  let nextId = 1;
  const collapsed = reactive(new Set());
  const tabs = reactive([]);
  const active = shallowRef(null);
  const focused = shallowRef(null);

  function makeTab(spec) {
    const tab = reactive({ id: nextId++, folder: spec.folder, icon: spec.icon, title: spec.title, sub: spec.sub ?? "", size: spec.panes.length, panes: [] });
    for (const script of spec.panes) {
      tab.panes.push(reactive({ id: nextId++, tab, script, lines: [], state: "idle", line: null, typed: "", started: false }));
    }
    return tab;
  }

  function addLine(pane, line) {
    const added = reactive({ id: nextId++, ...line });
    pane.lines.push(added);
    if (pane.lines.length > MAX_LINES) pane.lines.splice(0, pane.lines.length - MAX_LINES);
    nextTick(() => {
      const term = terms.get(pane.id);
      if (term) term.scrollTop = term.scrollHeight;
    });
    return added;
  }

  function showPrompt(pane) {
    pane.state = "prompt";
    pane.typed = "";
    pane.line = addLine(pane, { prompt: true, typed: "", cursor: true });
    if (pane === focused.value) input.value.value = "";
  }

  function closePrompt(pane) {
    if (pane.line) pane.line.cursor = false;
    pane.line = null;
  }

  async function play(pane) {
    if (pane.started) return;
    pane.started = true;
    const { cmd, out = [], running } = pane.script;
    if (!cmd) return showPrompt(pane);
    pane.state = "busy";
    const line = addLine(pane, { prompt: true, typed: "", cursor: true });
    await wait(350);
    for (const ch of cmd) {
      line.typed += ch;
      await wait(38 + Math.random() * 40);
    }
    await wait(220);
    line.cursor = false;
    for (const html of out) {
      addLine(pane, { html });
      await wait(70);
    }
    if (running) pane.state = "running";
    else showPrompt(pane);
  }

  function run(pane, text) {
    closePrompt(pane);
    const cmd = text.trim();
    const [name, ...args] = cmd.split(/\s+/);
    const word = (name || "").toLowerCase();
    const say = (html) => addLine(pane, { html });
    if (cmd) pane.tab.sub = cmd;
    if (!cmd) {
    } else if (word === "clear" || word === "cls") {
      pane.lines.splice(0);
    } else if (word === "help" || word === "ayuda") {
      commands.help.forEach(say);
    } else if (word === "ls" || word === "dir" || word === "get-childitem") {
      commands.ls.forEach(say);
    } else if (word === "echo" || word === "write-host") {
      say(esc(args.join(" ")));
    } else if (word === "date" || word === "get-date") {
      say(esc(new Date().toLocaleString(lang === "es" ? "es-AR" : "en-US", { dateStyle: "full", timeStyle: "short" })));
    } else {
      say(commands.notFound.replace("{cmd}", () => `<b>${esc(name)}</b>`));
    }
    hintGone.value = true;
    showPrompt(pane);
  }

  function onInput() {
    const el = input.value;
    const pane = focused.value;
    if (!pane || pane.state !== "prompt") {
      el.value = "";
      return;
    }
    pane.typed = el.value;
    if (pane.line) pane.line.typed = pane.typed;
  }

  function onInputKey(e) {
    const pane = focused.value;
    const el = input.value;
    if (!pane) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (pane.state === "prompt") run(pane, el.value);
    } else if (e.key.toLowerCase() === "c" && e.ctrlKey) {
      if (pane.state === "running") {
        e.preventDefault();
        addLine(pane, { html: '<span class="text-faint">^C</span>' });
        if (pane.tab.sub === pane.script.cmd || pane.script.quiet) pane.tab.sub = "";
        showPrompt(pane);
      } else if (pane.state === "prompt" && el.selectionStart === el.selectionEnd) {
        e.preventDefault();
        if (pane.line) pane.line.ctrlC = true;
        closePrompt(pane);
        showPrompt(pane);
      }
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      if (pane.state === "prompt") {
        const typed = pane.typed;
        pane.lines.splice(0);
        showPrompt(pane);
        el.value = typed;
        onInput();
      }
    }
  }

  function focusPane(pane, withKeyboard = true) {
    focused.value = pane;
    input.value.value = pane.state === "prompt" ? pane.typed : "";
    if (withKeyboard) input.value.focus({ preventScroll: true });
  }

  function activate(tab, withKeyboard = false) {
    active.value = tab;
    tab.panes.forEach(play);
    focusPane(tab.panes.find((p) => !p.script.running) ?? tab.panes[0], withKeyboard);
  }

  function newTab() {
    if (tabs.length >= MAX_TABS) return;
    const folder = active.value?.folder ?? tabs[0].folder;
    const tab = makeTab({ folder, icon: "terminal", title: "PowerShell", panes: [{ head: "PowerShell" }] });
    const last = tabs.findLastIndex((t) => t.folder === folder);
    tabs.splice(last + 1, 0, tab);
    collapsed.delete(folder);
    activate(tab, true);
  }

  function closeTab(tab) {
    if (tabs.length === 1) return;
    const i = tabs.indexOf(tab);
    tabs.splice(i, 1);
    if (tab === active.value) activate(tabs[Math.min(i, tabs.length - 1)]);
  }

  const folders = () => [...new Set(tabs.map((t) => t.folder))];
  const tabsIn = (folder) => tabs.filter((t) => t.folder === folder);
  const isShut = (folder) => collapsed.has(folder) && !tabsIn(folder).includes(active.value);
  const isBusy = (tab) => tab.panes.some((p) => p.state === "busy" || (p.state === "running" && !p.script.quiet));

  function toggleFolder(folder) {
    if (collapsed.has(folder)) collapsed.delete(folder);
    else collapsed.add(folder);
  }

  function onTabKey(e, tab) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(tab, true);
    }
  }

  function onWindowKey(e) {
    if (e.ctrlKey && e.key.toLowerCase() === "t") {
      e.preventDefault();
      newTab();
    }
  }

  let seen;

  onMounted(() => {
    still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    tabs.push(...seed.map(makeTab));
    live.value = true;

    const begin = () => activate(tabs[0]);
    if ("IntersectionObserver" in window && !still) {
      seen = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen.disconnect();
          begin();
        }
      }, { threshold: 0.3 });
      seen.observe(win.value);
      active.value = tabs[0];
    } else begin();
  });

  onBeforeUnmount(() => seen?.disconnect());

  const setTerm = (id) => (el) => {
    if (el) terms.set(id, el);
    else terms.delete(id);
  };

  return reactive({
    ui,
    maxTabs: MAX_TABS,
    live,
    typing,
    hintGone,
    tabs,
    active,
    focused,
    onInput,
    onInputKey,
    onWindowKey,
    onTabKey,
    focusPane,
    activate,
    newTab,
    closeTab,
    folders,
    tabsIn,
    isShut,
    isBusy,
    toggleFolder,
    setTerm,
  });
}

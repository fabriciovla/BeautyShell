import { AGENTS } from "./agent-catalog";
import { icons } from "./icons";
import { t } from "./lang";
import { startLiquid } from "./liquid";
import { miniWindow } from "./mini-window";
import { IS_WINDOWS } from "./platform";
import type { ShellInfo } from "./pty";
import { clampFontSize, esc, type CursorPref, type Settings, type ThemePref } from "./settings";

const KEY = "beauty.onboarded";

export function shouldOnboard(): boolean {
  try {
    return localStorage.getItem(KEY) !== "1";
  } catch {
    return false;
  }
}

function markOnboarded() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
  }
}

export interface OnboardingContext {
  settings: Settings;
  shells: ShellInfo[];

  home: string;
  update(patch: Partial<Settings>): void;

  findAgents(): Promise<Record<string, string | null>>;

  connectClaude(): Promise<boolean>;
  claudeConnected(): boolean;

  done(): void;
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const wait = (ms: number) => new Promise((r) => setTimeout(r, reducedMotion.matches ? 0 : ms));

const LETTER_MS = 32;

function rising(lines: string[]): { html: string; count: number } {
  let n = 0;
  const html = lines
    .map(
      (line) =>
        `<span class="ob-line">${line
          .split(" ")
          .map((word) => `<span class="ob-word">${[...word].map((ch) => `<span class="ob-letter" style="--n: ${n++}">${esc(ch)}</span>`).join("")}</span>`)
          .join(" ")}</span>`,
    )
    .join("");
  return { html, count: n };
}

function prompt(shell: string, home: string) {
  const path = esc(home.replace(/[\\/]+$/, ""));
  const user = esc(/:$/.test(path) ? t("usuario", "user") : (path.split(/[\\/]/).pop() ?? t("usuario", "user")));
  const prompts: Record<string, string> = {
    pwsh: `<span class="p-ps">PS</span> <span class="p-path">${path}</span>&gt;`,
    powershell: `<span class="p-ps">PS</span> <span class="p-path">${path}</span>&gt;`,
    cmd: `<span class="p-path">${path}</span>&gt;`,
    gitbash: `<span class="p-user">${user}</span> <span class="p-mingw">MINGW64</span> <span class="p-path">~</span><br>$`,
    wsl: `<span class="p-user">${user}</span>:<span class="p-path">~</span>$`,
    bash: `[<span class="p-user">${user}</span> <span class="p-path">~</span>]$`,
    zsh: `<span class="p-user">${user}</span> <span class="p-path">~</span> %`,
    fish: `<span class="p-user">${user}</span> <span class="p-path">~</span>&gt;`,
    sh: `$`,
  };
  return prompts[shell] ?? (IS_WINDOWS ? prompts.cmd : prompts.bash);
}

const SHELL_INFO: Record<string, { icon: string; about: string }> = {
  pwsh: { icon: icons.terminal, about: t("La versión moderna de PowerShell", "The modern version of PowerShell") },
  powershell: { icon: icons.terminal, about: t("La que viene con Windows", "The one that comes with Windows") },
  cmd: { icon: icons.squareTerminal, about: t("La consola clásica de Windows", "The classic Windows console") },
  gitbash: { icon: icons.gitBranch, about: t("Bash, con los comandos de Git", "Bash, with the Git commands") },
  wsl: { icon: icons.layers, about: t("Linux, dentro de Windows", "Linux, inside Windows") },
  bash: { icon: icons.terminal, about: t("La que viene con casi todos los Linux", "The one that comes with almost every Linux") },
  zsh: { icon: icons.terminal, about: t("Compatible con bash, con más ayudas al escribir", "Bash-compatible, with more help while typing") },
  fish: { icon: icons.terminal, about: t("Sugerencias y colores desde el primer día", "Suggestions and colors from day one") },
};
const shellInfo = (id: string) => SHELL_INFO[id] ?? { icon: icons.terminal, about: "" };

const THEMES: [ThemePref, string][] = [
  ["light", t("Claro", "Light")],
  ["dark", t("Oscuro", "Dark")],
  ["system", IS_WINDOWS ? t("Como Windows", "Like Windows") : t("Como el sistema", "Like the system")],
];

const CURSORS: [CursorPref, string][] = [
  ["bar", t("Barra", "Bar")],
  ["block", t("Bloque", "Block")],
  ["underline", t("Subrayado", "Underline")],
];

const SHORTCUTS: [string[], string][] = [
  [["Ctrl", "T"], t("Una terminal nueva", "A new terminal")],
  [["Ctrl", "Shift", "D"], t("Dividir el panel", "Split the pane")],
  [["Ctrl", "Shift", "P"], t("La paleta de comandos", "The command palette")],
  [["Ctrl", ","], t("Ajustes", "Settings")],
];

export function startOnboarding(ctx: OnboardingContext) {
  document.getElementById("onboarding")?.remove();
  const root = document.createElement("div");
  root.id = "onboarding";
  root.setAttribute("data-tauri-drag-region", "");
  root.innerHTML = `
    <div class="ob-bg" aria-hidden="true">
      <i class="ob-blob b1"></i><i class="ob-blob b2"></i><i class="ob-blob b3"></i><i class="ob-blob b4"></i>
    </div>
    <div class="ob-grain" aria-hidden="true"></div>
    <div class="ob-stage" data-tauri-drag-region></div>
    <div class="ob-dots" aria-hidden="true"></div>`;
  document.body.append(root);
  const stage = root.querySelector<HTMLElement>(".ob-stage")!;
  const dots = root.querySelector<HTMLElement>(".ob-dots")!;

  const liquid = startLiquid(root);
  if (liquid) root.querySelector(".ob-bg")?.remove();

  let step = 0;
  let busy = false;

  let run = 0;

  interface Step {
    render(): string;
    mount?(el: HTMLElement, alive: () => boolean): void;
  }

  const header = (title: string, sub: string) => `
    <header class="ob-chunk">
      <h2 class="ob-title">${title}</h2>
      <p class="ob-sub">${sub}</p>
    </header>`;

  const nav = (next = t("Siguiente", "Next")) => `
    <div class="ob-chunk ob-nav">
      <button class="ob-ghost" data-back>${icons.back}<span>${t("Atrás", "Back")}</span></button>
      <button class="ob-primary" data-next>${next}${icons.arrowRight}</button>
    </div>`;

  const welcome: Step = {
    render() {
      const title = rising([t("Bienvenido a", "Welcome to"), "Beauty Shell"]);
      return `
        <h1 class="ob-hero" aria-label="${t("Bienvenido a Beauty Shell", "Welcome to Beauty Shell")}">${title.html}</h1>
        <button class="ob-primary ob-late" data-next style="--after: ${title.count * LETTER_MS + 500}ms">${t("Empezar", "Get started")}${icons.arrowRight}</button>`;
    },
  };

  const theme: Step = {
    render: () => `
      ${header(t("¿Claro u oscuro?", "Light or dark?"), t("Así se va a ver Beauty Shell. Probá: el cambio es inmediato.", "This is how Beauty Shell will look. Try it: the change is instant."))}
      <div class="ob-chunk ob-choices" role="radiogroup" aria-label="${t("Tema", "Theme")}">
        ${THEMES.map(
          ([value, label]) => `
          <button class="ob-choice ${ctx.settings.theme === value ? "on" : ""}" data-pick-theme="${value}" role="radio" aria-checked="${ctx.settings.theme === value}">
            <span class="ob-preview-frame">
              ${value === "system" ? `${miniWindow("light")}<span class="ob-half">${miniWindow("dark")}</span>` : miniWindow(value)}
              <span class="ob-check">${icons.check}</span>
            </span>
            <span class="ob-choice-label">${label}</span>
          </button>`,
        ).join("")}
      </div>
      ${nav()}`,
  };

  const shell: Step = {
    render: () => `
      ${header(t("Elegí tu shell", "Pick your shell"), t("La que se abre en cada terminal nueva. Estas son las que encontramos en tu equipo.", "The one every new terminal opens. These are the ones we found on your computer."))}
      <div class="ob-chunk ob-shell-list" role="radiogroup" aria-label="Shell">
        ${ctx.shells
          .map((sh) => {
            const info = shellInfo(sh.id);
            return `
          <button class="ob-shell ${ctx.settings.shell === sh.id ? "on" : ""}" data-pick-shell="${esc(sh.id)}" role="radio" aria-checked="${ctx.settings.shell === sh.id}">
            <span class="ob-shell-icon">${info.icon}</span>
            <span class="ob-shell-text"><b>${esc(sh.name)}</b>${info.about ? `<span>${info.about}</span>` : ""}</span>
            <span class="ob-radio">${icons.check}</span>
          </button>`;
          })
          .join("")}
      </div>
      ${nav()}`,
  };

  const look: Step = {
    render() {
      const s = ctx.settings;
      const name = ctx.shells.find((sh) => sh.id === s.shell)?.name ?? "Terminal";
      return `
        ${header(t("Hacela tuya", "Make it yours"), t("El tamaño de la letra y el cursor, en una terminal de verdad.", "The text size and the cursor, in a real terminal."))}
        <div class="ob-chunk ob-term" data-cursor-style="${s.cursorStyle}" style="--size: ${s.fontSize}px">
          <div class="ob-term-bar"><span class="ob-term-tab">${icons.terminal}<span>${esc(name)}</span></span></div>
          <div class="ob-term-body"></div>
        </div>
        <div class="ob-chunk ob-toolbar">
          <span class="ob-aa small" aria-hidden="true">Aa</span>
          <input type="range" class="ob-range" min="10" max="22" step="1" value="${s.fontSize}" data-size aria-label="${t("Tamaño de letra", "Font size")}">
          <span class="ob-aa big" aria-hidden="true">Aa</span>
          <span class="ob-sep"></span>
          <span class="ob-cursors" role="radiogroup" aria-label="Cursor">
            ${CURSORS.map(
              ([value, label]) => `
              <button class="ob-cursor-btn ${s.cursorStyle === value ? "on" : ""}" data-pick-cursor="${value}" role="radio" aria-checked="${s.cursorStyle === value}" title="${label}"><i class="ob-glyph ${value}"></i></button>`,
            ).join("")}
          </span>
        </div>
        ${nav()}`;
    },
    mount(el, alive) {
      void typeDemo(el.querySelector<HTMLElement>(".ob-term-body")!, alive);
    },
  };

  const agents: Step = {
    render: () => `
      ${header(t("Tus agentes", "Your agents"), t("Beauty Shell sigue lo que hacen en la barra lateral y les deja hablar entre sesiones.", "Beauty Shell follows what they do in the sidebar and lets them talk across sessions."))}
      <div class="ob-chunk ob-agents"><span class="ob-searching">${icons.spinner}${t("Buscando en tu equipo…", "Searching your computer…")}</span></div>
      ${nav()}`,
    mount(el, alive) {
      void showAgents(el.querySelector<HTMLElement>(".ob-agents")!, alive);
    },
  };

  const keys: Step = {
    render: () => `
      ${header(t("Cuatro atajos para empezar", "Four shortcuts to get started"), t("Con estos ya te movés. El resto está en Ajustes → Atajos.", "These get you going. The rest are in Settings → Shortcuts."))}
      <div class="ob-chunk ob-keys">
        ${SHORTCUTS.map(
          ([combo, what], i) => `
          <div class="ob-key-row" style="--i: ${i}">
            <span class="ob-combo">${combo.map((k) => `<kbd class="ob-key">${esc(k)}</kbd>`).join("")}</span>
            <span class="ob-key-what">${what}</span>
          </div>`,
        ).join("")}
      </div>
      ${nav()}`,
  };

  const ready: Step = {
    render() {
      const title = rising([t("Todo listo", "All set")]);
      return `
        <h1 class="ob-hero" aria-label="${t("Todo listo", "All set")}">${title.html}</h1>
        <p class="ob-sub ob-late" style="--after: ${title.count * LETTER_MS + 300}ms">${t("Podés cambiar todo esto cuando quieras en Ajustes, con Ctrl+,", "You can change all of this anytime in Settings, with Ctrl+,")}</p>
        <button class="ob-primary ob-late" data-finish style="--after: ${title.count * LETTER_MS + 450}ms">${t("Abrir terminal", "Open terminal")}${icons.arrowRight}</button>`;
    },
  };

  const steps: Step[] = [welcome, theme, shell, look, agents, keys, ready];

  async function typeDemo(body: HTMLElement, alive: () => boolean) {
    const p = prompt(ctx.settings.shell, ctx.home);
    body.innerHTML = `<div class="ob-line-in"><span class="ob-prompt">${p}</span> <span class="ob-typed"></span><i class="ob-caret"></i></div>`;
    await wait(700);
    const typed = body.querySelector<HTMLElement>(".ob-typed")!;
    for (const ch of "claude") {
      if (!alive()) return;
      typed.textContent += ch;
      await wait(85);
    }
    await wait(350);
    if (!alive()) return;
    body.querySelector(".ob-caret")?.remove();
    const out = [
      `<span class="ob-claude">✻</span> <b>Welcome to Claude Code!</b>`,
      `<span class="ob-dim">  ${t("/help para ayuda · /status para ver tu configuración", "/help for help, /status for your current setup")}</span>`,
      `<span class="ob-dim">  cwd: ${esc(ctx.home.replace(/[\\/]+$/, ""))}</span>`,
    ];
    for (const line of out) {
      if (!alive()) return;
      body.insertAdjacentHTML("beforeend", `<div class="ob-line-in">${line}</div>`);
      await wait(220);
    }
    if (!alive()) return;
    body.insertAdjacentHTML("beforeend", `<div class="ob-line-in ob-input"><span class="ob-dim">&gt;</span> <i class="ob-caret"></i></div>`);
  }

  async function showAgents(box: HTMLElement, alive: () => boolean) {
    const [found] = await Promise.all([ctx.findAgents().catch(() => ({}) as Record<string, string | null>), wait(600)]);
    if (!alive()) return;
    const installed = AGENTS.filter((a) => found[a.id]);
    const missing = AGENTS.length - installed.length;
    const chips = installed
      .map(
        (a, i) =>
          `<span class="ob-agent" style="--i: ${i}; --brand: ${a.color ?? "currentColor"}"><span class="ob-agent-icon">${a.icon}</span>${esc(a.name)}</span>`,
      )
      .join("");
    const claude = found.claude
      ? `<div class="ob-connect-card" style="--i: ${installed.length}">
          <div class="ob-connect-text">
            <b>${t("Mensajes entre sesiones", "Messages between sessions")}</b>
            <span>${t("Que Claude Code vea tus otras terminales y les escriba.", "Let Claude Code see your other terminals and write to them.")}</span>
          </div>
          <button class="ob-primary ob-connect ${ctx.claudeConnected() ? "done" : ""}" data-connect>
            <span class="ob-swap" aria-hidden="true"><span class="ob-swap-a">${icons.plus}</span><span class="ob-swap-b">${icons.check}</span></span>
            <span class="ob-connect-label">${ctx.claudeConnected() ? t("Conectado", "Connected") : t("Conectar", "Connect")}</span>
          </button>
        </div>`
      : "";
    box.innerHTML = installed.length
      ? `<div class="ob-agent-list">${chips}</div>
         ${missing ? `<p class="ob-agents-more" style="--i: ${installed.length}">${t(`y ${missing} más que podés instalar cuando quieras`, `and ${missing} more you can install whenever you like`)}</p>` : ""}
         ${claude}`
      : `<p class="ob-agents-none">${t("No encontramos agentes todavía. Cuando instales Claude Code, Codex o Gemini CLI, Beauty Shell los va a reconocer solo.", "We didn't find any agents yet. When you install Claude Code, Codex or Gemini CLI, Beauty Shell will recognize them on its own.")}</p>`;
  }

  function show(index: number, animateOut = true) {
    if (busy) return;
    busy = true;
    if (index !== step) liquid?.flow(index > step ? 1 : -1);
    const swap = () => {
      step = index;
      const id = ++run;
      stage.innerHTML = `<div class="ob-step" data-step="${index}">${steps[index].render()}</div>`;
      const el = stage.querySelector<HTMLElement>(".ob-step")!;
      el.classList.add("entering");
      steps[index].mount?.(el, () => run === id);
      dots.innerHTML = index === 0 ? "" : steps.map((_, i) => `<i class="${i === index ? "on" : ""}"></i>`).join("");
      busy = false;
      stage.querySelector<HTMLElement>("[data-next], [data-finish]")?.focus({ preventScroll: true });
    };
    const current = stage.querySelector(".ob-step");
    if (!current || !animateOut) return swap();
    current.classList.add("leaving");
    setTimeout(swap, 150);
  }

  function choose(attr: string, value: string) {
    stage.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((b) => {
      const on = b.getAttribute(attr) === value;
      b.classList.toggle("on", on);
      if (b.hasAttribute("role")) b.setAttribute("aria-checked", String(on));
    });
  }

  function finish() {
    markOnboarded();
    run++;
    window.removeEventListener("keydown", onKey, true);
    root.classList.add("closing");
    setTimeout(() => {
      liquid?.stop();
      root.remove();
    }, 300);
    ctx.done();
  }

  root.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-next]")) return show(Math.min(step + 1, steps.length - 1));
    if (target.closest("[data-back]")) return show(Math.max(step - 1, 0));
    if (target.closest("[data-finish]")) return finish();

    const themeBtn = target.closest<HTMLElement>("[data-pick-theme]");
    if (themeBtn) {
      ctx.update({ theme: themeBtn.dataset.pickTheme as ThemePref });
      return choose("data-pick-theme", themeBtn.dataset.pickTheme!);
    }
    const shellBtn = target.closest<HTMLElement>("[data-pick-shell]");
    if (shellBtn) {
      ctx.update({ shell: shellBtn.dataset.pickShell! });
      return choose("data-pick-shell", shellBtn.dataset.pickShell!);
    }
    const cursor = target.closest<HTMLElement>("[data-pick-cursor]");
    if (cursor) {
      ctx.update({ cursorStyle: cursor.dataset.pickCursor as CursorPref });
      stage.querySelector(".ob-term")?.setAttribute("data-cursor-style", cursor.dataset.pickCursor!);
      return choose("data-pick-cursor", cursor.dataset.pickCursor!);
    }
    const connect = target.closest<HTMLButtonElement>("[data-connect]");
    if (connect && !connect.classList.contains("done")) {
      const label = connect.querySelector(".ob-connect-label")!;
      connect.disabled = true;
      label.textContent = t("Conectando…", "Connecting…");
      const ok = await ctx.connectClaude().catch(() => false);
      connect.disabled = false;
      connect.classList.toggle("done", ok);
      label.textContent = ok ? t("Conectado", "Connected") : t("Probar de nuevo", "Try again");
    }
  });

  root.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.hasAttribute("data-size")) return;
    const size = clampFontSize(Number(input.value));
    ctx.update({ fontSize: size });
    stage.querySelector<HTMLElement>(".ob-term")?.style.setProperty("--size", `${size}px`);
  });

  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.altKey || e.metaKey || /^F\d+$/.test(e.key)) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const onControl = (e.target as HTMLElement).closest?.("button, select, input");
    if (e.key === "Enter" && !onControl) {
      e.preventDefault();
      if (step === steps.length - 1) finish();
      else show(step + 1);
    }
  }
  window.addEventListener("keydown", onKey, true);

  show(0, false);
}
